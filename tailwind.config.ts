import type { Config } from "tailwindcss";

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
      },
    },
  },
  
  plugins: [
  require("@tailwindcss/container-queries"),
],
};

export default config;