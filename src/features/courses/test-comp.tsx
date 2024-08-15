import { withGlobalProviders } from '@/components/providers'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useParams } from '@/hooks/route'
import { useUser } from '@/hooks/user'
import { cn } from '@/utils'
import { client, QueryKey, unwrapResponse } from '@/utils/fetcher'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import humanizeDuration from 'humanize-duration'
import { Book, CheckCircle2, ChevronRightCircle } from 'lucide-react'
import React, { useState } from 'react'
import { produce } from 'immer'
import { Button } from '@/components/ui/button'
import Link from '@/components/link'
import { useInterval } from '@/hooks'
import dayjs from 'dayjs'

interface Props {
  questions: {
    id: number
    question: string
    answerOptions: {
      id: number
      value: string
    }[]
  }[]
  /**
   * In case user reload the page, the answer is saved.
   * Key : index of question
   * value: Id of answer option
   */
  defaultAnswers: Record<number, number>
  startedAt: string
  finishedAt: string | null
  course: {
    name: string
    image: string | null
    testDuration: number
  }
}

const TestCompFeature: React.FC<Props> = ({
  defaultAnswers,
  questions,
  startedAt,
  finishedAt,
  course,
}) => {
  const { id } = useParams()
  const { user } = useUser()
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>(defaultAnswers)
  const [isFinished, setFinished] = useState(!!finishedAt)
  const [progress, setProgress] = useState(1)
  const [durationLeft, setDurationLeft] = useState(course.testDuration * 60)

  const queryClient = useQueryClient()

  const activeQuestion = questions?.[currentQuestionIdx]
  const activeAnswer =
    answers[currentQuestionIdx] ?? activeQuestion?.answerOptions[0].id
  const isLastQuestion = currentQuestionIdx + 1 === questions?.length

  useInterval(() => {
    const now = dayjs().unix()
    const startTime = dayjs(startedAt).unix()
    const duration = course.testDuration
    const usedTime = now - startTime
    const timeLeft = duration * 60 - usedTime

    setDurationLeft(timeLeft)
    setProgress(timeLeft / (duration * 60))

    if (timeLeft < 0 && !isFinished) {
      handleFinish.mutate()
    }
  }, 1000)

  const handleSaveAnswer = useMutation({
    mutationFn: async () => {
      if (!activeQuestion) {
        return
      }

      const res = client.api.v1.course[':id'].answer.$post({
        param: {
          id: id!,
        },
        json: {
          questionId: activeQuestion.id,
          answerId: activeAnswer,
        },
      })

      await unwrapResponse(res)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QueryKey.Answers] })
    },
  })

  const handleFinish = useMutation({
    mutationFn: async () => {
      const res = client.api.v1.course[':id'].finish.$post({
        param: {
          id: id!,
        },
      })

      await unwrapResponse(res)
    },
    onSuccess: () => {
      setFinished(true)
      queryClient.invalidateQueries({ queryKey: [QueryKey.MyCourses] })
    },
  })

  const handleNext = () => {
    setAnswers(
      produce((draft) => {
        if (!draft[currentQuestionIdx] && activeQuestion) {
          draft[currentQuestionIdx] = activeQuestion.answerOptions[0].id
        }
      })
    )

    if (isLastQuestion) {
      handleSaveAnswer.mutate(undefined, {
        onSuccess: () => {
          handleFinish.mutate()
        },
      })
      return
    }

    handleSaveAnswer.mutate(undefined, {
      onSuccess: () => {
        setCurrentQuestionIdx((c) => c + 1)
      },
    })
  }

  return (
    <main>
      {!isFinished && (
        <div className="fixed bottom-6 left-6 flex items-center gap-3 bg-orange-100 pl-3 pr-4 py-3 rounded-md z-10">
          <svg
            className="-rotate-90 scale-y-[-1]"
            width="40"
            height="40"
            viewBox="0 0 180 180"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="90"
              cy="90"
              r="83.5"
              stroke="#fed7aa"
              strokeWidth="13"
              className="transition-all duration-200 ease-in-out"
            />
            <circle
              cx="90"
              cy="90"
              r="83.5"
              stroke="#F6770B"
              strokeWidth="13"
              strokeDasharray={Math.PI * 2 * 83.5}
              strokeDashoffset={Math.PI * 2 * (1 - progress) * 83.5}
              className="transition-all duration-200 ease-in-out"
            />
          </svg>
          <div className="text-sm font-semibold">
            {humanizeDuration(durationLeft * 1000)} left
          </div>
        </div>
      )}
      <header className="flex items-center h-16 border-b border-gray-100 justify-between px-4 fixed top-0 left-0 right-0 z-10 bg-white">
        <div className="flex items-center gap-2">
          {course?.image ? (
            <img
              src={course?.image ?? ''}
              className="h-8 w-8 rounded-full object-cover object-center"
            />
          ) : (
            <Book />
          )}
          <div>
            <div className="text-sm font-semibold">{course?.name}</div>
            <div className="text-xs text-gray-400">
              Duration:{' '}
              {course?.testDuration
                ? humanizeDuration(course?.testDuration * 60 * 1000)
                : 'Infinity'}
            </div>
          </div>
        </div>
        {!isFinished && (
          <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 font-semibold bg-orange-100 text-orange-600 px-4 py-2 rounded-lg text-sm">
            Question {currentQuestionIdx + 1} of {questions.length}
          </div>
        )}
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="text-xs text-gray-400">Howdy</div>
            <div className="font-semibold text-sm">{user?.name}</div>
          </div>
          <Avatar>
            <AvatarImage
              className="object-cover object-center"
              src={user?.image ?? undefined}
            />
            <AvatarFallback>{user?.name[0]}</AvatarFallback>
          </Avatar>
        </div>
      </header>

      {isFinished && (
        <div className="max-w-3xl mx-auto pt-32 px-6 text-center flex flex-col items-center">
          <img
            src={course?.image ?? ''}
            className="rounded-full object-cover object-center h-[200px] w-[200px] mb-8"
          />
          <div className="text-4xl font-bold mb-4">
            Congratulations! <br /> You Have Finished Test
          </div>
          <div className="text-gray-600 mb-10 max-w-[450px]">
            Hopefully you will get a better result to prepare your great future
            career soon enough
          </div>
          <Button asChild variant="purple" className="w-44">
            <Link to={`/courses/${id}/report`}>View Test Result</Link>
          </Button>
        </div>
      )}

      {!isFinished && (
        <div className="max-w-3xl mx-auto pt-32 px-6">
          <div className="text-4xl font-semibold text-center mb-12 leading-snug">
            {activeQuestion?.question}
          </div>
          <div className="grid gap-6">
            {activeQuestion?.answerOptions.map((o) => (
              <button
                key={`options-${o.id}`}
                className={cn(
                  'border-2 border-transparent outline outline-gray-200 px-6 py-4 rounded-full flex items-center gap-3 justify-between',
                  {
                    'border-black border-2 outline-transparent':
                      activeAnswer === o.id,
                  }
                )}
                onClick={() => {
                  setAnswers(
                    produce((draft) => {
                      draft[currentQuestionIdx] = o.id
                    })
                  )
                }}
              >
                <div className="flex items-center gap-3">
                  <ChevronRightCircle />
                  <div>{o.value}</div>
                </div>
                {activeAnswer === o.id && (
                  <CheckCircle2 fill="black" className="text-white" />
                )}
              </button>
            ))}
          </div>
          <div className="flex justify-center mt-10">
            <Button onClick={handleNext} className="w-64 h-14" variant="purple">
              {isLastQuestion ? 'Finish Test' : 'Save & Next Question'}
            </Button>
          </div>
        </div>
      )}
    </main>
  )
}

export default withGlobalProviders(TestCompFeature)
