import AdminLayout from '@/features/admin/components/admin-layout'
import { withGlobalProviders } from '@/components/providers'
import { useUser } from '@/hooks/user'

const Page = () => {
  const { user } = useUser()

  return (
    <AdminLayout>
      <div className="p-10">
        <h1 className="text-2xl font-semibold">
          Hi {user?.name}, <br />
          Welcome to Admin Dashboard
        </h1>
      </div>
    </AdminLayout>
  )
}

export default withGlobalProviders(Page)
