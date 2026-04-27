import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Teal-cyan brand — clean, technical, no pink.
        brand: {
          50:  "#ecfdfa",
          100: "#cefaf2",
          200: "#a0f1e6",
          300: "#65e2d2",
          400: "#2ecbb9",
          500: "#14b3a3",
          600: "#0e9085",
          700: "#0e736b",
          800: "#0f5b56",
          900: "#0e4a47",
          950: "#062a29",
        },
        // Indigo accent for secondary highlights / gradient pair
        accent: {
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
        },
        cyan2: {
          400: "#22d3ee",
          500: "#06b6d4",
          600: "#0891b2",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        arabic: ["Tajawal", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "brand-gradient":   "linear-gradient(135deg, #14b3a3 0%, #4f46e5 100%)",
        "ocean-gradient":   "linear-gradient(135deg, #06b6d4 0%, #4f46e5 100%)",
        "sunset-gradient":  "linear-gradient(135deg, #f59e0b 0%, #f97316 100%)",
        "emerald-gradient": "linear-gradient(135deg, #10b981 0%, #06b6d4 100%)",
        "rose-gradient":    "linear-gradient(135deg, #f43f5e 0%, #f97316 100%)",
        "sidebar-dark":     "linear-gradient(180deg, #0a1322 0%, #0f1c33 100%)",
      },
      boxShadow: {
        glow: "0 8px 24px -8px rgba(20, 179, 163, 0.45)",
        "glow-accent": "0 8px 24px -8px rgba(99, 102, 241, 0.45)",
        soft: "0 1px 2px rgba(15,23,42,0.04), 0 4px 12px rgba(15,23,42,0.06)",
      },
      keyframes: {
        "fade-in":  { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        "slide-up": { "0%": { opacity: "0", transform: "translateY(8px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        "pulse-ring": { "0%": { transform: "scale(0.9)", opacity: "0.6" }, "100%": { transform: "scale(1.4)", opacity: "0" } },
      },
      animation: {
        "fade-in": "fade-in 200ms ease-out",
        "slide-up": "slide-up 220ms ease-out",
        "pulse-ring": "pulse-ring 1.6s ease-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
