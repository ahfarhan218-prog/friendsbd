/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./App.tsx",
    "./index.tsx",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'custom-bg': '#f8fafc',          // GLOBAL_BACKGROUND
        'custom-surface': '#ffffff',     // SURFACE_CARDS
        'custom-border': '#cbd5e1',      // MUTED_BORDER
        'custom-text-primary': '#000000', // TEXT_PRIMARY
        'custom-text-muted': '#64748b',   // TEXT_MUTED
        'custom-purple': '#6d28d9',      // PRIMARY_ACTION
        'custom-teal': '#0f766e',        // ACCENT_SUCCESS
        'custom-crimson': '#dc2626',     // ACCENT_DANGER
        'custom-amber': '#b45309',       // ACCENT_WARNING
        'custom-navy': '#1e293b',        // BRAND_NAVY
      },
    },
  },
  plugins: [],
}
