"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import api from "@/utils/apiUtils";
import {
  ALLOWED_FONTS,
  COMPONENT_CATALOG,
  DEFAULT_TOKENS,
  PAGE_IDS,
  PAGE_PROPS,
  applyThemeDocument,
  contrastRatio,
  type ComponentCategory,
  type ThemeDocument,
} from "@/theme";
import { THEME_PRESETS } from "@/theme/presets";

type ToastFn = (msg: string, type?: "success" | "error" | "info") => void;

type ThemeStudioPanelProps = {
  triggerToast: ToastFn;
  onPublished?: () => Promise<void> | void;
};

type ThemeSection = "tokens" | "components" | "pages" | "importExport";

const COLOR_TOKEN_KEYS = Object.keys(DEFAULT_TOKENS.color) as (keyof typeof DEFAULT_TOKENS.color)[];

function setDeep(
  obj: ThemeDocument,
  path: string[],
  value: string | undefined
): ThemeDocument {
  const next = JSON.parse(JSON.stringify(obj || { version: 1 })) as ThemeDocument;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let cursor: any = next;
  for (let i = 0; i < path.length - 1; i++) {
    if (!cursor[path[i]] || typeof cursor[path[i]] !== "object") {
      cursor[path[i]] = {};
    }
    cursor = cursor[path[i]];
  }
  const last = path[path.length - 1];
  if (value === undefined || value === "") {
    delete cursor[last];
  } else {
    cursor[last] = value;
  }
  return next;
}

function getDeep(obj: ThemeDocument | null | undefined, path: string[]): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let cursor: any = obj;
  for (const part of path) {
    if (!cursor || typeof cursor !== "object") return "";
    cursor = cursor[part];
  }
  return typeof cursor === "string" ? cursor : "";
}

function ColorField({
  label,
  value,
  fallback,
  onChange,
}: {
  label: string;
  value: string;
  fallback?: string;
  onChange: (v: string) => void;
}) {
  const display = value || fallback || "#01796f";
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-zinc-700">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={/^#([A-Fa-f0-9]{6})$/.test(display) ? display : "#01796f"}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 cursor-pointer rounded border border-zinc-200 bg-white p-0.5"
        />
        <input
          type="text"
          value={value}
          placeholder={fallback || ""}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 rounded-md border border-zinc-200 px-3 py-2 font-mono text-xs outline-none focus:border-[var(--kampyn-color-primary,#01796f)]"
        />
        {value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-xs text-zinc-500 hover:text-zinc-800"
          >
            Clear
          </button>
        ) : null}
      </div>
    </label>
  );
}

export default function ThemeStudioPanel({ triggerToast, onPublished }: ThemeStudioPanelProps) {
  const [section, setSection] = useState<ThemeSection>("tokens");
  const [theme, setTheme] = useState<ThemeDocument>({ version: 1 });
  const [published, setPublished] = useState<ThemeDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [componentCategory, setComponentCategory] = useState<ComponentCategory>("button");
  const [componentId, setComponentId] = useState<string>("primary");
  const [pageId, setPageId] = useState<(typeof PAGE_IDS)[number]>("home");
  const [importText, setImportText] = useState("");
  const previewRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadDraft = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/tenant/theme/draft");
      if (res.data?.success) {
        setTheme(res.data.data.theme || { version: 1 });
        setPublished(res.data.data.published || null);
      } else {
        triggerToast(res.data?.message || "Failed to load theme draft", "error");
      }
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      triggerToast(error.response?.data?.message || "Failed to load theme draft", "error");
    } finally {
      setLoading(false);
    }
  }, [triggerToast]);

  useEffect(() => {
    void loadDraft();
    // Load once on mount — avoid re-fetch clobbering in-progress edits
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live preview injection into preview pane only
  useEffect(() => {
    if (!previewRef.current) return;
    applyThemeDocument(theme, null, { root: previewRef.current });
  }, [theme]);

  useEffect(() => {
    const ids = COMPONENT_CATALOG[componentCategory].ids as readonly string[];
    if (!ids.includes(componentId)) {
      setComponentId(ids[0]);
    }
  }, [componentCategory, componentId]);

  const primary = theme.tokens?.color?.primary || DEFAULT_TOKENS.color.primary;
  const background = theme.tokens?.color?.background || DEFAULT_TOKENS.color.background;
  const text = theme.tokens?.color?.text || DEFAULT_TOKENS.color.text;
  const ratio = useMemo(() => {
    try {
      return contrastRatio(text, background);
    } catch {
      return 0;
    }
  }, [text, background]);

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const res = await api.put("/api/tenant/theme/draft", { theme });
      if (res.data?.success) {
        setTheme(res.data.data.theme);
        triggerToast("Theme draft saved", "success");
      } else {
        triggerToast(res.data?.message || "Save failed", "error");
      }
    } catch (err) {
      const error = err as { response?: { data?: { message?: string; errors?: string[] } } };
      const detail = error.response?.data?.errors?.join("; ");
      triggerToast(detail || error.response?.data?.message || "Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      // Persist draft first so publish uses latest editor state
      await api.put("/api/tenant/theme/draft", { theme });
      const res = await api.post("/api/tenant/theme/publish");
      if (res.data?.success) {
        setPublished(res.data.data.theme);
        triggerToast(`Theme published (v${res.data.data.themeVersion})`, "success");
        await onPublished?.();
      } else {
        triggerToast(res.data?.message || "Publish failed", "error");
      }
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      triggerToast(error.response?.data?.message || "Publish failed", "error");
    } finally {
      setPublishing(false);
    }
  };

  const handleReset = async (scope: string) => {
    try {
      const res = await api.post("/api/tenant/theme/reset", { scope });
      if (res.data?.success) {
        setTheme(res.data.data.theme || { version: 1 });
        triggerToast(`Reset: ${scope}`, "success");
      } else {
        triggerToast(res.data?.message || "Reset failed", "error");
      }
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      triggerToast(error.response?.data?.message || "Reset failed", "error");
    }
  };

  const handleDuplicate = () => {
    const copy = JSON.parse(JSON.stringify(theme)) as ThemeDocument;
    setTheme(copy);
    triggerToast("Theme duplicated in editor (save draft to persist)", "info");
  };

  const handleExport = async () => {
    try {
      const res = await api.get("/api/tenant/theme/export");
      if (!res.data?.success) {
        triggerToast("Export failed", "error");
        return;
      }
      const blob = new Blob([JSON.stringify(res.data.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kampyn-theme-${res.data.data.tenantSlug || "export"}.json`;
      a.click();
      URL.revokeObjectURL(url);
      triggerToast("Theme exported", "success");
    } catch {
      triggerToast("Export failed", "error");
    }
  };

  const handleImport = async (payload: unknown) => {
    try {
      const body = typeof payload === "object" && payload && "theme" in (payload as object)
        ? payload
        : { theme: payload };
      const res = await api.post("/api/tenant/theme/import", body);
      if (res.data?.success) {
        setTheme(res.data.data.theme);
        triggerToast("Theme imported into draft", "success");
      } else {
        triggerToast(res.data?.message || "Import failed", "error");
      }
    } catch (err) {
      const error = err as { response?: { data?: { message?: string; errors?: string[] } } };
      triggerToast(
        error.response?.data?.errors?.join("; ") ||
          error.response?.data?.message ||
          "Import failed",
        "error"
      );
    }
  };

  const sections: { id: ThemeSection; label: string }[] = [
    { id: "tokens", label: "Global tokens" },
    { id: "components", label: "Components" },
    { id: "pages", label: "Pages" },
    { id: "importExport", label: "Import / Export" },
  ];

  const applyPreset = (presetId: string) => {
    const preset = THEME_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setTheme(JSON.parse(JSON.stringify(preset.theme)));
    triggerToast(`Applied preset: ${preset.name} (save draft to persist)`, "info");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-zinc-500">
        Loading theme editor…
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          {sections.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSection(s.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                section === s.id
                  ? "bg-[var(--kampyn-color-primary,#01796f)] text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {section === "tokens" && (
          <div className="space-y-6 rounded-xl border border-zinc-200 bg-white p-5">
            <div>
              <h3 className="text-base font-semibold text-zinc-900">Presets</h3>
              <p className="mt-1 text-sm text-zinc-500">Start from a curated palette, then refine.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {THEME_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyPreset(preset.id)}
                    className="rounded-lg border border-zinc-200 px-3 py-2 text-left text-xs hover:border-[var(--kampyn-color-primary,#01796f)]"
                    title={preset.description}
                  >
                    <span className="block font-semibold text-zinc-800">{preset.name}</span>
                    <span className="text-zinc-500">{preset.description}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-900">Colors</h3>
              <p className="mt-1 text-sm text-zinc-500">
                Global tokens cascade to components unless overridden.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {COLOR_TOKEN_KEYS.map((key) => (
                <ColorField
                  key={key}
                  label={key}
                  value={getDeep(theme, ["tokens", "color", key])}
                  fallback={DEFAULT_TOKENS.color[key]}
                  onChange={(v) => setTheme((t) => setDeep(t, ["tokens", "color", key], v))}
                />
              ))}
            </div>

            <div className="border-t border-zinc-100 pt-5">
              <h3 className="text-base font-semibold text-zinc-900">Typography</h3>
              <label className="mt-3 flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-zinc-700">Font family</span>
                <select
                  value={theme.tokens?.typography?.fontFamily || DEFAULT_TOKENS.typography.fontFamily}
                  onChange={(e) =>
                    setTheme((t) => setDeep(t, ["tokens", "typography", "fontFamily"], e.target.value))
                  }
                  className="rounded-md border border-zinc-200 px-3 py-2 outline-none focus:border-[var(--kampyn-color-primary,#01796f)]"
                >
                  {ALLOWED_FONTS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="border-t border-zinc-100 pt-5">
              <h3 className="text-base font-semibold text-zinc-900">Shape & elevation</h3>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                {(Object.keys(DEFAULT_TOKENS.shape) as (keyof typeof DEFAULT_TOKENS.shape)[]).map(
                  (key) => (
                    <label key={key} className="flex flex-col gap-1.5 text-sm">
                      <span className="font-medium text-zinc-700">{key}</span>
                      <input
                        type="text"
                        value={getDeep(theme, ["tokens", "shape", key])}
                        placeholder={DEFAULT_TOKENS.shape[key]}
                        onChange={(e) =>
                          setTheme((t) => setDeep(t, ["tokens", "shape", key], e.target.value))
                        }
                        className="rounded-md border border-zinc-200 px-3 py-2 font-mono text-xs"
                      />
                    </label>
                  )
                )}
              </div>
            </div>

            <div className="rounded-lg border border-zinc-100 bg-zinc-50 px-4 py-3 text-sm">
              <span className="font-medium text-zinc-700">Contrast (text / background): </span>
              <span className={ratio >= 4.5 ? "text-emerald-700" : "text-amber-700"}>
                {ratio.toFixed(2)}:1 {ratio >= 4.5 ? "(AA pass)" : "(below AA)"}
              </span>
            </div>
          </div>
        )}

        {section === "components" && (
          <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5">
            <div className="flex flex-wrap gap-3">
              <label className="text-sm">
                <span className="mb-1 block font-medium text-zinc-700">Category</span>
                <select
                  value={componentCategory}
                  onChange={(e) => setComponentCategory(e.target.value as ComponentCategory)}
                  className="rounded-md border border-zinc-200 px-3 py-2"
                >
                  {(Object.keys(COMPONENT_CATALOG) as ComponentCategory[]).map((cat) => (
                    <option key={cat} value={cat}>
                      {COMPONENT_CATALOG[cat].label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium text-zinc-700">Component</span>
                <select
                  value={componentId}
                  onChange={(e) => setComponentId(e.target.value)}
                  className="rounded-md border border-zinc-200 px-3 py-2"
                >
                  {(COMPONENT_CATALOG[componentCategory].ids as readonly string[]).map((id) => (
                    <option key={id} value={id}>
                      {id}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={() => handleReset(`components.${componentCategory}.${componentId}`)}
                className="mt-6 text-xs font-medium text-zinc-500 hover:text-zinc-800"
              >
                Reset this component
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {(COMPONENT_CATALOG[componentCategory].props as readonly string[]).map((prop) => {
                const isRadius = prop === "radius";
                const isShadow = prop === "shadow" || prop === "hoverShadow";
                const path = ["components", componentCategory, componentId, prop];
                if (isRadius || isShadow) {
                  return (
                    <label key={prop} className="flex flex-col gap-1.5 text-sm">
                      <span className="font-medium text-zinc-700">{prop}</span>
                      <input
                        type="text"
                        value={getDeep(theme, path)}
                        onChange={(e) => setTheme((t) => setDeep(t, path, e.target.value))}
                        placeholder={isShadow ? "0 4px 12px rgba(0,0,0,.08)" : "0.5rem"}
                        className="rounded-md border border-zinc-200 px-3 py-2 font-mono text-xs"
                      />
                    </label>
                  );
                }
                return (
                  <ColorField
                    key={prop}
                    label={prop}
                    value={getDeep(theme, path)}
                    onChange={(v) => setTheme((t) => setDeep(t, path, v))}
                  />
                );
              })}
            </div>
          </div>
        )}

        {section === "pages" && (
          <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5">
            <label className="text-sm">
              <span className="mb-1 block font-medium text-zinc-700">Page</span>
              <select
                value={pageId}
                onChange={(e) => setPageId(e.target.value as (typeof PAGE_IDS)[number])}
                className="rounded-md border border-zinc-200 px-3 py-2"
              >
                {PAGE_IDS.map((id) => (
                  <option key={id} value={id}>
                    {id}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              {PAGE_PROPS.map((prop) => (
                <ColorField
                  key={prop}
                  label={prop}
                  value={getDeep(theme, ["pages", pageId, prop])}
                  onChange={(v) => setTheme((t) => setDeep(t, ["pages", pageId, prop], v))}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => handleReset(`pages.${pageId}`)}
              className="text-xs font-medium text-zinc-500 hover:text-zinc-800"
            >
              Reset this page
            </button>
          </div>
        )}

        {section === "importExport" && (
          <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleExport}
                className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
              >
                Export JSON
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800"
              >
                Import file
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const text = await file.text();
                    await handleImport(JSON.parse(text));
                  } catch {
                    triggerToast("Invalid JSON file", "error");
                  }
                  e.target.value = "";
                }}
              />
            </div>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder='Paste theme JSON here, then click "Import pasted JSON"'
              className="min-h-[180px] w-full rounded-md border border-zinc-200 p-3 font-mono text-xs"
            />
            <button
              type="button"
              onClick={async () => {
                try {
                  await handleImport(JSON.parse(importText));
                } catch {
                  triggerToast("Invalid JSON", "error");
                }
              }}
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium"
            >
              Import pasted JSON
            </button>
          </div>
        )}

        <div className="flex flex-wrap gap-2 border-t border-zinc-100 pt-4">
          <button
            type="button"
            disabled={saving}
            onClick={handleSaveDraft}
            className="rounded-md bg-[var(--kampyn-color-primary,#01796f)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save draft"}
          </button>
          <button
            type="button"
            disabled={publishing}
            onClick={handlePublish}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {publishing ? "Publishing…" : "Publish"}
          </button>
          <button
            type="button"
            onClick={handleDuplicate}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium"
          >
            Duplicate
          </button>
          <button
            type="button"
            onClick={() => handleReset("all")}
            className="rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-700"
          >
            Reset all
          </button>
        </div>
        {published ? (
          <p className="text-xs text-zinc-500">A published theme is live for this tenant.</p>
        ) : (
          <p className="text-xs text-zinc-500">No published theme yet — defaults / branding apply.</p>
        )}
      </div>

      {/* Preview pane */}
      <div
        ref={previewRef}
        className="sticky top-4 h-fit overflow-hidden rounded-xl border border-zinc-200 shadow-sm"
        style={{
          background: "var(--kampyn-color-background, #D6E6F3)",
          fontFamily: "var(--kampyn-typography-fontFamily, Poppins), sans-serif",
        }}
      >
        <div className="border-b border-zinc-200/80 bg-white/80 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Live preview
        </div>
        <div className="space-y-4 p-4">
          <div
            className="rounded-lg px-4 py-3 text-sm font-semibold text-white"
            style={{ background: "var(--kampyn-color-primary, #01796f)" }}
          >
            Navbar · {primary}
          </div>
          <div
            className="rounded-lg border p-4 shadow-sm"
            style={{
              background: "var(--kampyn-color-surface, #fff)",
              borderColor: "var(--kampyn-color-border, #e2e8f0)",
              borderRadius: "var(--kampyn-shape-radiusMd, 0.5rem)",
            }}
            data-theme-component="card.dish"
          >
            <p
              className="font-semibold"
              style={{ color: "var(--kampyn-color-text, #0f172a)" }}
            >
              Dish card
            </p>
            <p className="mt-1 text-sm" style={{ color: "var(--kampyn-color-textMuted, #64748b)" }}>
              Description preview
            </p>
            <p
              className="mt-2 text-sm font-bold"
              style={{ color: "var(--kampyn-color-primary, #01796f)" }}
            >
              ₹120
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-md px-3 py-2 text-sm font-semibold text-white"
              style={{
                background:
                  "var(--kampyn-component-button-addToCart-background, var(--kampyn-color-primary, #01796f))",
              }}
              data-theme-component="button.addToCart"
            >
              Add to Cart
            </button>
            <button
              type="button"
              className="rounded-md border px-3 py-2 text-sm font-semibold"
              style={{
                background:
                  "var(--kampyn-component-button-checkout-background, var(--kampyn-color-secondary, #4ea199))",
                color: "var(--kampyn-color-textInverse, #fff)",
                borderColor: "transparent",
              }}
              data-theme-component="button.checkout"
            >
              Checkout
            </button>
          </div>
          <div
            className="rounded-md px-3 py-2 text-xs"
            style={{
              background: "var(--kampyn-color-success, #16a34a)",
              color: "#fff",
            }}
          >
            Success alert sample
          </div>
        </div>
      </div>
    </div>
  );
}
