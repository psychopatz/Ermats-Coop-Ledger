import { redirect } from 'next/navigation';
import { getMemberSession } from '@/lib/session';
import { getMemberDashboardData } from '@/lib/services/dashboardData';
import MemberShell from '@/components/member/MemberShell';
import { MemberWorkspaceProvider } from '@/components/member/MemberWorkspaceProvider';

export default async function MemberDashboardLayout({ children }) {
  const session = await getMemberSession();

  if (!session) {
    redirect('/member-login');
  }

  const initialData = await getMemberDashboardData(session.member_id);
  const today = new Date().toISOString().split('T')[0];

  return (
    <MemberWorkspaceProvider initialData={initialData} today={today}>
      <MemberShell session={session}>{children}</MemberShell>
    </MemberWorkspaceProvider>
  );
}