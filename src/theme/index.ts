export {
  THEME_SCHEMA_VERSION,
  ALLOWED_FONTS,
  DEFAULT_TOKENS,
  PAGE_IDS,
  PAGE_PROPS,
  COMPONENT_CATALOG,
  getDefaultTheme,
  tokenCssVar,
  pageCssVar,
  componentCssVar,
} from "./registry";

export type { ThemeDocument, ThemeTokens, PageId, ComponentCategory } from "./registry";

export {
  resolveTheme,
  flattenToCssVars,
  applyThemeDocument,
  applyCssVars,
  clearThemeVars,
  brandingToThemeTokens,
  hexToRgb,
  hexToHslChannels,
  contrastRatio,
} from "./resolve";

export { pathnameToPageId } from "./pageMap";

export { THEME_PRESETS } from "./presets";
export type { ThemePreset } from "./presets";

export { buildThemeStyleTag, buildThemeCssText } from "./ssr";
