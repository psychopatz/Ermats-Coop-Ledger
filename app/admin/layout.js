import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/session';
import { getAdminWorkspaceData } from '@/lib/services/dashboardData';
import AdminShell from '@/components/admin/AdminShell';
import { AdminWorkspaceProvider } from '@/components/admin/AdminWorkspaceProvider';

export const runtime = 'nodejs';
export const maxDuration = 10;

export default async function AdminLayout({ children }) {
  const session = await getAdminSession();

  if (!session) {
    redirect('/admin-login');
  }

  const initialData = await getAdminWorkspaceData();
  const today = new Date().toISOString().split('T')[0];

  return (
    <AdminWorkspaceProvider initialData={initialData} today={today}>
      <AdminShell session={session}>{children}</AdminShell>
    </AdminWorkspaceProvider>
  );
}