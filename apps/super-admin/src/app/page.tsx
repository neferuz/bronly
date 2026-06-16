import { redirect } from 'next/navigation';

export default function Home() {
  // Automatically redirect the root path to the Dashboard overview
  redirect('/dashboard');
}
