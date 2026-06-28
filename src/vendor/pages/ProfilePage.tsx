import { useCallback, useEffect, useState, type FormEvent } from "react";
import { ActionButton } from "../../shared/ActionButton";
import { CrudPanel } from "../../shared/CrudPanel";
import { FormAlert } from "../../shared/FormAlert";
import { useAsyncAction } from "../../shared/useAsyncAction";
import { vendorRepository } from "../data/vendorRepository";
import type { Vendor } from "../../resident/data/types";

type ProfilePageProps = {
  onRefresh: () => void;
};

export function ProfilePage({ onRefresh }: ProfilePageProps) {
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    vendorRepository
      .getVendor()
      .then((s) => {
        setVendor(s);
        setContactName(s.contactName);
        setPhone(s.phone);
        setNotes(s.notes ?? "");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const { run: saveProfile, loading: saving, error: saveError } = useAsyncAction(
    useCallback(async () => {
      await vendorRepository.updateProfile({ contactName, phone, notes: notes || undefined });
      onRefresh();
      load();
    }, [contactName, load, notes, onRefresh, phone]),
    {
      successMessage: "Profile saved.",
      errorMessage: "Unable to save profile.",
      onSuccess: () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      },
    }
  );

  const { run: completeInvite, loading: completingInvite, error: inviteError } = useAsyncAction(
    useCallback(async () => {
      await vendorRepository.completeInvitation();
      onRefresh();
      load();
    }, [load, onRefresh]),
    {
      successMessage: "Registration complete. Your account is now active.",
      errorMessage: "Unable to complete registration.",
    }
  );

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    void saveProfile();
  };

  const displayError = saveError ?? inviteError;

  return (
    <CrudPanel loading={loading}>
    <div>
      <div className="mb-4 rounded bg-[#0d9488] px-4 py-2 text-sm font-semibold text-white">
        Company Profile
      </div>

      {displayError ? <FormAlert message={displayError} className="mb-4" /> : null}

      {vendor?.status === "pending_invite" && (
        <div className="mb-4 rounded border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-medium">Complete your registration</p>
          <p className="mt-1">You were invited to join the vendor registry. Confirm to activate your account.</p>
          <ActionButton
            label="Complete registration"
            loadingLabel="Completing…"
            loading={completingInvite}
            className="mt-2 bg-[#0d9488] hover:bg-[#0b7a70]"
            onClick={() => void completeInvite()}
          />
        </div>
      )}

      <div className="mb-6 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
        <p>
          <strong>Company:</strong> {vendor?.companyName}
        </p>
        <p>
          <strong>Trade:</strong> {vendor?.tradeCategory}
        </p>
        <p>
          <strong>Email:</strong> {vendor?.email}
        </p>
        <p>
          <strong>Status:</strong>{" "}
          <span className="capitalize">{vendor?.status.replace("_", " ")}</span>
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
          <ActionButton
            type="submit"
            label="Save changes"
            loadingLabel="Saving…"
            loading={saving}
            className="bg-[#0d9488] hover:bg-[#0b7a70]"
          />
          {saved && !saving ? <span className="text-sm text-green-600">Saved.</span> : null}
        </div>
      </form>
    </div>
    </CrudPanel>
  );
}
