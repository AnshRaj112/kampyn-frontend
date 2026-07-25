import {
  DEFAULT_TOKENS,
  THEME_SCHEMA_VERSION,
  getDefaultTheme,
  tokenCssVar,
  pageCssVar,
  componentCssVar,
  type ThemeDocument,
} from "./registry";

type Branding = {
  logo?: string;
  favicon?: string;
  primaryColor?: string;
  secondaryColor?: string;
  font?: string;
  backgroundColor?: string;
};

function deepMerge<T extends Record<string, unknown>>(base: T, overlay?: Record<string, unknown> | null): T {
  if (!overlay) return base;
  const out: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(overlay)) {
    const baseVal = base[k as keyof T];
    if (
      v &&
      typeof v === "object" &&
      !Array.isArray(v) &&
      baseVal &&
      typeof baseVal === "object" &&
      !Array.isArray(baseVal)
    ) {
      out[k] = deepMerge(baseVal as Record<string, unknown>, v as Record<string, unknown>);
    } else if (v !== undefined) {
      out[k] = v;
    }
  }
  return out as T;
}

export function brandingToThemeTokens(branding?: Branding | null): ThemeDocument | null {
  if (!branding) return null;
  const safe = branding;
  const tokens: ThemeDocument["tokens"] = { color: {}, typography: {}, assets: {} };
  if (safe.primaryColor) tokens.color!.primary = safe.primaryColor;
  if (safe.secondaryColor) tokens.color!.secondary = safe.secondaryColor;
  if (safe.backgroundColor) tokens.color!.background = safe.backgroundColor;
  if (safe.font) tokens.typography!.fontFamily = safe.font;
  if (safe.logo !== undefined) tokens.assets!.logo = safe.logo;
  if (safe.favicon !== undefined) tokens.assets!.favicon = safe.favicon;

  if (!Object.keys(tokens.color || {}).length) delete tokens.color;
  if (!Object.keys(tokens.typography || {}).length) delete tokens.typography;
  if (!Object.keys(tokens.assets || {}).length) delete tokens.assets;
  if (!Object.keys(tokens).length) return null;

  return { version: THEME_SCHEMA_VERSION, tokens };
}

export function resolveTheme(sparseTheme?: ThemeDocument | null, branding?: Branding | null): ThemeDocument {
  const defaults = getDefaultTheme();
  let sparse = sparseTheme && typeof sparseTheme === "object" ? { ...sparseTheme } : null;

  if (!sparse || (!sparse.tokens && !sparse.pages && !sparse.components)) {
    sparse = brandingToThemeTokens(branding) || { version: THEME_SCHEMA_VERSION };
  } else if (branding) {
    const fromBranding = brandingToThemeTokens(branding);
    if (fromBranding?.tokens) {
      sparse = {
        ...sparse,
        tokens: deepMerge(fromBranding.tokens as Record<string, unknown>, (sparse.tokens || {}) as Record<string, unknown>) as ThemeDocument["tokens"],
      };
    }
  }

  return {
    version: THEME_SCHEMA_VERSION,
    tokens: deepMerge(
      defaults.tokens as Record<string, unknown>,
      (sparse.tokens || {}) as Record<string, unknown>
    ) as ThemeDocument["tokens"],
    pages: sparse.pages || {},
    components: sparse.components || {},
  };
}

export function flattenToCssVars(resolved: ThemeDocument, sparse?: ThemeDocument | null): Record<string, string> {
  const vars: Record<string, string> = {};
  const tokens = resolved.tokens || DEFAULT_TOKENS;

  for (const [group, values] of Object.entries(tokens)) {
    for (const [key, value] of Object.entries(values as Record<string, string>)) {
      if (value === undefined || value === null || value === "") continue;
      vars[tokenCssVar(group, key)] = String(value);
    }
  }

  const pages = sparse?.pages || resolved.pages || {};
  for (const [pageId, overrides] of Object.entries(pages)) {
    for (const [prop, value] of Object.entries(overrides || {})) {
      if (value == null || value === "") continue;
      vars[pageCssVar(pageId, prop)] = String(value);
    }
  }

  const components = sparse?.components || resolved.components || {};
  for (const [category, ids] of Object.entries(components)) {
    for (const [id, props] of Object.entries((ids || {}) as Record<string, Record<string, string>>)) {
      for (const [prop, value] of Object.entries(props || {})) {
        if (value == null || value === "") continue;
        vars[componentCssVar(category, id, prop)] = String(value);
      }
    }
  }

  const color = tokens.color as Record<string, string> | undefined;
  const typography = tokens.typography as Record<string, string> | undefined;
  if (color?.primary) vars["--primary-color"] = color.primary;
  if (color?.secondary) vars["--secondary-color"] = color.secondary;
  if (color?.background) vars["--background-color"] = color.background;
  if (typography?.fontFamily) vars["--font-family"] = typography.fontFamily;

  return vars;
}

export function hexToRgb(hex: string): string {
  let cleanHex = hex.replace("#", "");
  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const num = parseInt(cleanHex, 16);
  if (Number.isNaN(num)) return "1, 121, 111";
  return `${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}`;
}

/** Convert #RRGGBB to space-separated HSL channels for shadcn CSS vars (without hsl()). */
export function hexToHslChannels(hex: string): string {
  let clean = hex.replace("#", "");
  if (clean.length === 3) {
    clean = clean
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const num = parseInt(clean, 16);
  if (Number.isNaN(num)) return "175 35% 48%";

  const r = ((num >> 16) & 255) / 255;
  const g = ((num >> 8) & 255) / 255;
  const b = (num & 255) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      default:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

const APPLIED_VAR_KEYS = new Set<string>();

export function applyCssVars(vars: Record<string, string>, root: HTMLElement = document.documentElement) {
  // Clear previously applied kampyn vars that are no longer present
  APPLIED_VAR_KEYS.forEach((key) => {
    if (!(key in vars)) {
      root.style.removeProperty(key);
      APPLIED_VAR_KEYS.delete(key);
    }
  });

  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value);
    APPLIED_VAR_KEYS.add(key);
  }

  // Legacy rgb helpers
  if (vars["--primary-color"]) {
    root.style.setProperty("--primary-color-rgb", hexToRgb(vars["--primary-color"]));
  }
  if (vars["--secondary-color"]) {
    root.style.setProperty("--secondary-color-rgb", hexToRgb(vars["--secondary-color"]));
  }
  if (vars["--background-color"]) {
    root.style.setProperty("--background-color-rgb", hexToRgb(vars["--background-color"]));
  }

  // Bridge into shadcn HSL tokens
  const primary = vars["--kampyn-color-primary"] || vars["--primary-color"];
  const secondary = vars["--kampyn-color-secondary"] || vars["--secondary-color"];
  const background = vars["--kampyn-color-background"] || vars["--background-color"];
  const surface = vars["--kampyn-color-surface"];
  const text = vars["--kampyn-color-text"];
  const border = vars["--kampyn-color-border"];
  const destructive = vars["--kampyn-color-error"];
  const accent = vars["--kampyn-color-accent"] || primary;

  if (primary) root.style.setProperty("--primary", hexToHslChannels(primary));
  if (accent) root.style.setProperty("--accent", hexToHslChannels(accent));
  if (background) root.style.setProperty("--background", hexToHslChannels(background));
  if (surface) root.style.setProperty("--card", hexToHslChannels(surface));
  if (text) root.style.setProperty("--foreground", hexToHslChannels(text));
  if (border) root.style.setProperty("--border", hexToHslChannels(border));
  if (destructive) root.style.setProperty("--destructive", hexToHslChannels(destructive));
  if (secondary) root.style.setProperty("--secondary", hexToHslChannels(secondary));

  const radiusMd = vars["--kampyn-shape-radiusMd"];
  if (radiusMd) root.style.setProperty("--radius", radiusMd);
}

export function clearThemeVars(root: HTMLElement = document.documentElement) {
  APPLIED_VAR_KEYS.forEach((key) => {
    root.style.removeProperty(key);
  });
  APPLIED_VAR_KEYS.clear();

  [
    "--primary-color",
    "--primary-color-rgb",
    "--secondary-color",
    "--secondary-color-rgb",
    "--background-color",
    "--background-color-rgb",
    "--font-family",
    "--primary",
    "--accent",
    "--background",
    "--card",
    "--foreground",
    "--border",
    "--destructive",
    "--secondary",
    "--radius",
  ].forEach((k) => root.style.removeProperty(k));
}

export function applyThemeDocument(
  theme: ThemeDocument | null | undefined,
  branding?: Branding | null,
  options?: { root?: HTMLElement }
) {
  const resolved = resolveTheme(theme, branding);
  const vars = flattenToCssVars(resolved, theme);
  applyCssVars(vars, options?.root || document.documentElement);
  return { resolved, vars };
}

/** Relative luminance for WCAG contrast (hex only). */
export function contrastRatio(hexA: string, hexB: string): number {
  const lum = (hex: string) => {
    let clean = hex.replace("#", "");
    if (clean.length === 3) {
      clean = clean
        .split("")
        .map((c) => c + c)
        .join("");
    }
    const num = parseInt(clean, 16);
    const channel = (c: number) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    const r = channel((num >> 16) & 255);
    const g = channel((num >> 8) & 255);
    const b = channel(num & 255);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const L1 = lum(hexA);
  const L2 = lum(hexB);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}
