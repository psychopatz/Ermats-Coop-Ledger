import { getAdminWorkspaceData } from '@/lib/services/dashboardData';
import AdminPaymentsClient from './AdminPaymentsClient';

export default async function AdminPaymentsPage() {
  const initialData = await getAdminWorkspaceData();
  const today = new Date().toISOString().split('T')[0];

  return <AdminPaymentsClient initialData={initialData} today={today} />;
}