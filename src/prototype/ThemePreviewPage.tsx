import { useMemo, useState, type CSSProperties } from "react";
import { DataTable, type Column } from "../shared/DataTable";
import { defaultDirectionId, themeDirections, type ThemeDirection } from "./themeDirections";
import { previewMetrics, previewRows, sharedTableRows } from "./previewData";

type ThemePreviewPageProps = {
  onBack: () => void;
};

type SharedRow = (typeof sharedTableRows)[number];

export function ThemePreviewPage({ onBack }: ThemePreviewPageProps) {
  const [activeThemeId, setActiveThemeId] = useState<ThemeDirection["id"]>(defaultDirectionId);
  const activeTheme = themeDirections.find((direction) => direction.id === activeThemeId) ?? themeDirections[0];

  const sharedColumns = useMemo<Column<SharedRow>[]>(
    () => [
      { key: "module", header: "Module", render: (row) => row.module },
      { key: "owner", header: "Owner", render: (row) => row.owner },
      { key: "records", header: "Records", render: (row) => row.records },
      { key: "status", header: "Status", render: (row) => row.status },
    ],
    []
  );

  const themeStyles = getThemeStyles(activeTheme);

  return (
    <div className="min-h-screen p-6 md:p-8" style={{ backgroundColor: activeTheme.colors.pageBg, color: activeTheme.colors.text }}>
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-6">
        <header className="rounded-xl border p-5 shadow-sm" style={themeStyles.surfaceCard}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: activeTheme.colors.mutedText }}>
                UI redesign prototype
              </p>
              <h1 className="mt-1 text-2xl font-semibold" style={{ fontFamily: activeTheme.typography.heading }}>
                Theme Direction Comparison
              </h1>
              <p className="mt-2 text-sm" style={{ color: activeTheme.colors.mutedText }}>
                Preview-only workspace. Existing app screens are unchanged.
              </p>
            </div>
            <button
              type="button"
              onClick={onBack}
              className="rounded-md px-4 py-2 text-sm font-medium transition"
              style={themeStyles.secondaryButton}
            >
              Back to app
            </button>
          </div>
        </header>

        <section className="grid gap-3 lg:grid-cols-3">
          {themeDirections.map((direction) => {
            const selected = direction.id === activeThemeId;
            return (
              <button
                key={direction.id}
                type="button"
                onClick={() => setActiveThemeId(direction.id)}
                className="rounded-xl border p-4 text-left transition"
                style={{
                  backgroundColor: selected ? direction.colors.surfaceAlt : direction.colors.surface,
                  borderColor: selected ? direction.colors.primary : direction.colors.border,
                  boxShadow: selected ? `0 0 0 2px ${direction.colors.primary}22` : undefined,
                  color: direction.colors.text,
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-base font-semibold" style={{ fontFamily: direction.typography.heading }}>
                    {direction.name}
                  </h2>
                  <span
                    className="inline-flex h-5 w-5 rounded-full border"
                    style={{ backgroundColor: direction.colors.primary, borderColor: direction.colors.border }}
                    aria-hidden
                  />
                </div>
                <p className="mt-2 text-xs" style={{ color: direction.colors.mutedText }}>
                  {direction.vibe}
                </p>
              </button>
            );
          })}
        </section>

        <section className="rounded-xl border p-5 shadow-sm" style={themeStyles.surfaceCard}>
          <h3 className="text-lg font-semibold" style={{ fontFamily: activeTheme.typography.heading }}>
            {activeTheme.name}
          </h3>
          <p className="mt-2 text-sm" style={{ color: activeTheme.colors.mutedText }}>
            Best use case: {activeTheme.bestUseCase}
          </p>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div>
              <p className="text-sm font-semibold">Pros</p>
              <ul className="mt-2 space-y-1 text-sm" style={{ color: activeTheme.colors.mutedText }}>
                {activeTheme.pros.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold">Cons</p>
              <ul className="mt-2 space-y-1 text-sm" style={{ color: activeTheme.colors.mutedText }}>
                {activeTheme.cons.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-xl border shadow-sm" style={themeStyles.surfaceCard}>
            <div className="rounded-t-xl border-b px-4 py-3" style={themeStyles.shellTopbar}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">Sidebar/Navbar Preview</p>
                <span className="text-xs" style={{ color: activeTheme.colors.mutedText }}>
                  {activeTheme.components.sidebarNavbar}
                </span>
              </div>
            </div>
            <div className="grid min-h-[280px] grid-cols-[220px_1fr]">
              <aside className="border-r p-3" style={themeStyles.sidebar}>
                {["Dashboard", "Requests", "Messages", "Approvals", "Settings"].map((item, index) => (
                  <div
                    key={item}
                    className="mb-2 rounded-md px-3 py-2 text-sm"
                    style={index === 0 ? themeStyles.sidebarActive : themeStyles.sidebarItem}
                  >
                    {item}
                  </div>
                ))}
              </aside>
              <div className="p-4" style={{ backgroundColor: activeTheme.colors.surface }}>
                <p className="text-sm font-semibold">Dashboard Preview</p>
                <p className="mt-1 text-xs" style={{ color: activeTheme.colors.mutedText }}>
                  {activeTheme.components.dashboard}
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {previewMetrics.map((metric) => (
                    <article key={metric.id} className="rounded-lg border p-3" style={themeStyles.metricCard}>
                      <p className="text-xs" style={{ color: activeTheme.colors.mutedText }}>
                        {metric.label}
                      </p>
                      <p className="mt-1 text-2xl font-semibold" style={{ fontFamily: activeTheme.typography.heading }}>
                        {metric.value}
                      </p>
                      <p className="mt-1 text-xs" style={{ color: activeTheme.colors.secondary }}>
                        {metric.delta}
                      </p>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-xl border p-4 shadow-sm" style={themeStyles.surfaceCard}>
            <p className="text-sm font-semibold">Login/Form Preview</p>
            <p className="mt-1 text-xs" style={{ color: activeTheme.colors.mutedText }}>
              {activeTheme.components.forms}
            </p>
            <div className="mt-4 rounded-lg border p-4" style={themeStyles.formCard}>
              <label className="block text-xs font-medium">Username / Email</label>
              <input
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none"
                style={themeStyles.input}
                value="resident@demo.com"
                readOnly
              />
              <label className="mt-3 block text-xs font-medium">Password</label>
              <input
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none"
                style={themeStyles.input}
                value="********"
                readOnly
              />
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" className="rounded-md px-3 py-2 text-sm font-medium" style={themeStyles.primaryButton}>
                  Sign in
                </button>
                <button type="button" className="rounded-md px-3 py-2 text-sm font-medium" style={themeStyles.secondaryButton}>
                  Forgot password
                </button>
              </div>
            </div>
          </section>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-xl border p-4 shadow-sm" style={themeStyles.surfaceCard}>
            <p className="text-sm font-semibold">Button/Card Preview</p>
            <p className="mt-1 text-xs" style={{ color: activeTheme.colors.mutedText }}>
              {activeTheme.components.buttons} {activeTheme.components.cards}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" className="rounded-md px-3 py-2 text-sm font-medium" style={themeStyles.primaryButton}>
                Primary
              </button>
              <button type="button" className="rounded-md px-3 py-2 text-sm font-medium" style={themeStyles.secondaryButton}>
                Secondary
              </button>
              <button type="button" className="rounded-md border px-3 py-2 text-sm font-medium" style={themeStyles.ghostButton}>
                Ghost
              </button>
            </div>
            <article className="mt-4 rounded-lg border p-4" style={themeStyles.previewCard}>
              <h4 className="text-sm font-semibold">Community Update</h4>
              <p className="mt-2 text-sm" style={{ color: activeTheme.colors.mutedText }}>
                Elevator maintenance is scheduled for Thursday 10:00 AM - 2:00 PM.
              </p>
            </article>
          </section>

          <section className="rounded-xl border p-4 shadow-sm" style={themeStyles.surfaceCard}>
            <p className="text-sm font-semibold">Table Preview</p>
            <p className="mt-1 text-xs" style={{ color: activeTheme.colors.mutedText }}>
              {activeTheme.components.tables}
            </p>
            <div className="mt-4 overflow-hidden rounded-lg border" style={{ borderColor: activeTheme.colors.border }}>
              <table className="w-full text-left text-sm">
                <thead style={{ backgroundColor: activeTheme.colors.surfaceAlt }}>
                  <tr>
                    <th className="px-3 py-2">Unit</th>
                    <th className="px-3 py-2">Owner</th>
                    <th className="px-3 py-2">Request</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row) => (
                    <tr key={row.id} style={{ borderTop: `1px solid ${activeTheme.colors.border}` }}>
                      <td className="px-3 py-2">{row.unit}</td>
                      <td className="px-3 py-2">{row.owner}</td>
                      <td className="px-3 py-2">{row.request}</td>
                      <td className="px-3 py-2">
                        <span className="rounded-full px-2 py-0.5 text-xs" style={statusPillStyle(activeTheme, row.status)}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 rounded-lg border p-3" style={{ borderColor: activeTheme.colors.border }}>
              <p className="mb-2 text-xs font-semibold" style={{ color: activeTheme.colors.mutedText }}>
                Existing shared component compatibility (`DataTable`)
              </p>
              <DataTable columns={sharedColumns} data={sharedTableRows} />
            </div>
          </section>
        </div>

        <section className="rounded-xl border p-4 shadow-sm" style={themeStyles.surfaceCard}>
          <h3 className="text-sm font-semibold">Color Palette + Typography</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-4">
            {[
              { label: "Primary", value: activeTheme.colors.primary },
              { label: "Secondary", value: activeTheme.colors.secondary },
              { label: "Surface", value: activeTheme.colors.surface },
              { label: "Border", value: activeTheme.colors.border },
            ].map((color) => (
              <div key={color.label} className="rounded-lg border p-3" style={{ borderColor: activeTheme.colors.border }}>
                <div className="h-10 rounded" style={{ backgroundColor: color.value }} />
                <p className="mt-2 text-xs font-semibold">{color.label}</p>
                <p className="text-xs" style={{ color: activeTheme.colors.mutedText }}>
                  {color.value}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm" style={{ color: activeTheme.colors.mutedText }}>
            Heading: {activeTheme.typography.heading} | Body: {activeTheme.typography.body} | Weights:{" "}
            {activeTheme.typography.headingWeight} / {activeTheme.typography.bodyWeight}
          </p>
        </section>
      </div>
    </div>
  );
}

function getThemeStyles(theme: ThemeDirection) {
  const isAurora = theme.id === "aurora-glass";
  return {
    surfaceCard: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      color: theme.colors.text,
    } satisfies CSSProperties,
    shellTopbar: {
      backgroundColor: theme.colors.surfaceAlt,
      borderColor: theme.colors.border,
    } satisfies CSSProperties,
    sidebar: {
      backgroundColor: theme.colors.shellBg,
      borderColor: theme.colors.border,
    } satisfies CSSProperties,
    sidebarActive: {
      backgroundColor: theme.colors.primary,
      color: "#FFFFFF",
      border: `1px solid ${theme.colors.primary}`,
      fontWeight: 600,
    } satisfies CSSProperties,
    sidebarItem: {
      backgroundColor: theme.colors.surface,
      color: theme.colors.text,
      border: `1px solid ${theme.colors.border}`,
    } satisfies CSSProperties,
    metricCard: {
      backgroundColor: theme.colors.surfaceAlt,
      borderColor: theme.colors.border,
      boxShadow: isAurora ? "0 8px 24px rgba(0,0,0,0.25)" : "0 1px 2px rgba(15, 23, 42, 0.08)",
    } satisfies CSSProperties,
    formCard: {
      backgroundColor: theme.colors.surfaceAlt,
      borderColor: theme.colors.border,
    } satisfies CSSProperties,
    input: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      color: theme.colors.text,
    } satisfies CSSProperties,
    previewCard: {
      backgroundColor: theme.colors.surfaceAlt,
      borderColor: theme.colors.border,
    } satisfies CSSProperties,
    primaryButton: {
      backgroundColor: theme.colors.primary,
      color: "#FFFFFF",
    } satisfies CSSProperties,
    secondaryButton: {
      backgroundColor: theme.colors.surfaceAlt,
      color: theme.colors.text,
      border: `1px solid ${theme.colors.border}`,
    } satisfies CSSProperties,
    ghostButton: {
      backgroundColor: "transparent",
      color: theme.colors.text,
      borderColor: theme.colors.border,
    } satisfies CSSProperties,
  };
}

function statusPillStyle(theme: ThemeDirection, status: "Open" | "In Review" | "Resolved"): CSSProperties {
  if (status === "Resolved") {
    return { backgroundColor: `${theme.colors.success}22`, color: theme.colors.success };
  }
  if (status === "In Review") {
    return { backgroundColor: `${theme.colors.warning}22`, color: theme.colors.warning };
  }
  return { backgroundColor: `${theme.colors.primary}22`, color: theme.colors.primary };
}
