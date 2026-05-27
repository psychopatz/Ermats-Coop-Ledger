// app/admin/page.js
import { getAdminWorkspaceData } from '@/lib/services/dashboardData';
import AdminDashboardClient from './AdminDashboardClient';

export default async function AdminPage() {
  const initialData = await getAdminWorkspaceData();
  const today = new Date().toISOString().split('T')[0];

  return <AdminDashboardClient initialData={initialData} today={today} />;
}
