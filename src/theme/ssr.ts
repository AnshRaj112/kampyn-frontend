import { flattenToCssVars, resolveTheme } from "./resolve";
import type { ThemeDocument } from "./registry";

type Branding = {
  logo?: string;
  favicon?: string;
  primaryColor?: string;
  secondaryColor?: string;
  font?: string;
  backgroundColor?: string;
};

/**
 * Build an inline <style> block for SSR / edge injection to reduce FOUC.
 */
export function buildThemeStyleTag(
  theme: ThemeDocument | null | undefined,
  branding?: Branding | null
): string {
  const resolved = resolveTheme(theme, branding);
  const vars = flattenToCssVars(resolved, theme);
  const decls = Object.entries(vars)
    .map(([k, v]) => `${k}:${v}`)
    .join(";");
  if (!decls) return "";
  return `<style id="kampyn-theme">${`:root{${decls}}`}</style>`;
}

/**
 * React-friendly CSS text for use in a <style> element from a Server Component.
 */
export function buildThemeCssText(
  theme: ThemeDocument | null | undefined,
  branding?: Branding | null
): string {
  const resolved = resolveTheme(theme, branding);
  const vars = flattenToCssVars(resolved, theme);
  const decls = Object.entries(vars)
    .map(([k, v]) => `${k}: ${v};`)
    .join("\n  ");
  return decls ? `:root {\n  ${decls}\n}` : "";
}
