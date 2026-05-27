export const PAYMENT_METHODS = ['cash', 'gcash'];
export const PENDING_PAYMENT_STATUSES = ['pending_approval'];
export const SETTLED_PAYMENT_STATUSES = ['approved', 'active'];
export const VOIDED_PAYMENT_STATUSES = ['voided'];

export function parseAmount(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function normalizePaymentMethod(value) {
  const normalized = String(value || 'cash').trim().toLowerCase();
  return PAYMENT_METHODS.includes(normalized) ? normalized : 'cash';
}

export function normalizeReferenceCode(value) {
  return String(value || '').trim();
}

export function normalizePaymentStatus(value) {
  const normalized = String(value || '').trim().toLowerCase();

  if (PENDING_PAYMENT_STATUSES.includes(normalized)) {
    return 'pending_approval';
  }

  if (VOIDED_PAYMENT_STATUSES.includes(normalized)) {
    return 'voided';
  }

  if (SETTLED_PAYMENT_STATUSES.includes(normalized)) {
    return 'approved';
  }

  return normalized || 'approved';
}

export function isSettledPaymentStatus(status) {
  return normalizePaymentStatus(status) === 'approved';
}

function parseSheetDate(value) {
  if (!value) {
    return null;
  }

  const rawValue = String(value).trim();
  const normalizedValue = /^\d{4}-\d{2}-\d{2}$/.test(rawValue)
    ? `${rawValue}T00:00:00Z`
    : rawValue;
  const parsedDate = new Date(normalizedValue);

  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function getIsoWeek(date) {
  const utcDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = utcDate.getUTCDay() || 7;

  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - day);

  const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil((((utcDate - yearStart) / 86400000) + 1) / 7);

  return {
    weekYear: utcDate.getUTCFullYear(),
    weekNumber,
  };
}

export function getPaymentPeriod(paymentDate) {
  const parsedDate = parseSheetDate(paymentDate);

  if (!parsedDate) {
    return {
      period_year: 'unknown',
      period_month: 'unknown',
      period_week: 'unknown',
    };
  }

  const year = String(parsedDate.getUTCFullYear());
  const month = `${year}-${String(parsedDate.getUTCMonth() + 1).padStart(2, '0')}`;
  const { weekYear, weekNumber } = getIsoWeek(parsedDate);

  return {
    period_year: year,
    period_month: month,
    period_week: `${weekYear}-W${String(weekNumber).padStart(2, '0')}`,
  };
}

export function getRepaymentStatus(loan, payments) {
  const balance = parseAmount(loan?.balance);
  if ((loan?.status || '').toLowerCase() === 'paid' || balance <= 0) {
    return 'paid';
  }

  const totalPaid = payments
    .filter((payment) => payment.loan_id === loan.loan_id && isSettledPaymentStatus(payment.status))
    .reduce((sum, payment) => sum + parseAmount(payment.amount_received), 0);

  return totalPaid > 0 ? 'partial' : 'not_paid';
}

export function enrichLoans(loans, payments) {
  return loans.map((loan) => ({
    ...loan,
    repayment_status: getRepaymentStatus(loan, payments),
  }));
}

export function enrichPayments(payments, loans) {
  const loanLookup = new Map(loans.map((loan) => [loan.loan_id, loan]));

  return [...payments]
    .map((payment) => {
      const linkedLoan = loanLookup.get(payment.loan_id);
      const recordStatus = normalizePaymentStatus(payment.status);

      return {
        ...payment,
        payment_method: normalizePaymentMethod(payment.payment_method),
        record_status: recordStatus,
        reference_code: normalizeReferenceCode(payment.reference_code),
        repayment_status: linkedLoan?.repayment_status || 'not_paid',
        is_pending_approval: recordStatus === 'pending_approval',
        ...getPaymentPeriod(payment.payment_date),
      };
    })
    .sort((left, right) => {
      return String(right.payment_date).localeCompare(String(left.payment_date))
        || String(right.created_at).localeCompare(String(left.created_at))
        || String(right.payment_id).localeCompare(String(left.payment_id));
    });
}

export function groupPaymentsByPeriod(payments, groupBy) {
  const periodKey = groupBy === 'week'
    ? 'period_week'
    : groupBy === 'month'
      ? 'period_month'
      : 'period_year';
  const grouped = new Map();

  payments.forEach((payment) => {
    const key = payment[periodKey] || 'unknown';
    const current = grouped.get(key) || {
      period: key,
      payment_count: 0,
      total_amount: 0,
      cash_count: 0,
      gcash_count: 0,
      approved_count: 0,
      pending_count: 0,
      voided_count: 0,
    };

    current.payment_count += 1;
    current.total_amount += parseAmount(payment.amount_received);
    current[`${normalizePaymentMethod(payment.payment_method)}_count`] += 1;

    if (payment.record_status === 'voided') {
      current.voided_count += 1;
    } else if (payment.record_status === 'pending_approval') {
      current.pending_count += 1;
    } else {
      current.approved_count += 1;
    }

    grouped.set(key, current);
  });

  return [...grouped.values()].sort((left, right) => right.period.localeCompare(left.period));
}