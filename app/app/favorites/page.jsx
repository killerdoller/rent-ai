import { redirect } from 'next/navigation';

export default function Page() {
  redirect('/app/matches?tab=guardados');
}
