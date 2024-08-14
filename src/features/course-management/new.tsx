import Layout from '@/components/layout'
import { withGlobalProviders } from '@/components/providers'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { client, QueryKey, unwrapResponse } from '@/utils/fetcher'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const formSchema = z.object({
  name: z.string({ message: 'Course name is required' }).min(0),
  category: z.number({ message: 'Course category is required' }),
  image: z.string().optional(),
  publishDate: z.date().optional(),
})

type Data = z.infer<typeof formSchema>

const NewCourseFeature = () => {
  const form = useForm<Data>({
    resolver: zodResolver(formSchema),
  })

  const { control, setValue } = form

  const { data: categories } = useQuery({
    queryKey: [QueryKey.CourseCategories],
    queryFn: async () => {
      const res = client.api.v1.course.categories.$get({
        param: {},
      })

      return (await unwrapResponse(res)).data.data
    },
  })

  return (
    <Layout>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/course-management">
              Course Management
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/course-management/new">
              New Course
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="mt-5">
        <div className="font-bold text-3xl mb-1">New Course</div>
        <div className="text-gray-500">
          Provide high quality for best students
        </div>
      </div>
      <Form {...form}>
        <div className="grid gap-8 max-w-[500px] mt-10 px-6">
          <FormField
            control={control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Course name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Intro to digital marketing" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <FormControl>
                  <Select
                    value={field.value?.toString()}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder="Select category"
                        onBlur={field.onBlur}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.map((c) => (
                        <SelectItem key={c.slug} value={c.id.toString()}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </Form>
    </Layout>
  )
}

export default withGlobalProviders(NewCourseFeature)
