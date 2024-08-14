import Layout from '@/components/layout'
import { withGlobalProviders } from '@/components/providers'
import { Button } from '@/components/ui/button'
import { cn, navigate } from '@/utils'
import { client, QueryKey, unwrapResponse } from '@/utils/fetcher'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

const OverviewFeature = () => {
  const queryClient = useQueryClient()

  const { data: courses } = useQuery({
    queryKey: [QueryKey.Courses],
    queryFn: async () => {
      const res = client.api.v1.course.$get({
        param: {
          page: '1',
          size: '999',
        },
      })

      const { data } = await unwrapResponse(res)
      return data.data
    },
  })

  const { data: myCourses } = useQuery({
    queryKey: [QueryKey.MyCourses],
    queryFn: async () => {
      const res = client.api.v1.course['my-courses'].$get({
        param: {
          page: '1',
          size: '999',
        },
      })

      const { data } = await unwrapResponse(res)
      return data.data
    },
  })

  const handleJoin = useMutation({
    mutationFn: async (id: number) => {
      const res = client.api.v1.course[':id'].join.$post({
        param: {
          id: id.toString(),
        },
      })

      await unwrapResponse(res)

      return { id }
    },

    onSuccess: (data) => {
      toast(`Success Join the Course`, {
        description: "Let's start take the test now",
        action: {
          label: 'Start Test',
          onClick: () => {
            navigate(`/courses/${data.id}`)
          },
        },
      })

      queryClient.invalidateQueries({ queryKey: [QueryKey.MyCourses] })
    },
  })

  return (
    <Layout>
      <div className="mb-8">
        <div className="font-bold text-3xl mb-1">
          Pick courses that you like
        </div>
        <div className="text-gray-500">
          Choose from over 220,000 online courses with new additions published
          every month
        </div>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,_minmax(300px,1fr))] gap-6">
        {courses?.map((course) => {
          const myCourse = myCourses?.find((c) => c.id === course.id)
          const hasJoined = !!myCourse
          const hasStarted = !!myCourse?.studentData.startedAt
          const hasFinished = !!myCourse?.studentData.finishedAt

          return (
            <div
              key={course.slug}
              className="border border-gray-200 rounded-lg p-4 flex flex-col justify-between pb-6"
            >
              <div>
                <img
                  src={course.image ?? ''}
                  className="aspect-[3/2] object-cover object-center"
                />
                <div className="mt-2 font-semibold text-lg line-clamp-2 leading-tight mb-1">
                  {course.name}
                </div>
                <div className="text-sm text-gray-400 line-clamp-1">
                  By {course.teachers.map((t) => t.name).join(', ')}
                </div>
              </div>
              <Button
                onClick={() => {
                  if (!hasJoined) {
                    handleJoin.mutate(course.id)
                  } else if (hasFinished) {
                    navigate(`/courses/${course.id}/rapport`)
                  } else {
                    navigate(`/courses/${course.id}`)
                  }
                }}
                className={cn('w-full mt-4', {
                  'bg-purple-600 hover:bg-purple-700': hasJoined,
                })}
              >
                {hasFinished
                  ? 'See Rapport'
                  : hasStarted && !hasFinished
                  ? 'Continue Test'
                  : hasJoined
                  ? 'Start Test'
                  : 'Join Course'}
              </Button>
            </div>
          )
        })}
      </div>
    </Layout>
  )
}

export default withGlobalProviders(OverviewFeature)
