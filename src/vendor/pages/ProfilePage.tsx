import { useEffect, useState, type FormEvent } from "react";
import { vendorRepository } from "../data/vendorRepository";
import type { Vendor } from "../../resident/data/types";

type ProfilePageProps = {
  onRefresh: () => void;
};

export function ProfilePage({ onRefresh }: ProfilePageProps) {
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);

  const load = () => {
    vendorRepository.getVendor().then((s) => {
      setVendor(s);
      setContactName(s.contactName);
      setPhone(s.phone);
      setNotes(s.notes ?? "");
    });
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    await vendorRepository.updateProfile({ contactName, phone, notes: notes || undefined });
    setSaved(true);
    onRefresh();
    load();
    setTimeout(() => setSaved(false), 2000);
  };

  const handleCompleteInvite = async () => {
    await vendorRepository.completeInvitation();
    onRefresh();
    load();
    alert("Registration complete. Your account is now active.");
  };

  if (!vendor) return <p className="text-sm text-slate-600">Loading profile…</p>;

  return (
    <div>
      <div className="mb-4 rounded bg-[#0d9488] px-4 py-2 text-sm font-semibold text-white">
        Company Profile
      </div>

      {vendor.status === "pending_invite" && (
        <div className="mb-4 rounded border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-medium">Complete your registration</p>
          <p className="mt-1">You were invited to join the vendor registry. Confirm to activate your account.</p>
          <button
            type="button"
            onClick={handleCompleteInvite}
            className="mt-2 rounded bg-[#0d9488] px-4 py-2 text-sm text-white"
          >
            Complete registration
          </button>
        </div>
      )}

      <div className="mb-6 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
        <p>
          <strong>Company:</strong> {vendor.companyName}
        </p>
        <p>
          <strong>Trade:</strong> {vendor.tradeCategory}
        </p>
        <p>
          <strong>Email:</strong> {vendor.email}
        </p>
        <p>
          <strong>Status:</strong>{" "}
          <span className="capitalize">{vendor.status.replace("_", " ")}</span>
        </p>
      </div>

      <form onSubmit={handleSave} className="max-w-md space-y-4 rounded border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-800">Contact details</h3>
        <label className="block text-sm">
          <span className="text-slate-600">Contact name</span>
          <input
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="text-slate-600">Phone</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="text-slate-600">Notes</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
          />
        </label>
        <div className="flex items-center gap-3">
          <button type="submit" className="rounded bg-[#0d9488] px-4 py-2 text-sm text-white">
            Save changes
          </button>
          {saved && <span className="text-sm text-green-600">Saved.</span>}
        </div>
      </form>
    </div>
  );
}
