import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import UserDetailLayout from './components/detail-layou'
import { useGetUserById } from './hooks'
import { useParams } from '@/hooks/route'
import { client, QueryKey, unwrapResponse } from '@/utils/fetcher'
import { Switch } from '@/components/ui/switch'
import { useMemo, useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { withGlobalProviders } from '@/components/providers'

const UserRoleManagement = () => {
  const queryClient = useQueryClient()
  const { id } = useParams()
  const { data } = useGetUserById()
  const [selectedOrgIndex, setSelectedOrgIndex] = useState('0')
  const { data: userRoles } = useQuery({
    queryKey: [QueryKey.UserRoles, id],
    queryFn: async () => {
      const res = client.api.v1.user[':id'].roles.$get({
        param: {
          id: id ?? '1',
        },
      })

      const json = await unwrapResponse(res)
      return json.data
    },
    enabled: !!id,
  })

  const { data: roles } = useQuery({
    queryKey: [QueryKey.Roles, QueryKey.AllRoles],
    queryFn: async () => {
      const res = client.api.v1.role.$get({
        query: {
          size: '99999',
        },
      })

      const json = await unwrapResponse(res)
      return json.data?.data
    },
  })

  const userRolesIds = useMemo(() => {
    if (!userRoles || !userRoles.length) {
      return new Set()
    }

    return new Set(
      userRoles[Number(selectedOrgIndex)]?.roles?.map((role) => role.id)
    )
  }, [userRoles, selectedOrgIndex])

  const assignRole = useMutation({
    mutationFn: async (roleId: number) => {
      if (!id || !data?.organizations) return

      const res = client.api.v1.user[':id']['assign-role'].$post({
        json: {
          roleId,
          organizationId: data.organizations[Number(selectedOrgIndex)].id,
        },
        param: {
          id,
        },
      })
      await unwrapResponse(res)
      queryClient.invalidateQueries({
        queryKey: [QueryKey.UserRoles, id],
      })
    },
  })

  const unAssignRole = useMutation({
    mutationFn: async (roleId: number) => {
      if (!id || !data?.organizations) return

      const res = client.api.v1.user[':id']['unassign-role'].$post({
        json: {
          roleId,
          organizationId: data.organizations[Number(selectedOrgIndex)].id,
        },
        param: {
          id,
        },
      })
      await unwrapResponse(res)
      queryClient.invalidateQueries({
        queryKey: [QueryKey.UserRoles, id],
      })
    },
  })

  return (
    <UserDetailLayout name={data?.name ?? ''}>
      <div className="p-10 max-w-2xl">
        <div className="mb-8">
          <div className="text-2xl font-medium">Roles</div>
          <div>Set role immediately to user</div>
        </div>

        <div className="mb-6">
          {data?.organizations.length === 1 ? (
            <>
              <div className="mb-2">Organization</div>
              <div className="border border-gray-300 px-4 py-1 rounded-full w-max text-sm">
                {data?.organizations[0].name}
              </div>
            </>
          ) : (
            <>
              <div className="mb-2">Organization</div>
              <Select
                value={selectedOrgIndex}
                onValueChange={(idx) => setSelectedOrgIndex(idx)}
              >
                <SelectTrigger className="max-w-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {data?.organizations.map((org, idx) => (
                    <SelectItem
                      key={`select-org-${org.id}`}
                      value={idx.toString()}
                    >
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}
        </div>
        <div className="grid gap-6">
          {roles?.map((role) => (
            <div
              key={`all-roles-${role.id}`}
              className="flex items-center justify-between"
            >
              <div>{role.name}</div>
              <Switch
                checked={userRolesIds.has(role.id) ?? false}
                onCheckedChange={(checked) => {
                  if (checked) {
                    assignRole.mutate(role.id)
                  } else {
                    unAssignRole.mutate(role.id)
                  }
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </UserDetailLayout>
  )
}

export default withGlobalProviders(UserRoleManagement)
