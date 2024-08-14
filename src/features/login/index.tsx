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

const formSchema = z.object({
  email: z.string({ message: 'Email is required' }).email('Email is invalid'),
  password: z.string({ message: 'Password is required' }),
})

type Data = z.infer<typeof formSchema>

const SignInPage = () => {
  const form = useForm<Data>({
    resolver: zodResolver(formSchema),
  })
  const { control, handleSubmit, setError, clearErrors } = form

  const submitMutation = useMutation({
    mutationFn: async (data: Data) => {
      const res = client.api.v1.user['sign-in'].$post({
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
    <div className="p-10 h-screen flex items-center justify-center">
      <div className="w-full -mt-8">
        <div className="text-center font-bold text-2xl mb-8">
          Hi there, Welcome back!
        </div>
        <Form {...form}>
          <form
            className="grid gap-2 max-w-xs mx-auto"
            onSubmit={handleSubmit(onSubmit)}
          >
            <FormField
              control={control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
            <Button disabled={submitMutation.isPending} className="mt-4">
              {submitMutation.isPending ? 'Loading...' : 'Sign In'}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  )
}

export default withGlobalProviders(SignInPage)
