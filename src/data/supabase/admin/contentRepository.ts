import type {
  AdminNewsItem,
  AgmMeeting,
  CalendarEvent,
  CreateCalendarEventInput,
  CreateDocumentInput,
  CreatePollInput,
  DocumentStorageStats,
  FaqItem,
  GalleryAlbum,
  Poll,
  PollAttachment,
  PollQuestion,
  PollQuestionResult,
  PollResponseVoter,
  PollResults,
} from "../../../resident/data/types";
import { parsePollAnswerOptions } from "../../../shared/pollUtils";
import { mapDbError, nowIso, sb, todayIsoDate } from "../base";
import {
  mapAdminNews,
  mapAgmMeeting,
  mapCalendarEvent,
  mapDocumentFile,
  mapFaq,
  mapGalleryAlbum,
  mapPoll,
  mapPollAttachment,
  mapPollQuestion,
} from "./mappers";
import { ensureDefaultDocumentFolders } from "./documentFolders";
import { bid } from "./shared";
import {
  formatFileSize,
  getBuildingDocumentSignedUrl,
  inferDocumentFileType,
  removeBuildingDocument,
  uploadBuildingDocument,
} from "../storage";

async function loadPollQuestions(pollIds: string[]): Promise<Map<string, PollQuestion[]>> {
  if (pollIds.length === 0) return new Map();
  const { data, error } = await sb()
    .from("poll_questions")
    .select("*")
    .in("poll_id", pollIds)
    .order("sort_order", { ascending: true });
  mapDbError(error);
  const map = new Map<string, PollQuestion[]>();
  for (const row of data ?? []) {
    const pollId = row.poll_id as string;
    const list = map.get(pollId) ?? [];
    list.push(mapPollQuestion(row as Record<string, unknown>));
    map.set(pollId, list);
  }
  return map;
}

export const contentRepository = {
  async getNews(tab: "current" | "archived" = "current") {
    const buildingId = await bid();
    const { data, error } = await sb().from("news_items").select("*").eq("building_id", buildingId);
    mapDbError(error);
    return (data ?? [])
      .filter((n) => (tab === "archived" ? n.archived : !n.archived))
      .map((n) => mapAdminNews(n as Record<string, unknown>));
  },

  async getNewsById(id: string) {
    const { data, error } = await sb().from("news_items").select("*").eq("id", id).maybeSingle();
    mapDbError(error);
    return data ? mapAdminNews(data as Record<string, unknown>) : null;
  },

  async archiveNews(id: string) {
    await sb().from("news_items").update({ archived: true, status: "archived" }).eq("id", id);
  },

  async unarchiveNews(id: string) {
    await sb().from("news_items").update({ archived: false, status: "active" }).eq("id", id);
  },

  async createNews(title: string) {
    const buildingId = await bid();
    const { data, error } = await sb()
      .from("news_items")
      .insert({
        building_id: buildingId,
        title,
        news_date: todayIsoDate(),
        status: "draft",
        post_time: "09:00 AM",
        edit_history: [
          { status: "draft", date: new Date().toLocaleString(), user: "Admin", action: "Draft Created" },
        ],
      })
      .select("*")
      .single();
    mapDbError(error);
    return mapAdminNews(data as Record<string, unknown>);
  },

  async updateNews(id: string, updates: Partial<AdminNewsItem>) {
    const payload: Record<string, unknown> = { updated_at: nowIso() };
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.body !== undefined) payload.body = updates.body;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.date !== undefined) payload.news_date = updates.date;
    if (updates.expires !== undefined) payload.expires = updates.expires;
    if (updates.postTime !== undefined) payload.post_time = updates.postTime;
    if (updates.noNotifications !== undefined) payload.no_notifications = updates.noNotifications;
    if (updates.residentTypes !== undefined) payload.resident_types = updates.residentTypes;
    if (updates.adminCcTypes !== undefined) payload.admin_cc_types = updates.adminCcTypes;
    if (updates.showToFilter !== undefined) payload.show_to_filter = updates.showToFilter;
    if (updates.editHistory !== undefined) payload.edit_history = updates.editHistory;
    if (updates.imageUrl !== undefined) payload.image_url = updates.imageUrl || null;
    if (updates.attachmentName !== undefined) payload.attachment_name = updates.attachmentName || null;
    if (updates.attachmentUrl !== undefined) payload.attachment_url = updates.attachmentUrl || null;
    const { data, error } = await sb().from("news_items").update(payload).eq("id", id).select("*").maybeSingle();
    mapDbError(error);
    return data ? mapAdminNews(data as Record<string, unknown>) : null;
  },

  async getPolls() {
    const buildingId = await bid();
    const { data, error } = await sb().from("polls").select("*").eq("building_id", buildingId);
    mapDbError(error);
    const ids = (data ?? []).map((p) => p.id as string);
    const questions = await loadPollQuestions(ids);
    return (data ?? []).map((p) => mapPoll(p as Record<string, unknown>, questions.get(p.id as string) ?? []));
  },

  async getPollById(id: string) {
    const { data, error } = await sb().from("polls").select("*").eq("id", id).maybeSingle();
    mapDbError(error);
    if (!data) return null;
    const questions = await loadPollQuestions([id]);
    return mapPoll(data as Record<string, unknown>, questions.get(id) ?? []);
  },

  async getPollResults(pollId: string): Promise<PollResults | null> {
    const poll = await this.getPollById(pollId);
    if (!poll) return null;

    const buildingId = await bid();
    const { data, error } = await sb()
      .from("poll_responses")
      .select("*, profiles(display_name), units(label)")
      .eq("poll_id", pollId)
      .eq("building_id", buildingId)
      .order("created_at", { ascending: true });
    mapDbError(error);

    const questionMap = new Map(poll.questions.map((question) => [question.id, question]));
    const voters: PollResponseVoter[] = (data ?? []).map((row) => {
      const record = row as Record<string, unknown>;
      const answer = record.answer as { selected?: string } | null;
      const profile = record.profiles as { display_name?: string } | null;
      const unit = record.units as { label?: string } | null;
      const questionId = record.question_id as string;
      const question = questionMap.get(questionId);
      return {
        responseId: record.id as string,
        questionId,
        question: question?.question ?? "Unknown question",
        voterName: profile?.display_name ?? "Unknown",
        unitLabel: unit?.label ?? "—",
        selectedOption: answer?.selected ?? "",
        submittedAt: String(record.created_at),
      };
    });

    const questions: PollQuestionResult[] = poll.questions
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((question) => {
        const configuredOptions = parsePollAnswerOptions(question);
        const questionVoters = voters.filter((voter) => voter.questionId === question.id);
        const totalResponses = questionVoters.length;
        const countByOption = new Map<string, number>();

        for (const option of configuredOptions) {
          countByOption.set(option, 0);
        }
        for (const voter of questionVoters) {
          countByOption.set(voter.selectedOption, (countByOption.get(voter.selectedOption) ?? 0) + 1);
        }

        const optionLabels =
          configuredOptions.length > 0 ? configuredOptions : [...countByOption.keys()];

        return {
          questionId: question.id,
          question: question.question,
          sortOrder: question.sortOrder,
          totalResponses,
          options: optionLabels.map((label) => {
            const count = countByOption.get(label) ?? 0;
            return {
              label,
              count,
              percentage: totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0,
            };
          }),
        };
      });

    return {
      pollId,
      privacy: poll.privacy,
      totalResponses: voters.length,
      questions,
      voters,
    };
  },

  async createPoll(input: CreatePollInput) {
    const buildingId = await bid();
    const { data, error } = await sb()
      .from("polls")
      .insert({
        building_id: buildingId,
        title: input.title,
        status: "draft",
        no_notifications: true,
        privacy: "not-anonymous",
        resident_types: [
          "Board Members",
          "Absentee Owner",
          "Owners",
          "Tenants",
          "Occupants",
          "Unit Managers",
        ],
        show_to_filter: "No filter",
      })
      .select("*")
      .single();
    mapDbError(error);
    return mapPoll(data as Record<string, unknown>, []);
  },

  async updatePoll(id: string, updates: Partial<Poll>) {
    const payload: Record<string, unknown> = { updated_at: nowIso() };
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.noNotifications !== undefined) payload.no_notifications = updates.noNotifications;
    if (updates.privacy !== undefined) payload.privacy = updates.privacy;
    if (updates.residentTypes !== undefined) payload.resident_types = updates.residentTypes;
    if (updates.showToFilter !== undefined) payload.show_to_filter = updates.showToFilter;
    if (updates.expiresAt !== undefined) payload.expires_at = updates.expiresAt || null;
    if (updates.agmMeetingId !== undefined) payload.agm_meeting_id = updates.agmMeetingId || null;
    const { data, error } = await sb().from("polls").update(payload).eq("id", id).select("*").maybeSingle();
    mapDbError(error);
    if (!data) return null;
    const questions = await loadPollQuestions([id]);
    return mapPoll(data as Record<string, unknown>, questions.get(id) ?? []);
  },

  async addPollQuestion(pollId: string, question: Omit<PollQuestion, "id">) {
    const buildingId = await bid();
    const options = question.answerOptions
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    const { data, error } = await sb()
      .from("poll_questions")
      .insert({
        poll_id: pollId,
        building_id: buildingId,
        question_text: question.question,
        question_type: question.type,
        options,
        sort_order: question.sortOrder,
      })
      .select("*")
      .single();
    mapDbError(error);
    return mapPollQuestion(data as Record<string, unknown>);
  },

  async updatePollQuestion(questionId: string, updates: Partial<Omit<PollQuestion, "id">>) {
    const payload: Record<string, unknown> = {};
    if (updates.question !== undefined) payload.question_text = updates.question;
    if (updates.type !== undefined) payload.question_type = updates.type;
    if (updates.sortOrder !== undefined) payload.sort_order = updates.sortOrder;
    if (updates.answerOptions !== undefined) {
      payload.options = updates.answerOptions
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    if (Object.keys(payload).length === 0) {
      const { data, error } = await sb()
        .from("poll_questions")
        .select("*")
        .eq("id", questionId)
        .maybeSingle();
      mapDbError(error);
      return data ? mapPollQuestion(data as Record<string, unknown>) : null;
    }
    const { data, error } = await sb()
      .from("poll_questions")
      .update(payload)
      .eq("id", questionId)
      .select("*")
      .maybeSingle();
    mapDbError(error);
    return data ? mapPollQuestion(data as Record<string, unknown>) : null;
  },

  async deletePollQuestion(questionId: string) {
    await sb().from("poll_questions").delete().eq("id", questionId);
  },

  async getPollAttachments(pollId: string) {
    const { data, error } = await sb()
      .from("poll_attachments")
      .select("*")
      .eq("poll_id", pollId)
      .order("created_at", { ascending: false });
    mapDbError(error);
    return (data ?? []).map((a) => mapPollAttachment(a as Record<string, unknown>));
  },

  async addPollAttachment(
    pollId: string,
    input: Omit<PollAttachment, "id" | "pollId" | "createdAt">
  ) {
    const buildingId = await bid();
    const { data, error } = await sb()
      .from("poll_attachments")
      .insert({
        poll_id: pollId,
        building_id: buildingId,
        label: input.name,
        file_name: input.name,
        storage_path: input.sourceUrl,
        kind: input.kind,
      })
      .select("*")
      .single();
    mapDbError(error);
    return mapPollAttachment(data as Record<string, unknown>);
  },

  async removePollAttachment(attachmentId: string) {
    await sb().from("poll_attachments").delete().eq("id", attachmentId);
    return true;
  },

  async getAgmMeetings() {
    const buildingId = await bid();
    const { data, error } = await sb()
      .from("agm_meetings")
      .select("*")
      .eq("building_id", buildingId)
      .order("scheduled_date", { ascending: false });
    mapDbError(error);
    return (data ?? []).map((m) => mapAgmMeeting(m as Record<string, unknown>));
  },

  async getAgmMeetingById(id: string) {
    const { data, error } = await sb().from("agm_meetings").select("*").eq("id", id).maybeSingle();
    mapDbError(error);
    return data ? mapAgmMeeting(data as Record<string, unknown>) : null;
  },

  async createAgmMeeting(
    input: Omit<AgmMeeting, "id" | "createdAt" | "status" | "startedAt" | "endedAt">
  ) {
    const buildingId = await bid();
    const { data, error } = await sb()
      .from("agm_meetings")
      .insert({
        building_id: buildingId,
        title: input.title,
        scheduled_date: input.scheduledDate,
        scheduled_time: (input as { scheduledTime?: string }).scheduledTime ?? "",
        location: input.location ?? "",
        description: input.notes ?? "",
        status: "draft",
      })
      .select("*")
      .single();
    mapDbError(error);
    return mapAgmMeeting(data as Record<string, unknown>);
  },

  async updateAgmMeeting(id: string, updates: Partial<AgmMeeting>) {
    const payload: Record<string, unknown> = { updated_at: nowIso() };
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.scheduledDate !== undefined) payload.scheduled_date = updates.scheduledDate;
    if ((updates as { scheduledTime?: string }).scheduledTime !== undefined) {
      payload.scheduled_time = (updates as { scheduledTime?: string }).scheduledTime;
    }
    if (updates.location !== undefined) payload.location = updates.location;
    if (updates.notes !== undefined) payload.description = updates.notes;
    if (updates.status !== undefined) payload.status = updates.status;
    const { data, error } = await sb().from("agm_meetings").update(payload).eq("id", id).select("*").maybeSingle();
    mapDbError(error);
    return data ? mapAgmMeeting(data as Record<string, unknown>) : null;
  },

  async startAgmMeeting(id: string) {
    const { data, error } = await sb()
      .from("agm_meetings")
      .update({ status: "active", started_at: nowIso(), ended_at: null })
      .eq("id", id)
      .select("*")
      .maybeSingle();
    mapDbError(error);
    return data ? mapAgmMeeting(data as Record<string, unknown>) : null;
  },

  async endAgmMeeting(id: string) {
    const { data, error } = await sb()
      .from("agm_meetings")
      .update({ status: "ended", ended_at: nowIso() })
      .eq("id", id)
      .select("*")
      .maybeSingle();
    mapDbError(error);
    return data ? mapAgmMeeting(data as Record<string, unknown>) : null;
  },

  getSurveys() {
    return this.getPolls();
  },

  getSurveyById(id: string) {
    return this.getPollById(id);
  },

  createSurvey(input: CreatePollInput) {
    return this.createPoll(input);
  },

  updateSurvey(id: string, updates: Partial<Poll>) {
    return this.updatePoll(id, updates);
  },

  addSurveyQuestion(pollId: string, question: Omit<PollQuestion, "id">) {
    return this.addPollQuestion(pollId, question);
  },

  async getDocumentFolders() {
    const buildingId = await bid();
    await ensureDefaultDocumentFolders(buildingId);
    const { data, error } = await sb().from("document_folders").select("*").eq("building_id", buildingId);
    mapDbError(error);
    return (data ?? []).map((f) => ({
      id: f.id as string,
      name: f.name as string,
      section: f.section as "resident-portal" | "admin-only",
    }));
  },

  async getDocumentStorageStats(): Promise<DocumentStorageStats> {
    const buildingId = await bid();
    const { data, error } = await sb()
      .from("document_files")
      .select("size_label")
      .eq("building_id", buildingId);
    mapDbError(error);
    let usedMb = 0;
    for (const f of data ?? []) {
      const label = String(f.size_label ?? "");
      const match = label.match(/([\d.]+)\s*(kb|mb|gb)/i);
      if (match) {
        const n = parseFloat(match[1]);
        const unit = match[2].toLowerCase();
        if (unit === "gb") usedMb += n * 1024;
        else if (unit === "mb") usedMb += n;
        else usedMb += n / 1024;
      }
    }
    return { usedMb: Math.round(usedMb * 10) / 10, totalMb: 1000 };
  },

  async getDocuments(folderId: string) {
    const { data, error } = await sb().from("document_files").select("*").eq("folder_id", folderId);
    mapDbError(error);
    return (data ?? []).map((d) => mapDocumentFile(d as Record<string, unknown>));
  },

  async createDocument(
    file: File,
    input: Pick<CreateDocumentInput, "folderId" | "title" | "shownTo"> & { date?: string }
  ) {
    const buildingId = await bid();
    const storagePath = await uploadBuildingDocument(buildingId, file);
    const { data, error } = await sb()
      .from("document_files")
      .insert({
        building_id: buildingId,
        folder_id: input.folderId,
        file_type: inferDocumentFileType(file.name, file.type),
        title: input.title,
        file_date: input.date || todayIsoDate(),
        filename: file.name,
        storage_path: storagePath,
        size_label: formatFileSize(file.size),
        shown_to: input.shownTo,
        download_count: 0,
      })
      .select("*")
      .single();
    if (error) {
      await removeBuildingDocument(storagePath).catch(() => undefined);
      mapDbError(error);
    }
    return mapDocumentFile(data as Record<string, unknown>);
  },

  async getDocumentDownloadUrl(id: string): Promise<string> {
    const buildingId = await bid();
    const { data, error } = await sb()
      .from("document_files")
      .select("storage_path")
      .eq("id", id)
      .eq("building_id", buildingId)
      .maybeSingle();
    mapDbError(error);
    if (!data?.storage_path) throw new Error("Document file is not available for download.");
    return getBuildingDocumentSignedUrl(String(data.storage_path));
  },

  async deleteDocument(id: string) {
    const buildingId = await bid();
    const { data, error } = await sb()
      .from("document_files")
      .select("storage_path")
      .eq("id", id)
      .eq("building_id", buildingId)
      .maybeSingle();
    mapDbError(error);
    await removeBuildingDocument(data?.storage_path as string | undefined).catch(() => undefined);
    const { error: deleteError } = await sb().from("document_files").delete().eq("id", id);
    mapDbError(deleteError);
  },

  async getEvents(options?: { type?: CalendarEvent["eventType"]; adminOnly?: boolean }) {
    const buildingId = await bid();
    let query = sb().from("calendar_events").select("*").eq("building_id", buildingId);
    if (options?.type) query = query.eq("event_type", options.type);
    if (options?.adminOnly === true) query = query.eq("admin_only", true);
    else if (options?.adminOnly === false) query = query.eq("admin_only", false);
    const { data, error } = await query;
    mapDbError(error);
    return (data ?? []).map((e) => mapCalendarEvent(e as Record<string, unknown>));
  },

  async createEvent(event: CreateCalendarEventInput) {
    const buildingId = await bid();
    const { data, error } = await sb()
      .from("calendar_events")
      .insert({
        building_id: buildingId,
        title: event.title,
        event_date: event.date,
        description: event.description,
        event_type: event.eventType,
        status: event.status,
        location: event.location,
        show_to: event.showTo,
        admin_only: event.adminOnly ?? false,
        occurrence: event.occurrence,
        day_label: event.day,
      })
      .select("*")
      .single();
    mapDbError(error);
    return mapCalendarEvent(data as Record<string, unknown>);
  },

  async updateEvent(id: string, updates: Partial<CalendarEvent>) {
    const payload: Record<string, unknown> = { updated_at: nowIso() };
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.date !== undefined) payload.event_date = updates.date;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.eventType !== undefined) payload.event_type = updates.eventType;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.location !== undefined) payload.location = updates.location;
    if (updates.showTo !== undefined) payload.show_to = updates.showTo;
    if (updates.adminOnly !== undefined) payload.admin_only = updates.adminOnly;
    if (updates.occurrence !== undefined) payload.occurrence = updates.occurrence;
    if (updates.day !== undefined) payload.day_label = updates.day;
    const { data, error } = await sb().from("calendar_events").update(payload).eq("id", id).select("*").maybeSingle();
    mapDbError(error);
    return data ? mapCalendarEvent(data as Record<string, unknown>) : null;
  },

  async deleteEvent(id: string) {
    await sb().from("calendar_events").delete().eq("id", id);
  },

  async getFaqs() {
    const buildingId = await bid();
    const { data, error } = await sb()
      .from("faq_items")
      .select("*")
      .eq("building_id", buildingId)
      .order("sort_order", { ascending: true });
    mapDbError(error);
    return (data ?? []).map((f) => mapFaq(f as Record<string, unknown>));
  },

  async createFaq(faq: Omit<FaqItem, "id">) {
    const buildingId = await bid();
    const { data, error } = await sb()
      .from("faq_items")
      .insert({ building_id: buildingId, question: faq.question, answer: faq.answer })
      .select("*")
      .single();
    mapDbError(error);
    return mapFaq(data as Record<string, unknown>);
  },

  async updateFaq(id: string, updates: Partial<FaqItem>) {
    const payload: Record<string, unknown> = {};
    if (updates.question !== undefined) payload.question = updates.question;
    if (updates.answer !== undefined) payload.answer = updates.answer;
    const { data, error } = await sb().from("faq_items").update(payload).eq("id", id).select("*").maybeSingle();
    mapDbError(error);
    return data ? mapFaq(data as Record<string, unknown>) : null;
  },

  async deleteFaq(id: string) {
    await sb().from("faq_items").delete().eq("id", id);
  },

  async getGalleryAlbums() {
    const buildingId = await bid();
    const { data, error } = await sb().from("gallery_albums").select("*").eq("building_id", buildingId);
    mapDbError(error);
    return (data ?? []).map((a) => mapGalleryAlbum(a as Record<string, unknown>));
  },

  async createAlbum(title: string) {
    const buildingId = await bid();
    const { data, error } = await sb()
      .from("gallery_albums")
      .insert({ building_id: buildingId, title, photo_count: 0 })
      .select("*")
      .single();
    mapDbError(error);
    return mapGalleryAlbum(data as Record<string, unknown>);
  },

  async updateAlbum(id: string, updates: Partial<GalleryAlbum>) {
    const payload: Record<string, unknown> = {};
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.coverUrl !== undefined) payload.cover_url = updates.coverUrl;
    if (updates.photoCount !== undefined) payload.photo_count = updates.photoCount;
    const { data, error } = await sb().from("gallery_albums").update(payload).eq("id", id).select("*").maybeSingle();
    mapDbError(error);
    return data ? mapGalleryAlbum(data as Record<string, unknown>) : null;
  },

  async deleteAlbum(id: string) {
    await sb().from("gallery_albums").delete().eq("id", id);
  },
};
