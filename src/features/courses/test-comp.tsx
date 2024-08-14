import { withGlobalProviders } from '@/components/providers'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useParams } from '@/hooks/route'
import { useUser } from '@/hooks/user'
import { cn } from '@/utils'
import { client, QueryKey, unwrapResponse } from '@/utils/fetcher'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import humanizeDuration from 'humanize-duration'
import { Book, CheckCircle2, ChevronRightCircle } from 'lucide-react'
import React, { useState } from 'react'
import { produce } from 'immer'
import { Button } from '@/components/ui/button'
import Link from '@/components/link'

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
  startedAt: string | null
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

  const queryClient = useQueryClient()

  const activeQuestion = questions?.[currentQuestionIdx]
  const activeAnswer =
    answers[currentQuestionIdx] ?? activeQuestion?.answerOptions[0].id
  const isLastQuestion = currentQuestionIdx + 1 === questions?.length

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
            <Link to={`/courses/${id}/rapport`}>View Test Result</Link>
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
