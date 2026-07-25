import type { ThemeDocument } from "./registry";

export type ThemePreset = {
  id: string;
  name: string;
  description: string;
  theme: ThemeDocument;
};

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "campus-teal",
    name: "Campus Teal",
    description: "Default KAMPYN teal palette",
    theme: {
      version: 1,
      tokens: {
        color: {
          primary: "#01796f",
          secondary: "#4ea199",
          accent: "#01796f",
          background: "#D6E6F3",
          surface: "#ffffff",
          text: "#0f172a",
          textMuted: "#64748b",
        },
        typography: { fontFamily: "Poppins" },
      },
    },
  },
  {
    id: "minimal-light",
    name: "Minimal Light",
    description: "Clean charcoal accents on soft gray",
    theme: {
      version: 1,
      tokens: {
        color: {
          primary: "#1e293b",
          secondary: "#475569",
          accent: "#0f172a",
          background: "#f8fafc",
          surface: "#ffffff",
          border: "#e2e8f0",
          text: "#0f172a",
          textMuted: "#64748b",
        },
        typography: { fontFamily: "Inter" },
        shape: { radiusMd: "0.375rem" },
      },
    },
  },
  {
    id: "sunset-campus",
    name: "Sunset Campus",
    description: "Warm terracotta for evening dining vibes",
    theme: {
      version: 1,
      tokens: {
        color: {
          primary: "#c2410c",
          secondary: "#ea580c",
          accent: "#9a3412",
          background: "#fff7ed",
          surface: "#ffffff",
          text: "#1c1917",
          textMuted: "#78716c",
          success: "#15803d",
        },
        typography: { fontFamily: "Outfit" },
      },
    },
  },
];
