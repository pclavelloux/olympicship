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
        'gh-primary': '#020408',
        'gh-secondary': '#0C1116',
        'gh-tertiary': '#222825',
        'gh-white': '#F0F6FC',
        'gh-white2': '#dedede',
        'gh-primary-blue': '#5991F1',
      },
      borderRadius: {
        'gh': '6px',
      },
    },
  },
  plugins: [require("daisyui")],
  // @ts-ignore - DaisyUI configuration
  daisyui: {
    themes: [
      {
        gh: {
          "primary": "#5991F1",           // github-primary-blue
          "secondary": "#2b3137",         // github-secondary
          "accent": "#222825",            // github-tertiary
          "neutral": "#020408",           // github-primary
          "base-100": "#F0F6FC",          // github-white
          "base-200": "#0C1116",          // github-secondary pour les backgrounds alternatifs
          "base-300": "#222825",          // github-tertiary pour les borders
          "info": "#5991F1",              // github-primary-blue
          "success": "#238636",           // Vert GitHub pour succès
          "warning": "#d29922",           // Jaune GitHub pour warnings
          "error": "#da3633",             // Rouge GitHub pour erreurs
          "--rounded-box": "6px",         // Utilise notre border-radius github
          "--rounded-btn": "6px",         // Pour les boutons
          "--rounded-badge": "6px",        // Pour les badges
        },
      },
    ],
  },
};

export default config;

