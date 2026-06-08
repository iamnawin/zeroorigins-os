import { redirect } from 'next/navigation'

// Bootstrap flow removed. First admin is seeded directly in the database.
export default function SetupFounderPage() {
  redirect('/login')
}
