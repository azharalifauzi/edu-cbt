import Layout from '@/components/layout'
import Link from '@/components/link'
import { withGlobalProviders } from '@/components/providers'
import { Button } from '@/components/ui/button'

const CourseManagement = () => {
  return (
    <Layout>
      <div className="flex items-center justify-between">
        <div>
          <div className="font-bold text-3xl mb-1">Manage Course</div>
          <div className="text-gray-500">
            Provide high quality for best students
          </div>
        </div>
        <Button asChild>
          <Link to="/course-management/new">Add New Course</Link>
        </Button>
      </div>
    </Layout>
  )
}

export default withGlobalProviders(CourseManagement)
