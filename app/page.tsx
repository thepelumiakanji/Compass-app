import { getAccessToken } from '@/lib/instagram'
import { ConnectScreen } from '@/components/connect-screen'
import { Dashboard } from '@/components/dashboard'

export default async function Home() {
  const token = await getAccessToken()
  if (!token) {
    return <ConnectScreen />
  }
  return <Dashboard />
}
