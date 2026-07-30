import type { Config } from "tailwindcss";
import containerQueries from "@tailwindcss/container-queries";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",

  ],
  
  theme: {
    extend: {
      colors: {
        festival: {
          orange: "#F59E62",
          coral: "#F06472",
          purple: "#7C3AED",
          indigo: "#312E81",
          night: "#090A1A",
        },
        ink: {
          DEFAULT: "#111111",
          secondary: "#505050",
          tertiary: "#767676",
          muted: "#999999",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          subtle: "#FAFAFA",
          muted: "#F5F5F5",
          strong: "#E5E5E5",
          dark: "#090A1A",
        },
        line: {
          DEFAULT: "#E5E5E5",
          subtle: "#F0F0F0",
          strong: "#D4D4D4",
        },
      },
    },
  },
  
  plugins: [containerQueries],
};

export default config;
