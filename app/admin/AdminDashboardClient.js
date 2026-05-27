'use client';

import { useState } from 'react';
import { useAdminWorkspace } from '@/components/admin/AdminWorkspaceProvider';
import MembersWorkspace from '@/components/admin/MembersWorkspace';
import LoansWorkspace from '@/components/admin/LoansWorkspace';
import AuditsWorkspace from '@/components/admin/AuditsWorkspace';
import BulletinWorkspace from '@/components/admin/BulletinWorkspace';
import AdminDashboardOverview from '@/components/admin/dashboard/AdminDashboardOverview';
import AdminDashboardWorkspaceFrame from '@/components/admin/dashboard/AdminDashboardWorkspaceFrame';
import { createAdminTabs } from '@/components/admin/dashboard/dashboardUi';
import useAdminDashboardController from '@/components/admin/useAdminDashboardController';
import { portalPageClassName } from '@/components/theme/portalTheme';

export default function AdminDashboardClient() {
  const { members, bulletins, activeBulletin, loans, loanRequests, audits, payments, today, syncStatus, dispatch } = useAdminWorkspace();
  const [activeTab, setActiveTab] = useState('members');
  const {
    memberForm,
    setMemberForm,
    loanForm,
    setLoanForm,
    bulletinMessage,
    setBulletinMessage,
    error,
    setError,
    isBusy,
    handleAddMember,
    handleSoftDeleteMember,
    handleAddLoan,
    handleSaveBulletin,
    handleApproveLoanRequest,
    handleRejectLoanRequest,
  } = useAdminDashboardController({
    members,
    bulletins,
    activeBulletin,
    today,
    syncStatus,
    dispatch,
  });

  const tabs = createAdminTabs({ members, loans, loanRequests, bulletins, audits });

  let activeWorkspace = null;

  if (activeTab === 'members') {
    activeWorkspace = (
      <MembersWorkspace
        members={members}
        memberForm={memberForm}
        setMemberForm={setMemberForm}
        handleAddMember={handleAddMember}
        handleSoftDeleteMember={handleSoftDeleteMember}
        actionLoading={isBusy}
      />
    );
  }

  if (activeTab === 'loans') {
    activeWorkspace = (
      <LoansWorkspace
        today={today}
        members={members}
        loans={loans}
        loanRequests={loanRequests}
        loanForm={loanForm}
        setLoanForm={setLoanForm}
        handleAddLoan={handleAddLoan}
        handleApproveLoanRequest={handleApproveLoanRequest}
        handleRejectLoanRequest={handleRejectLoanRequest}
        actionLoading={isBusy}
      />
    );
  }

  if (activeTab === 'bulletins') {
    activeWorkspace = (
      <BulletinWorkspace
        bulletins={bulletins}
        bulletinMessage={bulletinMessage}
        setBulletinMessage={setBulletinMessage}
        handleSaveBulletin={handleSaveBulletin}
        actionLoading={isBusy}
      />
    );
  }

  if (activeTab === 'audits') {
    activeWorkspace = <AuditsWorkspace audits={audits} />;
  }

  return (
    <main className={`${portalPageClassName} flex flex-col gap-8`}>
      <AdminDashboardOverview
        membersCount={members.length}
        loansCount={loans.length}
        paymentsCount={payments.length}
      />

      <AdminDashboardWorkspaceFrame
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tabId) => {
          setActiveTab(tabId);
          setError('');
        }}
        error={error}
        syncStatus={syncStatus}
      >
        {activeWorkspace}
      </AdminDashboardWorkspaceFrame>
    </main>
  );
}