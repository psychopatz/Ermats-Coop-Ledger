// app/member-dashboard/page.js
import { redirect } from 'next/navigation';
import { getMemberSession } from '@/lib/session';
import MemberDashboardClient from './MemberDashboardClient';

export default async function MemberDashboardPage() {
  const session = await getMemberSession();

  if (!session) {
    redirect('/member-login');
  }

  return <MemberDashboardClient session={session} />;
}
