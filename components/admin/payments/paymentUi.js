import { formatCurrency as formatPhpCurrency } from '@/lib/domain/currency';

export function formatRecordStatus(status) {
  if (status === 'pending_approval') {
    return 'Pending Approval';
  }

  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function formatRepaymentStatus(status) {
  if (status === 'not_paid') {
    return 'Not Paid';
  }

  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function getRepaymentStatusClass(status) {
  if (status === 'paid') {
    return 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300';
  }

  if (status === 'partial') {
    return 'bg-amber-500/10 border border-amber-500/30 text-amber-300';
  }

  return 'bg-slate-500/10 border border-slate-500/30 text-slate-300';
}

export function getRecordStatusClass(status) {
  if (status === 'pending_approval') {
    return 'bg-cyan-500/10 border border-cyan-400/30 text-cyan-200';
  }

  return status === 'voided'
    ? 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
    : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400';
}

export function createPaymentForm(today) {
  return {
    loan_id: '',
    amount_received: '',
    payment_date: today,
    payment_method: 'cash',
    reference_code: '',
  };
}

export function formatCurrency(amount) {
  return formatPhpCurrency(amount);
}