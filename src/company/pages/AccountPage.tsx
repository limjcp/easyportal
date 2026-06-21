import { useEffect, useState } from "react";
import { FaCheck, FaQuestion } from "react-icons/fa";
import { AdminPanelTable, AdminTabs } from "../../admin/components/AdminPanelTable";
import { StatusBadge } from "../../admin/components/AdminBadges";
import { Modal } from "../../shared/Modal";
import { companyRepository } from "../data/companyRepository";
import type { CompanyRoute } from "../navigation";
import type { BuildingSubscription, CompanySubscription, StripePayout } from "../../resident/data/types";

type AccountPageProps = {
  route: CompanyRoute & { page: "account" };
  onNavigate: (route: CompanyRoute) => void;
};

export function AccountPage({ route, onNavigate }: AccountPageProps) {
  const tab = route.tab ?? "building-subscriptions";
  const [buildingSubs, setBuildingSubs] = useState<BuildingSubscription[]>([]);
  const [companySubs, setCompanySubs] = useState<CompanySubscription[]>([]);
  const [payouts, setPayouts] = useState<StripePayout[]>([]);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(5);
  const [page, setPage] = useState(1);
  const [optionsSub, setOptionsSub] = useState<BuildingSubscription | null>(null);
  const [payoutDetail, setPayoutDetail] = useState<StripePayout | null>(null);

  useEffect(() => {
    if (tab === "building-subscriptions") {
      companyRepository.getBuildingSubscriptions().then(setBuildingSubs);
    } else if (tab === "company-subscriptions") {
      companyRepository.getCompanySubscriptions().then(setCompanySubs);
    } else {
      companyRepository.getStripePayouts().then(setPayouts);
    }
  }, [tab]);

  return (
    <div>
      <div className="mb-4 rounded bg-[#5c2d91] px-4 py-3 text-sm font-semibold text-white">
        Account & Subscription Information
      </div>

      <AdminTabs
        tabs={[
          { id: "building-subscriptions", label: "Building Subscriptions" },
          { id: "company-subscriptions", label: "Management Company Subscriptions" },
          { id: "stripe", label: "Stripe Connect Account" },
        ]}
        activeTab={tab}
        onChange={(t) =>
          onNavigate({
            page: "account",
            tab: t as "building-subscriptions" | "company-subscriptions" | "stripe",
          })
        }
      />

      {tab === "building-subscriptions" && (
        <AdminPanelTable
          title="Building Subscriptions"
          headerColor="purple"
          data={buildingSubs}
          search={search}
          onSearchChange={setSearch}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          page={page}
          onPageChange={setPage}
          columns={[
            {
              key: "status",
              header: "Status",
              render: (s) => (s.active ? <FaCheck className="text-green-600" /> : "—"),
            },
            {
              key: "building",
              header: "Building",
              render: (s) => (
                <div>
                  <div className="font-medium">{s.buildingName}</div>
                  <div className="text-xs text-slate-500">{s.address}</div>
                </div>
              ),
            },
            { key: "package", header: "Subscription", render: (s) => s.package },
            {
              key: "options",
              header: "",
              render: (s) => (
                <button
                  type="button"
                  className="rounded bg-[#3476ef] px-2 py-1 text-xs text-white"
                  onClick={() => setOptionsSub(s)}
                >
                  Options ▾
                </button>
              ),
            },
          ]}
        />
      )}

      {tab === "company-subscriptions" && (
        <AdminPanelTable
          title="Management Company Subscriptions"
          headerColor="purple"
          data={companySubs}
          search={search}
          onSearchChange={setSearch}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          page={page}
          onPageChange={setPage}
          emptyMessage="No management company subscriptions on file."
          columns={[
            { key: "plan", header: "Plan", render: (s) => s.planName },
            { key: "status", header: "Status", render: (s) => <StatusBadge status={s.status} /> },
            { key: "renewal", header: "Renewal", render: (s) => s.renewalDate },
            { key: "buildings", header: "Buildings", render: (s) => String(s.buildingsCount) },
          ]}
        />
      )}

      {tab === "stripe" && (
        <>
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded border border-slate-200 bg-white p-4 text-center">
              <FaQuestion className="mx-auto mb-2 text-2xl text-yellow-500" />
              <p className="text-sm font-medium">Stripe Verification</p>
            </div>
            <div className="rounded border border-slate-200 bg-white p-4 text-center">
              <FaCheck className="mx-auto mb-2 text-2xl text-green-600" />
              <p className="text-sm font-medium">Accepting Payments</p>
            </div>
            <div className="rounded border border-slate-200 bg-white p-4 text-center">
              <FaCheck className="mx-auto mb-2 text-2xl text-green-600" />
              <p className="text-sm font-medium">Receiving Deposits</p>
            </div>
          </div>
          <p className="mb-2 text-sm font-medium text-slate-700">Stripe Online Payment System — Payouts</p>
          <AdminPanelTable
            title="Recent Payouts"
            headerColor="purple"
            data={payouts}
            search={search}
            onSearchChange={setSearch}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
            page={page}
            onPageChange={setPage}
            columns={[
              { key: "date", header: "Payout Date", render: (p) => p.payoutDate },
              {
                key: "status",
                header: "Status",
                render: (p) => <StatusBadge status={p.status} />,
              },
              { key: "total", header: "Total", render: (p) => `$${p.total.toFixed(2)}` },
              { key: "currency", header: "Currency", render: (p) => p.currency },
              {
                key: "actions",
                header: "",
                render: (p) => (
                  <button
                    type="button"
                    className="rounded bg-[#3476ef] px-2 py-1 text-xs text-white"
                    onClick={() => setPayoutDetail(p)}
                  >
                    View Transactions
                  </button>
                ),
              },
            ]}
          />
        </>
      )}

      <Modal open={!!optionsSub} onClose={() => setOptionsSub(null)} title="Building Subscription" size="md">
        {optionsSub ? (
          <div className="space-y-2 text-sm text-slate-700">
            <p>
              <strong>Building:</strong> {optionsSub.buildingName}
            </p>
            <p>
              <strong>Address:</strong> {optionsSub.address}
            </p>
            <p>
              <strong>Package:</strong> {optionsSub.package}
            </p>
            <p>
              <strong>Status:</strong> {optionsSub.active ? "Active" : "Inactive"}
            </p>
          </div>
        ) : null}
      </Modal>

      <Modal open={!!payoutDetail} onClose={() => setPayoutDetail(null)} title="Payout Details" size="md">
        {payoutDetail ? (
          <div className="space-y-2 text-sm text-slate-700">
            <p>
              <strong>Date:</strong> {payoutDetail.payoutDate}
            </p>
            <p>
              <strong>Status:</strong> {payoutDetail.status}
            </p>
            <p>
              <strong>Total:</strong> ${payoutDetail.total.toFixed(2)} {payoutDetail.currency}
            </p>
            <p className="text-slate-500">Individual transaction details are not available for this payout.</p>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
