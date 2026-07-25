import type { Config } from "tailwindcss";
import type { PluginAPI } from "tailwindcss/types/config";
import animate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // KAMPYN brand colors — driven by tenant CSS variables
        bitesbay: {
          background: "var(--kampyn-color-secondary, #54a6a1)",
          text: "var(--kampyn-color-secondary, #4ea199)",
          accent: "var(--kampyn-color-primary, #01796f)",
          light: "var(--kampyn-color-secondary, #a5d6d3)",
          dark: "var(--kampyn-color-primary, #025e57)",
        },
        kampyn: {
          primary: "var(--kampyn-color-primary, #01796f)",
          secondary: "var(--kampyn-color-secondary, #4ea199)",
          accent: "var(--kampyn-color-accent, #01796f)",
          background: "var(--kampyn-color-background, #D6E6F3)",
          surface: "var(--kampyn-color-surface, #ffffff)",
          border: "var(--kampyn-color-border, #e2e8f0)",
          text: "var(--kampyn-color-text, #0f172a)",
          muted: "var(--kampyn-color-textMuted, #64748b)",
          success: "var(--kampyn-color-success, #16a34a)",
          warning: "var(--kampyn-color-warning, #d97706)",
          error: "var(--kampyn-color-error, #dc2626)",
          info: "var(--kampyn-color-info, #0284c7)",
        },
      },
      fontFamily: {
        poppins: ["Poppins", "sans-serif"],
        caveat: ["Caveat", "cursive"],
        staatliches: ["Staatliches", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in-up": {
          "0%": { 
            opacity: "0",
            transform: "translateY(20px)"
          },
          "100%": { 
            opacity: "1",
            transform: "translateY(0)"
          },
        },
        "scroll-x": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-100%)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in-up": "fade-in-up 0.5s ease-out forwards",
        "scroll-x": "scroll-x 30s linear infinite",
      },
    },
  },
  plugins: [animate as unknown as (api: PluginAPI) => void],
} satisfies Config;
