import UserDetailLayout from './components/detail-layou'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { client, QueryKey, unwrapResponse } from '@/utils/fetcher'
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
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { z } from 'zod'
import { useGetUserById } from './hooks'
import AssignOrgForm from './components/assign-org-form'
import { useParams } from '@/hooks/route'
import Link from '@/components/link'
import { toast } from 'sonner'
import { withGlobalProviders } from '@/components/providers'

const formSchema = z.object({
  name: z.string({ message: 'Name is required' }).min(1, 'Name is required'),
})

type Data = z.infer<typeof formSchema>

const UserProfile = () => {
  const { id } = useParams()
  const { data } = useGetUserById()

  const form = useForm<Data>({
    resolver: zodResolver(formSchema),
  })
  const queryClient = useQueryClient()

  const { control, handleSubmit, setValue } = form

  useEffect(() => {
    setValue('name', data?.name ?? '')
  }, [data])

  const updateUser = useMutation({
    mutationFn: async (data: Data) => {
      if (!id) return
      const res = client.api.v1.user[':id'].$put({
        json: data,
        param: {
          id: id,
        },
      })

      await unwrapResponse(res)
      queryClient.invalidateQueries({
        queryKey: [QueryKey.UserProfile, id],
      })
      queryClient.invalidateQueries({
        queryKey: [QueryKey.Users],
      })
      queryClient.invalidateQueries({
        queryKey: [QueryKey.OrganizationUserList],
      })
      toast('Success update user')
    },
  })

  function onSubmit(data: Data) {
    updateUser.mutate(data)
  }

  return (
    <UserDetailLayout name={data?.name ?? ''}>
      <div className="p-10 max-w-2xl">
        <div className="text-2xl font-medium mb-8">Profile</div>
        <Form {...form}>
          <form
            className="grid gap-3 border-b border-gray-200 pb-8"
            onSubmit={handleSubmit(onSubmit)}
          >
            <FormItem>
              <FormLabel>User ID</FormLabel>
              <Input disabled value={data?.id} className="bg-gray-100" />
            </FormItem>
            <FormField
              control={control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormItem>
              <FormLabel>Email</FormLabel>
              <Input disabled value={data?.email} className="bg-gray-100" />
            </FormItem>
            <div>
              <Button className="mt-4" disabled={updateUser.isPending}>
                {updateUser.isPending ? 'Loading...' : 'Save'}
              </Button>
            </div>
          </form>
        </Form>
        <div className="flex justify-between mt-8 border-b border-gray-200 pb-8">
          <div>
            <div className="text-xl mb-1 font-medium">Organizations</div>
            <div>Choose which organizations this user belongs to</div>
          </div>
          <AssignOrgForm>
            <button className="hover:underline">Edit organizations</button>
          </AssignOrgForm>
        </div>
        <div className="border-b border-gray-200 pb-8 pt-4 grid gap-5">
          {data?.organizations.map(({ id, name }) => (
            <div key={`user-orgs-${id}`} className="flex justify-between">
              <div>{name}</div>
              <Link
                className="hover:underline"
                to={`/admin/organizations/${id}`}
              >
                View organization
              </Link>
            </div>
          ))}
        </div>
        <div className="mt-8 border-b border-gray-200 pb-8">
          <div className="text-xl mb-6 font-medium">Admin actions</div>
          <div className="mb-6">
            <div className="font-medium">Suspend and restore user</div>
            <div className="mb-3">
              Remove access to all applications temporarily until the user is
              restored
            </div>
            <Button variant="destructive">Suspend user</Button>
          </div>
          <div className="mb-6">
            <div className="font-medium">Delete user</div>
            <div className="mb-3">
              Remove the user permanently from all organizations and
              applications
            </div>
            <Button variant="destructive">Delete user</Button>
          </div>
        </div>
      </div>
    </UserDetailLayout>
  )
}

export default withGlobalProviders(UserProfile)
