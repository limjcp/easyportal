import { useCallback, useEffect, useState } from "react";
import { FaUserCircle } from "react-icons/fa";
import { ActionButton } from "../../shared/ActionButton";
import { FormAlert } from "../../shared/FormAlert";
import { useAsyncAction } from "../../shared/useAsyncAction";
import { ModuleMessageBanner } from "../components/ModuleMessageBanner";
import { formatDisplayDate, isTermExpiringSoon } from "../data/fireSafetyUtils";
import { residentRepo } from "../data/mockRepository";
import type { BoardFaqItem, BoardMember, BoardMemberApplication } from "../data/types";

const inputClass =
  "rounded border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800 placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-500";

export function BoardMemberPage() {
  const [faqs, setFaqs] = useState<BoardFaqItem[]>([]);
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [applications, setApplications] = useState<BoardMemberApplication[]>([]);
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [statement, setStatement] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    residentRepo.getBoardFaqs().then(setFaqs);
    residentRepo.getBoardMembers().then(setMembers);
    residentRepo.getBoardApplications().then(setApplications);
    residentRepo.getUser().then((user) => {
      setName(user.name);
      setUnit(user.unit);
      setEmail(user.email);
      setPhone(user.phone);
    });
  }, []);

  const myApplication = applications.find((a) => a.unit === unit);

  const { run: submitApplication, loading: submitting, error, clearError, setError } = useAsyncAction(
    useCallback(async () => {
      await residentRepo.submitBoardApplication({
        residentName: name.trim(),
        unit: unit.trim(),
        email: email.trim(),
        phone: phone.trim(),
        statement: statement.trim(),
      });
      const updated = await residentRepo.getBoardApplications();
      setApplications(updated);
    }, [email, name, phone, statement, unit]),
    {
      successMessage: "Application submitted.",
      errorMessage: "Unable to submit application.",
      onSuccess: () => setSubmitted(true),
    }
  );

  const handleSubmit = async () => {
    clearError();
    if (!name.trim() || !unit.trim() || !email.trim() || !statement.trim()) {
      setError("Please fill in all required fields.");
      return;
    }
    await submitApplication();
  };

  return (
    <div className="space-y-6">
      <div className="rounded-sm bg-white/95 p-4 shadow-lg sm:p-6">
        <ModuleMessageBanner moduleId="boardMember" />

        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-800">Board FAQ & Qualifications</h2>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <details key={faq.id} className="rounded border border-slate-200 bg-white p-4">
                <summary className="cursor-pointer font-medium text-slate-800">{faq.question}</summary>
                <p className="mt-2 text-sm text-slate-600">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>
      </div>

      <div className="rounded-sm bg-white/95 p-4 shadow-lg sm:p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">Current Board Members</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600">
                <th className="px-3 py-2 font-medium">Member</th>
                <th className="px-3 py-2 font-medium">Unit</th>
                <th className="px-3 py-2 font-medium">Role</th>
                <th className="px-3 py-2 font-medium">Term Expires</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => {
                const expiringSoon = isTermExpiringSoon(member.termEndDate);
                return (
                  <tr key={member.id} className="border-b border-slate-100">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <FaUserCircle className="text-2xl text-slate-300" />
                        <span className="font-medium text-slate-800">{member.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-slate-700">{member.unit}</td>
                    <td className="px-3 py-3 text-slate-700">{member.role}</td>
                    <td className="px-3 py-3">
                      <span
                        className={
                          expiringSoon
                            ? "rounded bg-amber-100 px-2 py-0.5 font-medium text-amber-800"
                            : "text-slate-700"
                        }
                      >
                        {formatDisplayDate(member.termEndDate)}
                        {expiringSoon && " (soon)"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-sm bg-white/95 p-4 shadow-lg sm:p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">Apply to Join the Board</h2>
        {submitted || myApplication ? (
          <div className="rounded border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            <p className="font-medium">Application received</p>
            <p className="mt-1">
              {myApplication
                ? `Submitted on ${myApplication.submittedAt} — Status: ${myApplication.status}`
                : "Thank you. Management will review your application and contact you if a position becomes available."}
            </p>
          </div>
        ) : (
          <div className="grid max-w-xl gap-4">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-600">Name *</span>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-600">Unit *</span>
              <input type="text" value={unit} onChange={(e) => setUnit(e.target.value)} className={inputClass} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-600">Email *</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-600">Phone</span>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-600">Why would you like to serve on the board? *</span>
              <textarea
                value={statement}
                onChange={(e) => setStatement(e.target.value)}
                rows={4}
                className={`${inputClass} resize-y`}
                placeholder="Tell us about your experience and interest in board service..."
              />
            </label>
            {error ? <FormAlert message={error} /> : null}
            <div>
              <ActionButton
                label="Submit Application"
                loadingLabel="Submitting…"
                loading={submitting}
                onClick={() => void handleSubmit()}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
