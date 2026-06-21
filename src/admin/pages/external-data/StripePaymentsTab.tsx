import { useCallback, useEffect, useState } from "react";
import { FaCreditCard } from "react-icons/fa";
import { AdminSectionPanel } from "../../components/AdminSectionPanel";
import { ActionButton } from "../../../shared/ActionButton";
import { FormAlert } from "../../../shared/FormAlert";
import { useAsyncAction } from "../../../shared/useAsyncAction";
import { adminRepository } from "../../data/adminRepository";
import { STRIPE_COUNTRIES, STRIPE_CURRENCIES } from "../../data/mock/stripeFormOptions";
import type { BuildingExternalData } from "../../../resident/data/types";

const inputClass = "mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm";

export function StripePaymentsTab() {
  const [data, setData] = useState<BuildingExternalData | null>(null);
  const [country, setCountry] = useState("CA");
  const [accountNumber, setAccountNumber] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [currency, setCurrency] = useState("CAD");

  const { run: submitStripe, loading: submitting, error } = useAsyncAction(
    useCallback(async () => {
      const updated = await adminRepository.createStripeAccount({
        country,
        accountNumber,
        routingNumber,
        currency,
      });
      setData(updated);
      alert("Stripe account signup submitted (mock).");
    }, [country, accountNumber, routingNumber, currency]),
    { successMessage: "Stripe account signup submitted." }
  );

  useEffect(() => {
    adminRepository.getBuildingExternalData().then((d) => {
      setData(d);
      setCountry(d.stripe.country || "CA");
      setCurrency(d.stripe.currency || "CAD");
    });
  }, []);

  useEffect(() => {
    if (country === "CA") setCurrency("CAD");
    else if (country === "US") setCurrency("USD");
  }, [country]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void submitStripe();
  };

  if (!data) return <p className="text-sm text-slate-500">Loading…</p>;

  if (data.stripe.connected) {
    return (
      <AdminSectionPanel title="Stripe Online Payment System" variant="primary" icon={<FaCreditCard />}>
        <p className="text-center text-sm text-slate-600">
          Your building is connected to Stripe for online payments.
        </p>
        <p className="mt-4 text-center text-xs text-slate-500">
          Country: {data.stripe.country} · Currency: {data.stripe.currency}
        </p>
      </AdminSectionPanel>
    );
  }

  return (
    <AdminSectionPanel title="Stripe Online Payment System" variant="primary" icon={<FaCreditCard />}>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <div className="flex h-[90px] w-[140px] shrink-0 items-center justify-center rounded border border-slate-200 bg-[#635bff] text-lg font-bold text-white">
          stripe
        </div>
        <p className="text-sm text-slate-700">
          <strong>
            Would you like to receive secure online credit card payments from your residents for Amenity
            Reservations, Parking Permits, and Building Store Orders? Simply click the button below to get
            started today!
          </strong>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6">
        <AdminSectionPanel title="Bank Account Information" variant="purple">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="text-sm font-medium text-slate-700">
                Country <span className="text-red-600">*</span>
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                required
                className={inputClass}
              >
                {STRIPE_COUNTRIES.map((c) => (
                  <option key={c.value || "empty"} value={c.value}>
                    {c.label || "Select"}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">
                Account Number <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">
                {country === "CA" ? "Transit / Institution / Account" : "Routing Number"}{" "}
                <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={routingNumber}
                onChange={(e) => setRoutingNumber(e.target.value)}
                placeholder={country === "CA" ? "99999-999" : "999999999"}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">
                Currency <span className="text-red-600">*</span>
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                required
                className={inputClass}
              >
                <option value="">Select</option>
                {STRIPE_CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </AdminSectionPanel>

        {error ? <FormAlert message={error} className="mt-4" /> : null}
        <div className="mt-6 text-center">
          <ActionButton
            label="Sign up to accept credit cards now"
            loadingLabel="Submitting…"
            loading={submitting}
            type="submit"
          />
        </div>
      </form>
    </AdminSectionPanel>
  );
}
