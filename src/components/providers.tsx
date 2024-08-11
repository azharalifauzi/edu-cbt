import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import React from 'react'
import { ServerError } from '@/server/lib/error'
import { toast } from 'sonner'
import { RouteContextProvider, type RouteContext } from '@/hooks/route'
import type { User } from '@/server/services/user'
import { UserContextProvider } from '@/hooks/user'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // default stale time to 5 minutes
    },
  },
  queryCache: new QueryCache({
    onError: (data: any) => {
      if ('statusCode' in data) {
        const err = data as InstanceType<typeof ServerError>['response']
        toast.error('Oops something went wrong!', {
          description: err.message,
        })
        return
      }

      if (data instanceof Error) {
        toast.error('Opps unknown error is happened', {
          description: 'Please contact our support to solve the issue',
        })
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (data: any) => {
      if ('statusCode' in data) {
        const err = data as InstanceType<typeof ServerError>['response']
        toast.error('Oops something went wrong!', {
          description: err.message,
        })
        return
      }

      if (data instanceof Error) {
        toast.error('Opps unknown error is happened', {
          description: 'Please contact our support to solve the issue',
        })
      }
    },
  }),
})

export interface GlobalProvidersProps extends RouteContext {
  user: User | null
  children?: React.ReactNode
}

const Providers: React.FC<GlobalProvidersProps> = ({
  children,
  params,
  url,
  user,
}) => {
  return (
    <UserContextProvider value={user}>
      <RouteContextProvider
        value={{
          params,
          url,
        }}
      >
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </RouteContextProvider>
    </UserContextProvider>
  )
}

export default Providers

export function withGlobalProviders<P extends object = {}>(
  WrappedComponent: React.ComponentType<P>
) {
  // Return a new component that merges the props
  const ComponentWithExtraProps: React.FC<
    Omit<P, keyof GlobalProvidersProps> & GlobalProvidersProps
  > = (props) => {
    // Merging props
    const { params, url, user, ...rest } = props

    // Pass the correct props to the wrapped component
    return (
      <Providers params={params} url={url} user={user}>
        <WrappedComponent {...(rest as P)} />;
      </Providers>
    )
  }

  return ComponentWithExtraProps
}
