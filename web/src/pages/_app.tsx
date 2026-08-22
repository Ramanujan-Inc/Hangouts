import type { AppProps } from 'next/app'
import '../styles/globals.css'
import { AuthProvider } from '../context/AuthContext'
import { APIProvider } from '@vis.gl/react-google-maps'

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <APIProvider apiKey={GOOGLE_MAPS_API_KEY} solutionChannel="gmp_git_agentskills_v1">
        <Component {...pageProps} />
      </APIProvider>
    </AuthProvider>
  )
}

