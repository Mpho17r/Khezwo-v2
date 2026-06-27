import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // KheZwo brand — the product's own identity (registration, vendor &
        // admin dashboards). Pulled from the KheZwo logo: ink navy base,
        // a warm red and a gold accent.
        khezwo: {
          ink: "#1B1B2F",
          red: "#E3473B",
          gold: "#F2B632",
          green: "#2F8F5B",
          cream: "#FBF8F2",
        },
        // Saccharum Technologies — the holding company. Used ONLY as a
        // quiet watermark (footer credit, settings/about, report headers).
        // It should never compete with khezwo or a vendor's own branding.
        saccharum: {
          green: "#1B5E3F",
          gold: "#C9A227",
        },
      },
      fontFamily: {
        display: ["var(--font-display)"],
        sans: ["var(--font-sans)"],
      },
    },
  },
  plugins: [],
};

export default config;
