import Layout from '@/components/layout'
import Link from '@/components/link'
import { withGlobalProviders } from '@/components/providers'
import Table from '@/components/table'
import { Button } from '@/components/ui/button'
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import dayjs from 'dayjs'
import humanizeDuration from 'humanize-duration'
import React from 'react'

interface Course {
  id: number
  name: string
  image: string | null
  category: {
    name: string
  }
  createdAt: string
  studentData: {
    startedAt: string | null
    finishedAt: string | null
    joinedAt: string
  }
  testDuration: number
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
  columnHelper.accessor('studentData.joinedAt', {
    header: () => <span>Date Joined</span>,
    cell: (info) => (
      <span className="font-semibold">
        {dayjs(info.getValue()).format('DD MMM YYYY')}
      </span>
    ),
  }),
  columnHelper.accessor('category.name', {
    header: () => <span>Category</span>,
    cell: (info) => <span className="font-bold">{info.getValue()}</span>,
  }),
  columnHelper.accessor('id', {
    id: 'action',
    header: () => <span className="w-full text-center block">Action</span>,
    cell: (info) => {
      const {
        studentData: { finishedAt, startedAt },
      } = info.row.original

      if (!startedAt)
        return (
          <Button asChild className="mx-auto flex w-max" variant="purple">
            <Link to={`/courses/${info.getValue()}`}>Start Test</Link>
          </Button>
        )

      if (startedAt && !finishedAt) {
        return (
          <Button asChild className="mx-auto flex w-max" variant="purple">
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
