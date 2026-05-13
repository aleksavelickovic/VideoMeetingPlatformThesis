/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        page: "var(--color-page)",
        "preview-from": "var(--color-preview-from)",
        surface: "var(--color-surface)",
        border: "var(--color-border-subtle)",
        brand: {
          DEFAULT: "var(--color-brand)",
          muted: "var(--color-brand-muted)",
          glow: "var(--color-brand-glow)",
        },
        join: {
          DEFAULT: "var(--color-join)",
          hover: "var(--color-join-hover)",
        },
        text: {
          primary: "var(--color-text-primary)",
          secondary: "var(--color-text-secondary)",
          error: "var(--color-text-error)",
        },
      },
      backgroundImage: {
        "preview-gradient": "var(--gradient-preview)",
        "avatar-gradient": "var(--gradient-avatar)",
      },
      boxShadow: {
        "brand-glow": "var(--shadow-brand-glow)",
      },
    },
  },
  plugins: [],
};