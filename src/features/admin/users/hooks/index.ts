import { client, QueryKey } from '@/utils/fetcher'
import { useQuery } from '@tanstack/react-query'
import { useParams } from '@/hooks/route'

export const useGetUserById = () => {
  const { id } = useParams()
  return useQuery({
    queryKey: [QueryKey.UserProfile, id],
    queryFn: async () => {
      const res = await client.api.v1.user[':id'].$get({
        param: {
          id: id ?? '1',
        },
      })

      const json = await res.json()

      return json.data
    },
    enabled: !!id,
  })
}

export const useGetAllOrganizations = () =>
  useQuery({
    queryKey: [QueryKey.Organizations, QueryKey.AllOrganizations],
    queryFn: async () => {
      const res = await client.api.v1.organization.$get({
        query: {
          size: '99999',
        },
      })

      const json = await res.json()

      return json.data.data
    },
  })
