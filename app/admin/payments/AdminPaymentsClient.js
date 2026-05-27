'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminWorkspace } from '@/components/admin/AdminWorkspaceProvider';
import { groupPaymentsByPeriod, parseAmount } from '@/lib/domain/payments';
import AdminPaymentsOverview from '@/components/admin/payments/AdminPaymentsOverview';
import AdminPaymentsAnalyticsPanel from '@/components/admin/payments/AdminPaymentsAnalyticsPanel';
import AdminPaymentsLedger from '@/components/admin/payments/AdminPaymentsLedger';
import {
  AdminPaymentRecordForm,
  AdminPaymentVoidForm,
} from '@/components/admin/payments/AdminPaymentForms';
import { createPaymentForm } from '@/components/admin/payments/paymentUi';
import {
  calculateApprovedLoanUpdate,
  calculateVoidedLoanUpdate,
  createOptimisticId,
} from '@/lib/domain/workspaceState';
import { portalPageClassName } from '@/components/theme/portalTheme';

export default function AdminPaymentsClient() {
  const { members, loans, payments, today, syncStatus, dispatch } = useAdminWorkspace();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [groupBy, setGroupBy] = useState('month');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [recordStatusFilter, setRecordStatusFilter] = useState('all');
  const [repaymentStatusFilter, setRepaymentStatusFilter] = useState('all');
  const [paymentForm, setPaymentForm] = useState(createPaymentForm(today));
  const [voidPaymentId, setVoidPaymentId] = useState(null);
  const [voidReason, setVoidReason] = useState('');

  const memberLookup = new Map(members.map((member) => [member.member_id, member]));
  const loanLookup = new Map(loans.map((loan) => [loan.loan_id, loan]));
  const isBusy = isSubmitting || syncStatus.state === 'saving';

  const visiblePayments = payments.filter((payment) => {
    if (paymentMethodFilter !== 'all' && payment.payment_method !== paymentMethodFilter) {
      return false;
    }

    if (recordStatusFilter !== 'all' && payment.record_status !== recordStatusFilter) {
      return false;
    }

    if (repaymentStatusFilter !== 'all' && payment.repayment_status !== repaymentStatusFilter) {
      return false;
    }

    return true;
  });

  const groupedPayments = groupPaymentsByPeriod(visiblePayments, groupBy);
  const collectedAmount = visiblePayments
    .filter((payment) => payment.record_status === 'approved')
    .reduce((sum, payment) => sum + parseAmount(payment.amount_received), 0);
  const pendingAmount = visiblePayments
    .filter((payment) => payment.record_status === 'pending_approval')
    .reduce((sum, payment) => sum + parseAmount(payment.amount_received), 0);
  const pendingCount = visiblePayments.filter((payment) => payment.record_status === 'pending_approval').length;
  const voidedCount = visiblePayments.filter((payment) => payment.record_status === 'voided').length;

  const updatePaymentForm = (field, value) => {
    setPaymentForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const setPaymentMethod = (paymentMethod) => {
    setPaymentForm((current) => ({
      ...current,
      payment_method: paymentMethod,
      reference_code: paymentMethod === 'gcash' ? current.reference_code : '',
    }));
  };

  const sendRequest = async (url, options, fallbackMessage) => {
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(url, options);
      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        return { unauthorized: true };
      }

      if (!response.ok) {
        return { error: data.error || fallbackMessage };
      }

      return { data };
    } catch (requestError) {
      return { error: requestError.message || fallbackMessage };
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecordPayment = async (event) => {
    event.preventDefault();

    const selectedLoan = loanLookup.get(paymentForm.loan_id);
    if (!selectedLoan) {
      setError('Please select a valid loan for this payment.');
      return;
    }

    const amount = Number.parseFloat(paymentForm.amount_received);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Please enter a valid payment amount.');
      return;
    }

    const normalizedReferenceCode = paymentForm.payment_method === 'gcash'
      ? paymentForm.reference_code.trim()
      : '';
    if (paymentForm.payment_method === 'gcash' && !normalizedReferenceCode) {
      setError('GCash payments require a reference code.');
      return;
    }

    const optimisticId = createOptimisticId('payment');
    const now = new Date().toISOString();
    const optimisticLoan = {
      ...calculateApprovedLoanUpdate(selectedLoan, amount),
      updated_at: now,
    };

    dispatch({
      type: 'payment_record_started',
      payload: {
        loan: optimisticLoan,
        payment: {
          payment_id: optimisticId,
          loan_id: paymentForm.loan_id,
          member_id: selectedLoan.member_id,
          payment_date: paymentForm.payment_date,
          amount_received: amount,
          received_by: 'Pending admin sync',
          status: 'approved',
          created_at: now,
          updated_at: now,
          payment_method: paymentForm.payment_method,
          reference_code: normalizedReferenceCode,
        },
      },
    });

    const result = await sendRequest(
      '/api/payments',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loan_id: paymentForm.loan_id,
          member_id: selectedLoan.member_id,
          amount_received: amount,
          payment_date: paymentForm.payment_date,
          payment_method: paymentForm.payment_method,
          reference_code: normalizedReferenceCode,
        }),
      },
      'Failed to record payment.'
    );

    if (result.unauthorized) {
      dispatch({
        type: 'payment_record_failed',
        payload: {
          tempId: optimisticId,
          loan: selectedLoan,
          message: 'Your admin session expired. Please sign in again.',
        },
      });
      router.push('/admin-login');
      return;
    }

    if (result.error) {
      dispatch({
        type: 'payment_record_failed',
        payload: {
          tempId: optimisticId,
          loan: selectedLoan,
          message: result.error,
        },
      });
      setError(result.error);
      return;
    }

    if (result.data) {
      dispatch({
        type: 'payment_record_succeeded',
        payload: {
          tempId: optimisticId,
          payment: result.data,
        },
      });
      setPaymentForm(createPaymentForm(today));
    }
  };

  const handleVoidPayment = async (event) => {
    event.preventDefault();

    if (!voidPaymentId) {
      return;
    }

    const targetPayment = payments.find((payment) => payment.payment_id === voidPaymentId);
    if (!targetPayment) {
      return;
    }

    const targetLoan = loanLookup.get(targetPayment.loan_id);
    const optimisticPayment = {
      ...targetPayment,
      status: 'voided',
      updated_at: new Date().toISOString(),
    };
    const revertedLoan = targetLoan && targetPayment.record_status === 'approved'
      ? {
        ...calculateVoidedLoanUpdate(targetLoan, targetPayment.amount_received),
        updated_at: new Date().toISOString(),
      }
      : null;

    dispatch({
      type: 'payment_update_started',
      payload: {
        payment: optimisticPayment,
        loan: revertedLoan,
        message: 'Saving void update to Google Sheets...',
      },
    });

    const result = await sendRequest(
      `/api/payments/${voidPaymentId}/void`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ void_reason: voidReason }),
      },
      'Failed to void payment.'
    );

    if (result.unauthorized) {
      dispatch({
        type: 'payment_update_failed',
        payload: {
          payment: targetPayment,
          loan: targetLoan && targetPayment.record_status === 'approved' ? targetLoan : null,
          message: 'Your admin session expired. Please sign in again.',
        },
      });
      router.push('/admin-login');
      return;
    }

    if (result.error) {
      dispatch({
        type: 'payment_update_failed',
        payload: {
          payment: targetPayment,
          loan: targetLoan && targetPayment.record_status === 'approved' ? targetLoan : null,
          message: result.error,
        },
      });
      setError(result.error);
      return;
    }

    if (result.data) {
      dispatch({
        type: 'payment_update_succeeded',
        payload: {
          payment: result.data,
          message: 'Payment safely updated in Google Sheets.',
        },
      });
      setVoidPaymentId(null);
      setVoidReason('');
    }
  };

  const handleApprovePayment = async (paymentId) => {
    const targetPayment = payments.find((payment) => payment.payment_id === paymentId);
    if (!targetPayment) {
      return;
    }

    const targetLoan = loanLookup.get(targetPayment.loan_id);
    if (!targetLoan) {
      setError('The linked loan could not be found for this payment.');
      return;
    }

    const optimisticPayment = {
      ...targetPayment,
      status: 'approved',
      received_by: 'Pending admin sync',
      updated_at: new Date().toISOString(),
    };
    const optimisticLoan = {
      ...calculateApprovedLoanUpdate(targetLoan, targetPayment.amount_received),
      updated_at: new Date().toISOString(),
    };

    dispatch({
      type: 'payment_update_started',
      payload: {
        payment: optimisticPayment,
        loan: optimisticLoan,
        message: 'Saving approval to Google Sheets...',
      },
    });

    const result = await sendRequest(
      `/api/payments/${paymentId}/approve`,
      {
        method: 'PATCH',
      },
      'Failed to approve payment.'
    );

    if (result.unauthorized) {
      dispatch({
        type: 'payment_update_failed',
        payload: {
          payment: targetPayment,
          loan: targetLoan,
          message: 'Your admin session expired. Please sign in again.',
        },
      });
      router.push('/admin-login');
      return;
    }

    if (result.error) {
      dispatch({
        type: 'payment_update_failed',
        payload: {
          payment: targetPayment,
          loan: targetLoan,
          message: result.error,
        },
      });
      setError(result.error);
      return;
    }

    dispatch({
      type: 'payment_update_succeeded',
      payload: {
        payment: result.data,
        message: 'Payment safely approved in Google Sheets.',
      },
    });
  };

  return (
    <main className={portalPageClassName}>
      <AdminPaymentsOverview
        visiblePaymentCount={visiblePayments.length}
        collectedAmount={collectedAmount}
        pendingCount={pendingCount}
        pendingAmount={pendingAmount}
        voidedCount={voidedCount}
        error={error}
        syncStatus={syncStatus}
      />

      <section className="grid gap-8 2xl:grid-cols-[minmax(0,1.65fr)_360px]">
        <div className="space-y-6">
          <AdminPaymentsAnalyticsPanel
            groupBy={groupBy}
            paymentMethodFilter={paymentMethodFilter}
            repaymentStatusFilter={repaymentStatusFilter}
            recordStatusFilter={recordStatusFilter}
            groupedPayments={groupedPayments}
            onGroupByChange={setGroupBy}
            onPaymentMethodFilterChange={setPaymentMethodFilter}
            onRepaymentStatusFilterChange={setRepaymentStatusFilter}
            onRecordStatusFilterChange={setRecordStatusFilter}
          />

          <AdminPaymentsLedger
            payments={visiblePayments}
            memberLookup={memberLookup}
            isBusy={isBusy}
            onApprovePayment={handleApprovePayment}
            onStartVoid={(paymentId) => {
              setVoidPaymentId(paymentId);
              setError('');
            }}
          />
        </div>

        <div className="space-y-6">
          <AdminPaymentRecordForm
            paymentForm={paymentForm}
            loans={loans}
            memberLookup={memberLookup}
            isBusy={isBusy}
            onSubmit={handleRecordPayment}
            onFieldChange={updatePaymentForm}
            onPaymentMethodChange={setPaymentMethod}
          />

          {voidPaymentId && (
            <AdminPaymentVoidForm
              paymentId={voidPaymentId}
              voidReason={voidReason}
              isBusy={isBusy}
              onSubmit={handleVoidPayment}
              onCancel={() => {
                setVoidPaymentId(null);
                setVoidReason('');
              }}
              onVoidReasonChange={setVoidReason}
            />
          )}
        </div>
      </section>
    </main>
  );
}