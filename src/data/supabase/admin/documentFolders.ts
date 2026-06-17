import { mapDbError, sb } from "../base";

const DEFAULT_FOLDERS: Array<{ name: string; section: "resident-portal" | "admin-only" }> = [
  { name: "General Documents", section: "resident-portal" },
  { name: "Bylaws", section: "resident-portal" },
  { name: "Budget", section: "resident-portal" },
  { name: "Minutes - AGM", section: "resident-portal" },
  { name: "Forms", section: "resident-portal" },
  { name: "Insurance", section: "resident-portal" },
  { name: "Rules and Regulations", section: "resident-portal" },
  { name: "Admin Only", section: "admin-only" },
];

export async function ensureDefaultDocumentFolders(buildingId: string): Promise<void> {
  const { count, error: countError } = await sb()
    .from("document_folders")
    .select("id", { count: "exact", head: true })
    .eq("building_id", buildingId);
  mapDbError(countError);
  if ((count ?? 0) > 0) return;

  const { error } = await sb().from("document_folders").insert(
    DEFAULT_FOLDERS.map((folder) => ({
      building_id: buildingId,
      name: folder.name,
      section: folder.section,
    }))
  );
  mapDbError(error);
}
