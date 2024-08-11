import { z } from 'zod'
import OrganizationDetailLayout from './components/detail-layout'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from '@/hooks/route'
import { client, QueryKey, unwrapResponse } from '@/utils/fetcher'
import dayjs from 'dayjs'
import { useEffect } from 'react'
import { AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { withGlobalProviders } from '@/components/providers'

const formSchema = z.object({
  name: z.string({ message: 'Name is required' }).min(1, 'Name is required'),
})

type Data = z.infer<typeof formSchema>

const OrganizationDetailFeature = () => {
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
  const form = useForm<Data>({
    resolver: zodResolver(formSchema),
  })
  const queryClient = useQueryClient()

  const { control, handleSubmit, setValue } = form

  useEffect(() => {
    setValue('name', data?.name ?? '')
  }, [data])

  const updateOrganization = useMutation({
    mutationFn: async (data: Data) => {
      if (!id) return
      const res = client.api.v1.organization[':id'].$put({
        json: data,
        param: {
          id: id,
        },
      })

      await unwrapResponse(res)
    },
    onSuccess() {
      queryClient.invalidateQueries({
        queryKey: [QueryKey.OrganizationDetail, id],
      })
      queryClient.invalidateQueries({
        queryKey: [QueryKey.Organizations],
      })
      toast('Success Update Organization')
    },
  })

  function onSubmit(data: Data) {
    updateOrganization.mutate(data)
  }

  return (
    <OrganizationDetailLayout>
      <div className="p-10">
        <div className="text-2xl font-medium">Details</div>
        {data?.isDefault && (
          <div className="max-w-lg mt-8 bg-blue-100 p-4 rounded-md flex gap-2">
            <AlertCircle />
            <div>
              This is the default organization. It cannot be deleted, but you
              don’t have to use it.
            </div>
          </div>
        )}
        <div className="my-6">Organization details</div>
        <Form {...form}>
          <form
            className="grid gap-2 max-w-lg"
            onSubmit={handleSubmit(onSubmit)}
          >
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
              <FormLabel>Organization ID</FormLabel>
              <Input disabled value={data?.id} className="bg-gray-100" />
            </FormItem>
            <FormItem>
              <FormLabel>Date added</FormLabel>
              <Input
                disabled
                value={
                  data?.createdAt
                    ? dayjs(data.createdAt).format('DD MMMM YYYY')
                    : ''
                }
                className="bg-gray-100"
              />
            </FormItem>
            <div>
              <Button className="mt-4" disabled={updateOrganization.isPending}>
                {updateOrganization.isPending ? 'Loading...' : 'Save'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </OrganizationDetailLayout>
  )
}

export default withGlobalProviders(OrganizationDetailFeature)
