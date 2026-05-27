// app/member-dashboard/page.js
import { redirect } from 'next/navigation';
import { getMemberSession } from '@/lib/session';
import { getMemberDashboardData } from '@/lib/services/dashboardData';
import MemberDashboardClient from './MemberDashboardClient';

export default async function MemberDashboardPage() {
  const session = await getMemberSession();

  if (!session) {
    redirect('/member-login');
  }

  const initialData = await getMemberDashboardData(session.member_id);

  return <MemberDashboardClient session={session} initialData={initialData} />;
}
