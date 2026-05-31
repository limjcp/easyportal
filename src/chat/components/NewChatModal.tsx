import { useEffect, useMemo, useState } from "react";
import { Modal } from "../../shared/Modal";
import type { ChatActor, ChatContact } from "../../resident/data/types";
import { chatRepository } from "../data/chatRepository";

type NewChatModalProps = {
  open: boolean;
  onClose: () => void;
  actor: ChatActor;
  onCreated: (conversationId: string) => void;
};

export function NewChatModal({ open, onClose, actor, onCreated }: NewChatModalProps) {
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [search, setSearch] = useState("");
  const [buildingFilter, setBuildingFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setSearch("");
    setBuildingFilter("all");
    setSelectedIds([]);
    setError("");
    chatRepository.getContacts(actor).then(setContacts);
  }, [open, actor]);

  const buildingOptions = useMemo(() => {
    const map = new Map<string, string>();
    contacts.forEach((c) => map.set(c.buildingId, c.buildingLabel));
    return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
  }, [contacts]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return contacts.filter((c) => {
      if (buildingFilter !== "all" && c.buildingId !== buildingFilter) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.role.toLowerCase().includes(q)
      );
    });
  }, [contacts, search, buildingFilter]);

  const grouped = useMemo(() => {
    if (!actor.canMessageAnyBuilding) return [{ label: "", items: filtered }];
    const byBuilding = new Map<string, ChatContact[]>();
    filtered.forEach((c) => {
      const list = byBuilding.get(c.buildingLabel) ?? [];
      list.push(c);
      byBuilding.set(c.buildingLabel, list);
    });
    return Array.from(byBuilding.entries()).map(([label, items]) => ({ label, items }));
  }, [filtered, actor.canMessageAnyBuilding]);

  const toggle = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleStart = async () => {
    setSubmitting(true);
    setError("");
    try {
      const conv = await chatRepository.createConversation(actor, selectedIds);
      onCreated(conv.id);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start conversation");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New conversation"
      size="md"
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          {error ? <p className="text-sm text-red-600">{error}</p> : <span />}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={selectedIds.length === 0 || submitting}
              onClick={handleStart}
              className="rounded bg-[#3476ef] px-4 py-2 text-sm font-medium text-white hover:bg-[#2d68cf] disabled:opacity-50"
            >
              {submitting ? "Starting…" : "Start chat"}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-3">
        {actor.canMessageAnyBuilding && buildingOptions.length > 1 && (
          <select
            value={buildingFilter}
            onChange={(e) => setBuildingFilter(e.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="all">All buildings</option>
            {buildingOptions.map((b) => (
              <option key={b.id} value={b.id}>
                {b.label}
              </option>
            ))}
          </select>
        )}
        <input
          type="search"
          placeholder="Search by name, email, or role…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
        />
        <div className="max-h-64 space-y-3 overflow-y-auto">
          {grouped.map((group) => (
            <div key={group.label || "default"}>
              {group.label && (
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {group.label}
                </p>
              )}
              <ul className="divide-y divide-slate-100 rounded border border-slate-200">
                {group.items.map((c) => (
                  <li key={c.id}>
                    <label className="flex cursor-pointer items-start gap-3 px-3 py-2 hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(c.id)}
                        onChange={() => toggle(c.id)}
                        className="mt-1"
                      />
                      <span>
                        <span className="block text-sm font-medium text-slate-800">{c.name}</span>
                        <span className="block text-xs text-slate-500">
                          {c.role} · {c.email}
                        </span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="py-4 text-center text-sm text-slate-500">No contacts match your search.</p>
          )}
        </div>
      </div>
    </Modal>
  );
}
