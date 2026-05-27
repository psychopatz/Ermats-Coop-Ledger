import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/session';
import AdminShell from '@/components/admin/AdminShell';

export default async function AdminLayout({ children }) {
  const session = await getAdminSession();

  if (!session) {
    redirect('/admin-login');
  }

  return <AdminShell session={session}>{children}</AdminShell>;
}