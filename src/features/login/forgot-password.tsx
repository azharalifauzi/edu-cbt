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

const formSchema = z.object({
  email: z.string({ message: 'Email is required' }).email('Email is invalid'),
})

type Data = z.infer<typeof formSchema>

const SignInPage = () => {
  const [isSent, setSent] = useState(false)
  const form = useForm<Data>({
    resolver: zodResolver(formSchema),
  })
  const { control, handleSubmit, clearErrors } = form

  const submitMutation = useMutation({
    mutationFn: async (data: Data) => {
      const res = client.api.v1.user['forgot-password'].$post({
        json: data,
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
                Reset password request was sent.
              </div>
              <div>
                We've already sent the forgot password link to your email.
                Please check your email to create new password.
              </div>
            </>
          ) : (
            <>
              <div className="font-bold text-2xl mb-8">Reset your password</div>
              <Form {...form}>
                <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
                  <FormField
                    control={control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" />
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
                      : 'Forgot password'}
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
