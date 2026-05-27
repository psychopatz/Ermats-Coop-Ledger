// app/admin/page.js
import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/session';
import AdminDashboardClient from './AdminDashboardClient';

export default async function AdminPage() {
  const session = await getAdminSession();

  if (!session) {
    redirect('/admin-login');
  }

  return <AdminDashboardClient session={session} />;
}
