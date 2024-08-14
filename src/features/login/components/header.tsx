import { LogoEduCBT } from '@/assets'
import Link from '@/components/link'
import { Button } from '@/components/ui/button'
import { useRouteContext } from '@/hooks/route'

const Header = () => {
  const {
    url: { pathname },
  } = useRouteContext()

  return (
    <header className="flex items-center justify-between fixed top-0 left-0 right-0 h-24 px-10">
      <div className="font-bold text-xl flex items-center gap-1">
        <LogoEduCBT className="h-8 w-8 text-purple-700" />
        EduCBT
      </div>
      {pathname === '/login' ? (
        <Button asChild className="px-6">
          <Link to="/sign-up">Sign Up</Link>
        </Button>
      ) : (
        <Button asChild className="px-6">
          <Link to="/login">Sign In</Link>
        </Button>
      )}
    </header>
  )
}

export default Header
