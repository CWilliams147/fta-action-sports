import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        fta: {
          black: "#000000",
          paper: "#F4F4F4",
          orange: "#FF5F1F",
        },
      },
fontFamily: {
      sans: ["system-ui", "ui-sans-serif", "sans-serif"],
    },
      borderRadius: {
        none: "0",
      },
    },
  },
  plugins: [],
} satisfies Config;
