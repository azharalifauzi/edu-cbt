import AdminLayout from '@/features/admin/components/admin-layout'
import { Button } from '@/components/ui/button'
import PermissionTable from './components/table'
import PermissionForm from './components/form'
import { useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { client, QueryKey, unwrapResponse } from '@/utils/fetcher'
import Pagination from '@/components/pagination'
import { withGlobalProviders } from '@/components/providers'

const PermissionFeature = () => {
  const [isOpen, setOpen] = useState(false)
  const [page, setPage] = useState(1)

  const { data } = useQuery({
    queryKey: [QueryKey.Permissions, page],
    queryFn: async () => {
      const res = client.api.v1.permission.$get({
        query: {
          page: page.toString(),
        },
      })

      const json = await unwrapResponse(res)

      return json.data
    },
    placeholderData: keepPreviousData,
  })

  return (
    <AdminLayout>
      <div className="p-10">
        <div className="flex justify-between">
          <div>
            <h1 className="text-3xl font-medium mb-2">Permissions</h1>
            <div>
              Create permissions that can be assigned to different roles
            </div>
          </div>
          <PermissionForm
            key={`add-permission-form-${isOpen}`}
            isOpen={isOpen}
            onOpen={() => setOpen(true)}
            onClose={() => setOpen(false)}
          >
            <Button>Add permission</Button>
          </PermissionForm>
        </div>
        <div className="mt-8">
          <PermissionTable data={data?.data || []} />
          <Pagination
            className="justify-end mt-4"
            totalPages={data?.pageCount ?? 1}
            currentPage={page}
            onPageChange={setPage}
          />
        </div>
      </div>
    </AdminLayout>
  )
}

export default withGlobalProviders(PermissionFeature)
