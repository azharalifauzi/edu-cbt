import Layout from '@/components/layout'
import Link from '@/components/link'
import { queryClient, withGlobalProviders } from '@/components/providers'
import Table from '@/components/table'
import { Button } from '@/components/ui/button'
import { QueryKey } from '@/utils/fetcher'
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import dayjs from 'dayjs'
import humanizeDuration from 'humanize-duration'
import React from 'react'

interface Question {
  id: number
  question: string
  isCorrect: boolean
}

interface Course {
  id: number
  name: string
  slug: string
  image: string | null
  categoryId: number
  createdAt: string
  updatedAt: string
  publishedAt: string
  testDuration: number
  studentId: number
  joinedAt: string | null
  finishedAt: string | null
  startedAt: string | null
  categoryName: string
  questionCounts: number
  correctAnswers: number
  questions: Question[]
}

interface Props {
  data: Course[]
}

const columnHelper = createColumnHelper<Course>()

const columns = [
  columnHelper.accessor('name', {
    header: () => <span>Course</span>,
    cell: (info) => {
      const course = info.row.original

      return (
        <div className="flex items-center gap-3">
          <img
            src={course.image ?? ''}
            className="w-16 h-16 rounded-full object-cover object-center"
          />
          <div>
            <div className="text-lg font-bold mb-1 line-clamp-2 leading-tight">
              {course.name}
            </div>
            <div className="text-gray-500">
              Duration:{' '}
              {course.testDuration
                ? humanizeDuration(course.testDuration * 60 * 1000)
                : 'Infinity'}
            </div>
          </div>
        </div>
      )
    },
    minSize: 300,
  }),
  columnHelper.accessor('joinedAt', {
    header: () => <span>Date Joined</span>,
    cell: (info) => (
      <span className="font-semibold">
        {dayjs(info.getValue()).format('DD MMM YYYY')}
      </span>
    ),
  }),
  columnHelper.accessor('categoryName', {
    header: () => <span>Category</span>,
    cell: (info) => <span className="font-bold">{info.getValue()}</span>,
  }),
  columnHelper.accessor('id', {
    id: 'action',
    header: () => <span className="w-full text-center block">Action</span>,
    cell: (info) => {
      const { finishedAt, startedAt } = info.row.original

      if (!startedAt)
        return (
          <Button
            asChild
            className="mx-auto flex w-max"
            variant="purple"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: [QueryKey.Courses] })
            }}
          >
            <Link to={`/courses/${info.getValue()}`}>Start Test</Link>
          </Button>
        )

      if (startedAt && !finishedAt) {
        return (
          <Button
            asChild
            className="mx-auto flex w-max"
            variant="purple"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: [QueryKey.Courses] })
            }}
          >
            <Link to={`/courses/${info.getValue()}`}>Continue Test</Link>
          </Button>
        )
      }

      return (
        <Button asChild className="mx-auto flex w-max">
          <Link to={`/courses/${info.getValue()}/report`}>Report</Link>
        </Button>
      )
    },
    size: 80,
  }),
]

const MyCoursesFeature: React.FC<Props> = ({ data }) => {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <Layout>
      <div className="mb-10">
        <div className="font-bold text-3xl mb-1">My Courses</div>
        <div className="text-gray-500">Finish all given tests to grow</div>
      </div>
      <Table table={table} />
    </Layout>
  )
}

export default withGlobalProviders(MyCoursesFeature)
