/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        khezwo: {
          ink: "#1B1B2F",
          red: "#E3473B",
          gold: "#F2B632",
          green: "#2F8F5B",
          cream: "#FBF8F2",
        },
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
