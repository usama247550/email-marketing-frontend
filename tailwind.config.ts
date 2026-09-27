import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        sidebar: {
          DEFAULT: "#0B1220",
          hover: "#131d30",
          active: "#1a2640",
          border: "rgba(255,255,255,0.06)",
        },
        accent: {
          DEFAULT: "#2563EB",
          hover: "#1d4ed8",
          light: "#EFF6FF",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
