import Link from '@/components/link'
import { useParams } from '@/hooks/route'
import { client, QueryKey } from '@/utils/fetcher'
import { cn } from '@/utils'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft } from 'lucide-react'
import React from 'react'

const OrganizationDetailLayout: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => {
  const { id } = useParams()

  const { data } = useQuery({
    queryKey: [QueryKey.OrganizationDetail, id],
    queryFn: async () => {
      const res = await client.api.v1.organization[':id'].$get({
        param: {
          id: id ?? '1',
        },
      })
      const json = await res.json()
      return json.data
    },
    enabled: !!id,
  })

  return (
    <main>
      <aside className="fixed top-0 bottom-0 left-0 w-72 px-10 py-6">
        <Link
          to="/admin/organizations"
          className="font-medium mb-8 flex items-center -ml-4"
        >
          <ChevronLeft className="mr-1 h-5 w-5" />
          Back
        </Link>
        <div className="mb-6">
          <div className="text-sm">Organizations</div>
          <div className="text-lg font-medium">{data?.name}</div>
        </div>
        <div className="grid gap-3">
          <Link
            className={(isActive) =>
              cn('text-lg hover:underline', {
                underline: isActive,
              })
            }
            to={`/admin/organizations/${id}`}
            end
          >
            Details
          </Link>
          <Link
            className={(isActive) =>
              cn('text-lg hover:underline', {
                underline: isActive,
              })
            }
            to={`/admin/organizations/${id}/users`}
          >
            Users
          </Link>
        </div>
      </aside>
      <div className="fixed top-0 left-72 bottom-0 right-0 overflow-auto">
        {children}
      </div>
    </main>
  )
}

export default OrganizationDetailLayout
