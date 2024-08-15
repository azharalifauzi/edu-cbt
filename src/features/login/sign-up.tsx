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

const formSchema = z
  .object({
    name: z.string({ message: 'Complete name is required' }),
    email: z.string({ message: 'Email is required' }).email('Email is invalid'),
    password: z.string({ message: 'Password is required' }),
    confirmPassword: z.string({ message: 'Confirm Password is required' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'], // path of error
  })

type Data = z.infer<typeof formSchema>

const SignUpPage = () => {
  const form = useForm<Data>({
    resolver: zodResolver(formSchema),
  })
  const { control, handleSubmit, clearErrors } = form

  const submitMutation = useMutation({
    mutationFn: async (data: Data) => {
      const res = client.api.v1.user['sign-up'].$post({
        json: data,
      })

      await unwrapResponse(res)

      clearErrors('password')
      window.location.reload()
    },
  })

  async function onSubmit(data: Data) {
    submitMutation.mutate(data)
  }

  return (
    <main>
      <Header />
      <div className="grid grid-cols-2 items-center h-screen">
        <div className="w-full pt-32 p-10 mx-auto overflow-y-auto h-screen">
          <div className="max-w-lg mx-auto">
            <div className="font-bold text-2xl mb-4">Sign Up</div>
            <Form {...form}>
              <form className="grid gap-3" onSubmit={handleSubmit(onSubmit)}>
                <FormField
                  control={control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Complete Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                <FormField
                  control={control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
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
                    : 'Create My Account'}
                </Button>
              </form>
            </Form>
          </div>
        </div>
        <div className="bg-purple-700 flex items-center justify-center h-full px-10">
          <img src={SignInIllustration} className="max-w-[500px] w-full" />
        </div>
      </div>
    </main>
  )
}

export default withGlobalProviders(SignUpPage)
