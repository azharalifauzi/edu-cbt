import Layout from '@/components/layout'
import { withGlobalProviders } from '@/components/providers'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { cn } from '@/utils'
import { Calendar } from 'lucide-react'
import React from 'react'

interface Props {
  courseName: string
  courseCatetegory: string
  courseImage: string | null
  studentAnswers: {
    question: string
    isCorrect: boolean
    questionId: number
  }[]
  isPassed: boolean | null
}

const RapportFeature: React.FC<Props> = ({
  courseCatetegory,
  courseImage,
  courseName,
  studentAnswers,
  isPassed,
}) => {
  return (
    <Layout>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/courses">My Courses</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem className="font-semibold">
            Report Details
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="px-6 mt-10">
        <div className="flex items-center justify-between gap-10">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={courseImage ?? ''}
                className="w-[150px] h-[150px] rounded-full object-cover object-center"
              />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-10 bg-orange-100 rounded-full text-center font-bold text-orange-500 py-1 px-6">
                {courseCatetegory}
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-5">{courseName}</div>
              <div className="flex items-center gap-2">
                <Calendar />
                <span className="font-bold">
                  {studentAnswers.filter((a) => a.isCorrect).length} of{' '}
                  {studentAnswers.length} correct
                </span>
              </div>
            </div>
          </div>
          <div
            className={cn(
              'bg-green-500 text-white py-4 px-5 rounded-md font-bold outline-dashed  outline-green-500 outline-offset-[6px]',
              {
                'bg-red-500 outline-red-500': !isPassed,
              }
            )}
          >
            {isPassed ? 'Passed' : 'Not Passed'}
          </div>
        </div>
        <div className="grid gap-5 mt-8">
          {studentAnswers.map((a) => (
            <div
              key={`answer-${a.questionId}`}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-2xl"
            >
              <div>
                <div className="mb-1 text-gray-600">Question:</div>
                <div className="text-xl font-bold">{a.question}</div>
              </div>
              <div
                className={cn(
                  'px-5 py-2 rounded-full bg-green-500 text-white font-bold',
                  {
                    'bg-red-500': !a.isCorrect,
                  }
                )}
              >
                {a.isCorrect ? 'Success' : 'Failed'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}

export default withGlobalProviders(RapportFeature)
