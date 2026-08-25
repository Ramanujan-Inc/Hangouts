import type { AppProps } from 'next/app'
import '../styles/globals.css'
import { SWRConfig } from 'swr'
import { api } from '../lib/api'
import { AuthProvider } from '../context/AuthContext'
import { ThemeProvider } from '../context/ThemeContext'
import { APIProvider } from '@vis.gl/react-google-maps'

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

export default function App({ Component, pageProps }: AppProps) {
  return (
    <SWRConfig
      value={{
        fetcher: (url: string) => api.get(url),
        revalidateOnFocus: true,
        revalidateIfStale: true,
        dedupingInterval: 4000,
        keepPreviousData: true,
      }}
    >
      <ThemeProvider>
        <AuthProvider>
          <APIProvider apiKey={GOOGLE_MAPS_API_KEY} solutionChannel="gmp_git_agentskills_v1">
            <Component {...pageProps} />
          </APIProvider>
        </AuthProvider>
      </ThemeProvider>
    </SWRConfig>
  )
}

