import { createContext, useContext } from 'react'

export interface RouteContext {
  params: Record<string, string | undefined>
  url: URL
}

const Context = createContext<RouteContext>({
  params: {},
  url: new URL('https://localhost:3000'),
})

export const RouteContextProvider = Context.Provider

export const useParams = () => useContext(Context).params
export const useRouteContext = () => useContext(Context)
