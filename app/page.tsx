import { redirect } from 'next/navigation'

// The marketing/portal-picker splash that used to live here now lives on
// the separate trackin-landing site — this app's root is reached only
// after clicking "Sign in" there, so it goes straight to the login form.
export default function Home() {
  redirect('/auth/login')
}
