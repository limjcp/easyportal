import { requireSupabase } from "../../../lib/supabaseClient";
import type {
  AddUnitRangeType,
  BuildingDefinition,
  BuildingExternalData,
  BuildingReminder,
  BuildingTaxSettings,
  CreateStripeAccountInput,
  BuildingAmenityResourceType,
} from "../../../resident/data/types";
import { mapDbError, nowIso, sb, todayIsoDate } from "../base";
import { refreshBuildingCounts } from "../unitsUsersRepository";
import {
  mapBuildingDefinition,
  mapBuildingAmenityResource,
  mapBuildingLockerGroup,
  mapBuildingParkingGroup,
  mapBuildingReminder,
  mapBuildingTaxSettings,
  mapBuildingUnitGroup,
  mapBuildingUnitGroupDefinition,
} from "./mappers";
import { assertEdgeFunctionOk, parseEdgeFunctionError } from "../parseEdgeFunctionError";
import { bid, expandRange, resolveBuildingId } from "./shared";

export const buildingRepository = {
  async getBuildingDefinition(): Promise<BuildingDefinition> {
    const buildingId = await bid();
    const { data, error } = await sb().from("buildings").select("*").eq("id", buildingId).single();
    mapDbError(error);
    const { data: links } = await sb()
      .from("building_links")
      .select("linked_building_id")
      .eq("building_id", buildingId);
    const linkedIds = (links ?? []).map((l) => l.linked_building_id as string);
    return mapBuildingDefinition(data as Record<string, unknown>, linkedIds);
  },

  async updateBuildingDefinition(updates: Partial<BuildingDefinition>) {
    const buildingId = await bid();
    await sb()
      .from("buildings")
      .update({
        condo_name: updates.condoName,
        corporation: updates.corporation,
        corp_number: updates.corpNumber,
        address: updates.address,
        multi_address_property: updates.multiAddressProperty,
        city: updates.city,
        postal_zip: updates.postalZip,
        country: updates.country,
        province: updates.province,
        property_phone: updates.propertyPhone,
        property_email: updates.propertyEmail,
        accounting_email: updates.accountingEmail,
        billing_email: updates.billingEmail,
        sparc_email: updates.sparcEmail,
        visitor_parking_overnight_email: updates.visitorParkingOvernightEmail,
        building_types: updates.buildingTypes,
        building_features: updates.buildingFeatures,
        amenities: updates.amenities,
        common_areas: updates.commonAreas,
        image_url: updates.imageUrl ?? null,
      })
      .eq("id", buildingId);
    if (updates.linkedBuildingIds) {
      await sb().from("building_links").delete().eq("building_id", buildingId);
      if (updates.linkedBuildingIds.length) {
        await sb().from("building_links").insert(
          updates.linkedBuildingIds.map((linkedId) => ({
            building_id: buildingId,
            linked_building_id: linkedId,
          }))
        );
      }
    }
    return this.getBuildingDefinition();
  },

  async getBuildingTaxSettings(): Promise<BuildingTaxSettings> {
    const buildingId = await bid();
    const { data, error } = await sb()
      .from("building_tax_settings")
      .select("*")
      .eq("building_id", buildingId)
      .maybeSingle();
    mapDbError(error);
    return mapBuildingTaxSettings(data as Record<string, unknown> | null);
  },

  async updateBuildingTaxSettings(updates: Partial<BuildingTaxSettings>) {
    const buildingId = await bid();
    await sb().from("building_tax_settings").upsert({
      building_id: buildingId,
      master_tax_rate: updates.masterTaxRate,
      service_requests_taxable: updates.serviceRequestsTaxable,
      service_requests_tax_rate: updates.serviceRequestsTaxRate,
    });
    return this.getBuildingTaxSettings();
  },

  async getBuildingUnits() {
    const buildingId = await bid();
    const { data, error } = await sb()
      .from("units")
      .select("id, label, floor, is_occupied")
      .eq("building_id", buildingId);
    mapDbError(error);
    return mapBuildingUnitGroup(
      (data ?? []).map((u) => ({
        id: u.id as string,
        label: u.label as string,
        floor: u.floor as string,
        isOccupied: u.is_occupied as boolean,
      }))
    );
  },

  async addBuildingUnits(input: {
    floorArea: string;
    start: string;
    end: string;
    addType: AddUnitRangeType;
  }) {
    const buildingId = await bid();
    const labels = expandRange(input.start, input.end, input.addType);
    for (const label of labels) {
      const { data: existing } = await sb()
        .from("units")
        .select("id")
        .eq("building_id", buildingId)
        .eq("label", label)
        .maybeSingle();
      if (!existing) {
        await sb().from("units").insert({
          building_id: buildingId,
          label,
          floor: input.floorArea,
        });
      }
    }
    await refreshBuildingCounts(buildingId);
    return this.getBuildingUnits();
  },

  async deleteBuildingUnit(_groupId: string, unit: string) {
    const buildingId = await bid();
    await sb().from("units").delete().eq("building_id", buildingId).eq("label", unit);
  },

  async getBuildingUnitGroups() {
    const buildingId = await bid();
    const { data: groups, error } = await sb()
      .from("building_unit_groups")
      .select("*")
      .eq("building_id", buildingId);
    mapDbError(error);
    const result = [];
    for (const g of groups ?? []) {
      const { data: links } = await sb()
        .from("building_unit_group_units")
        .select("unit_id")
        .eq("unit_group_id", g.id);
      result.push(
        mapBuildingUnitGroupDefinition(
          g as Record<string, unknown>,
          (links ?? []).map((l) => l.unit_id as string)
        )
      );
    }
    return result;
  },

  async createBuildingUnitGroup(name: string, unitIds: string[]) {
    const buildingId = await bid();
    const { data, error } = await sb()
      .from("building_unit_groups")
      .insert({ building_id: buildingId, name, floor_area: "" })
      .select("*")
      .single();
    mapDbError(error);
    if (unitIds.length) {
      await sb().from("building_unit_group_units").insert(
        unitIds.map((unitId) => ({
          unit_group_id: data!.id,
          unit_id: unitId,
        }))
      );
    }
    return mapBuildingUnitGroupDefinition(data as Record<string, unknown>, unitIds);
  },

  async getBuildingParking() {
    const buildingId = await bid();
    const { data, error } = await sb()
      .from("building_parking_groups")
      .select("*")
      .eq("building_id", buildingId);
    mapDbError(error);
    return (data ?? []).map((g) => mapBuildingParkingGroup(g as Record<string, unknown>));
  },

  async getBuildingParkingPricing() {
    const buildingId = await bid();
    const { data, error } = await sb()
      .from("building_parking_pricing")
      .select("*")
      .eq("building_id", buildingId)
      .maybeSingle();
    mapDbError(error);
    return {
      regularMonthlyCost: (data?.regular_monthly_cost as string) ?? "$120.00",
      visitorMonthlyCost: (data?.visitor_monthly_cost as string) ?? "$30.00",
    };
  },

  async updateBuildingParkingPricing(updates: Partial<{ regularMonthlyCost: string; visitorMonthlyCost: string }>) {
    const buildingId = await bid();
    await sb().from("building_parking_pricing").upsert({
      building_id: buildingId,
      regular_monthly_cost: updates.regularMonthlyCost,
      visitor_monthly_cost: updates.visitorMonthlyCost,
    });
    return this.getBuildingParkingPricing();
  },

  async getResidentCondoFeeAmount() {
    const buildingId = await bid();
    const { data } = await sb()
      .from("resident_maint_fees")
      .select("monthly_fee")
      .eq("building_id", buildingId)
      .limit(1)
      .maybeSingle();
    return (data?.monthly_fee as string) ?? "$0.00";
  },

  async updateResidentCondoFeeAmount(monthlyFee: string) {
    const buildingId = await bid();
    const { data: occupancy } = await sb()
      .from("unit_occupancies")
      .select("id")
      .eq("building_id", buildingId)
      .limit(1)
      .maybeSingle();
    if (occupancy) {
      await sb().from("resident_maint_fees").upsert({
        occupancy_id: occupancy.id,
        building_id: buildingId,
        monthly_fee: monthlyFee,
        next_payment_amount: monthlyFee,
      });
    }
    return monthlyFee;
  },

  async addBuildingParking(input: {
    floorArea: string;
    start: string;
    end: string;
    addType: AddUnitRangeType;
    prefix?: string;
    visitorParking?: boolean;
  }) {
    const buildingId = await bid();
    const spaces = expandRange(input.start, input.end, input.addType, input.prefix ?? "");
    const { data: existing } = await sb()
      .from("building_parking_groups")
      .select("*")
      .eq("building_id", buildingId)
      .eq("name", input.floorArea)
      .maybeSingle();
    if (existing) {
      const merged = [...new Set([...(existing.spots as string[]), ...spaces])];
      const { error } = await sb().from("building_parking_groups").update({ spots: merged }).eq("id", existing.id);
      mapDbError(error);
    } else {
      const { error } = await sb().from("building_parking_groups").insert({
        building_id: buildingId,
        name: input.floorArea,
        spots: spaces,
      });
      mapDbError(error);
    }
    return this.getBuildingParking();
  },

  async getBuildingLockers() {
    const buildingId = await bid();
    const { data, error } = await sb()
      .from("building_locker_groups")
      .select("*")
      .eq("building_id", buildingId);
    mapDbError(error);
    return (data ?? []).map((g) => mapBuildingLockerGroup(g as Record<string, unknown>));
  },

  async addBuildingLockers(input: {
    floorArea: string;
    start: string;
    end: string;
    addType: AddUnitRangeType;
    prefix?: string;
  }) {
    const buildingId = await bid();
    const lockers = expandRange(input.start, input.end, input.addType, input.prefix ?? "");
    const { data: existing } = await sb()
      .from("building_locker_groups")
      .select("*")
      .eq("building_id", buildingId)
      .eq("name", input.floorArea)
      .maybeSingle();
    if (existing) {
      const merged = [...new Set([...(existing.lockers as string[]), ...lockers])];
      const { error } = await sb().from("building_locker_groups").update({ lockers: merged }).eq("id", existing.id);
      mapDbError(error);
    } else {
      const { error } = await sb().from("building_locker_groups").insert({
        building_id: buildingId,
        name: input.floorArea,
        lockers,
      });
      mapDbError(error);
    }
    return this.getBuildingLockers();
  },

  async getBuildingAmenityResources(resourceType?: BuildingAmenityResourceType, activeOnly = false) {
    const buildingId = await bid();
    let query = sb()
      .from("building_amenity_resources")
      .select("*")
      .eq("building_id", buildingId)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });
    if (resourceType) {
      query = query.eq("resource_type", resourceType);
    }
    if (activeOnly) {
      query = query.eq("is_active", true);
    }
    const { data, error } = await query;
    mapDbError(error);
    return (data ?? []).map((row) => mapBuildingAmenityResource(row as Record<string, unknown>));
  },

  async addBuildingAmenityResource(input: {
    resourceType: BuildingAmenityResourceType;
    name: string;
    locationLabel?: string;
  }) {
    const buildingId = await bid();
    const name = input.name.trim();
    if (!name) throw new Error("Name is required.");
    const { data: existing } = await sb()
      .from("building_amenity_resources")
      .select("sort_order")
      .eq("building_id", buildingId)
      .eq("resource_type", input.resourceType)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const sortOrder = existing?.sort_order != null ? Number(existing.sort_order) + 1 : 0;
    const { error } = await sb().from("building_amenity_resources").insert({
      building_id: buildingId,
      resource_type: input.resourceType,
      name,
      location_label: input.locationLabel?.trim() ?? "",
      sort_order: sortOrder,
    });
    mapDbError(error);
    return this.getBuildingAmenityResources(input.resourceType);
  },

  async updateBuildingAmenityResource(
    id: string,
    updates: Partial<{ name: string; locationLabel: string; isActive: boolean }>
  ) {
    const buildingId = await bid();
    const payload: Record<string, unknown> = { updated_at: nowIso() };
    if (updates.name !== undefined) {
      const name = updates.name.trim();
      if (!name) throw new Error("Name is required.");
      payload.name = name;
    }
    if (updates.locationLabel !== undefined) {
      payload.location_label = updates.locationLabel.trim();
    }
    if (updates.isActive !== undefined) {
      payload.is_active = updates.isActive;
    }
    const { error } = await sb()
      .from("building_amenity_resources")
      .update(payload)
      .eq("id", id)
      .eq("building_id", buildingId);
    mapDbError(error);
    return this.getBuildingAmenityResources();
  },

  async deactivateBuildingAmenityResource(id: string) {
    return this.updateBuildingAmenityResource(id, { isActive: false });
  },

  async getBuildingReminders() {
    const buildingId = await bid();
    const { data, error } = await sb()
      .from("building_reminders")
      .select("*")
      .eq("building_id", buildingId)
      .order("reminder_date", { ascending: true });
    mapDbError(error);
    return (data ?? []).map((r) => mapBuildingReminder(r as Record<string, unknown>));
  },

  async createBuildingReminder(input: Omit<BuildingReminder, "id">) {
    const buildingId = await bid();
    const { data, error } = await sb()
      .from("building_reminders")
      .insert({
        building_id: buildingId,
        title: input.title,
        notes: input.body,
        reminder_date: input.schedule || todayIsoDate(),
      })
      .select("*")
      .single();
    mapDbError(error);
    return mapBuildingReminder(data as Record<string, unknown>);
  },

  async getBuildingExternalData(explicitBuildingId?: string): Promise<BuildingExternalData> {
    const buildingId = await resolveBuildingId(explicitBuildingId);
    const { data, error } = await sb()
      .from("building_external_integrations")
      .select("*")
      .eq("building_id", buildingId)
      .maybeSingle();
    mapDbError(error);

    const { data: hasConnection, error: connectionError } = await sb().rpc("building_has_qbo_connection", {
      p_building_id: buildingId,
    });
    mapDbError(connectionError);

    const { count: customerCount, error: countError } = await sb()
      .from("quickbooks_customers")
      .select("id", { count: "exact", head: true })
      .eq("building_id", buildingId);
    mapDbError(countError);

    const { data: latestCustomer, error: latestError } = await sb()
      .from("quickbooks_customers")
      .select("synced_at")
      .eq("building_id", buildingId)
      .order("synced_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    mapDbError(latestError);

    const flagConnected = (data?.qbo_connected as boolean) ?? false;
    const tokenConnected = hasConnection === true;

    return {
      stripe: {
        connected: (data?.stripe_connected as boolean) ?? false,
        country: (data?.stripe_country as string) ?? "",
        accountNumber: (data?.stripe_account_ref as string) ?? "",
        routingNumber: "",
        currency: (data?.stripe_currency as string) ?? "",
      },
      quickbooks: {
        qboConnected: flagConnected || tokenConnected,
        companyId: (data?.qbo_company_id as string | undefined) ?? undefined,
        syncedCustomerCount: customerCount ?? 0,
        lastSyncedAt: latestCustomer?.synced_at ? String(latestCustomer.synced_at) : undefined,
      },
    };
  },

  async createStripeAccount(input: CreateStripeAccountInput) {
    const buildingId = await bid();
    await sb().from("building_external_integrations").upsert({
      building_id: buildingId,
      stripe_connected: true,
      stripe_country: input.country,
      stripe_currency: input.currency,
      stripe_account_ref: input.accountNumber,
      updated_at: nowIso(),
    });
    return this.getBuildingExternalData();
  },

  async disconnectQuickBooksOnline(explicitBuildingId?: string) {
    const buildingId = await resolveBuildingId(explicitBuildingId);
    const { data, error } = await requireSupabase().functions.invoke("qbo-disconnect", {
      body: { buildingId },
    });
    const body = data as { error?: string } | null;
    await assertEdgeFunctionOk(body, error, "QuickBooks disconnect failed.");
    return this.getBuildingExternalData(buildingId);
  },

  async importQuickBooksUsers(explicitBuildingId?: string) {
    const buildingId = await resolveBuildingId(explicitBuildingId);
    const { data, error } = await requireSupabase().functions.invoke("qbo-sync", {
      body: { buildingId },
    });
    const body = data as {
      error?: string;
      customers?: number;
      invoices?: number;
      occupantsImported?: number;
      occupantsUpdated?: number;
    } | null;
    await assertEdgeFunctionOk(body, error, "QuickBooks sync failed.");
    return {
      imported: body?.customers ?? 0,
      skipped: 0,
      invoices: body?.invoices ?? 0,
      occupantsImported: body?.occupantsImported ?? 0,
      occupantsUpdated: body?.occupantsUpdated ?? 0,
    };
  },

  async getQuickBooksOAuthUrl(explicitBuildingId?: string) {
    const buildingId = await resolveBuildingId(explicitBuildingId);
    const { data: sessionData } = await requireSupabase().auth.getSession();
    if (!sessionData.session) {
      throw new Error("Your session has expired. Sign out and sign in again, then retry.");
    }
    const { data, error } = await requireSupabase().functions.invoke("qbo-oauth-start", {
      body: {
        buildingId,
        returnUrl: typeof window !== "undefined" ? `${window.location.origin}/qbo-connected` : undefined,
      },
    });
    const body = data as { error?: string; url?: string } | null;
    if (body?.error || error) {
      throw new Error(await parseEdgeFunctionError(body, error, "QuickBooks connect failed."));
    }
    if (!body?.url) throw new Error("Invalid response from QuickBooks connect.");
    return body.url;
  },
};
