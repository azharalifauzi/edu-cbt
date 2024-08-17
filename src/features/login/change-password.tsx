import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { client, unwrapResponse } from '@/utils/fetcher'
import { useMutation } from '@tanstack/react-query'
import { withGlobalProviders } from '@/components/providers'
import SignInIllustration from './assets/sign-in-illustration.png?url'
import Header from './components/header'
import Link from '@/components/link'
import { useState } from 'react'
import { useRouteContext } from '@/hooks/route'

const formSchema = z
  .object({
    password: z.string({ message: 'New Password is required' }),
    confirmPassword: z.string({ message: 'Confirm Password is required' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'], // path of error
  })

type Data = z.infer<typeof formSchema>

const SignInPage = () => {
  const [isSent, setSent] = useState(false)
  const form = useForm<Data>({
    resolver: zodResolver(formSchema),
  })
  const { url } = useRouteContext()
  const { control, handleSubmit, clearErrors } = form

  const submitMutation = useMutation({
    mutationFn: async (data: Data) => {
      const res = client.api.v1.user['forgot-password'].change.$post({
        json: {
          password: data.password,
          token: url.searchParams.get('token') ?? '',
        },
      })
      await unwrapResponse(res)
    },
    onSuccess: () => {
      setSent(true)
    },
  })

  async function onSubmit(data: Data) {
    submitMutation.mutate(data)
  }

  return (
    <main>
      <Header />
      <div className="grid grid-cols-2 items-center h-screen">
        <div className="w-full -mt-8 p-10 max-w-lg mx-auto">
          {isSent ? (
            <>
              <div className="font-bold text-2xl mb-8">
                You've successfully changed your password.
              </div>
              <div className="mb-4">
                Try to login again using your new password.
              </div>
              <Button asChild variant="purple" className="px-10">
                <Link to="/login">Go to Login page</Link>
              </Button>
            </>
          ) : (
            <>
              <div className="font-bold text-2xl mb-8">
                Change your password
              </div>
              <Form {...form}>
                <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
                  <FormField
                    control={control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <Input {...field} type="password" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input {...field} type="password" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    disabled={submitMutation.isPending}
                    className="mt-4"
                    variant="purple"
                  >
                    {submitMutation.isPending
                      ? 'Loading...'
                      : 'Create new password'}
                  </Button>
                </form>
              </Form>
            </>
          )}
        </div>
        <div className="bg-purple-700 flex items-center justify-center h-full px-10">
          <img src={SignInIllustration} className="max-w-[500px] w-full" />
        </div>
      </div>
    </main>
  )
}

export default withGlobalProviders(SignInPage)
