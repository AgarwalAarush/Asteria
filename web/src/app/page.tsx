import { redirect } from 'next/navigation'

export default function Home() {
  // Redirect to the main graph page
  redirect('/graph')
}
