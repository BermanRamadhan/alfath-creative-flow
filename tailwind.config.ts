import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: "#16201b",
        paper: "#f6f5f0",
        moss: "#0f5138",
        fern: "#18794e",
        limewash: "#e9f4da",
        amberline: "#c8842d"
      },
      boxShadow: {
        line: "0 0 0 1px rgba(22,32,27,0.08)"
      }
    }
  },
  plugins: []
};

export default config;
