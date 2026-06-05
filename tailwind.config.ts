import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#101417",
          low: "#191c1f",
          mid: "#1d2023",
          high: "#272a2d",
        },
        neon: {
          red: "#FF4B4B",
          redLight: "#ffb3ae",
          cyan: "#00EEFC",
          purple: "#C464FF",
          green: "#39FF14",
          yellow: "#ffd400",
          pink: "#ff66c4",
        },
        ink: {
          DEFAULT: "#e0e2e6",
          dim: "#a8aab0",
        },
      },
      fontFamily: {
        display: ["Plus Jakarta Sans", "sans-serif"],
        body: ["Source Sans 3", "sans-serif"],
      },
      boxShadow: {
        "neon-red": "0 0 16px rgba(255,75,75,0.5)",
        "neon-cyan": "0 0 16px rgba(0,238,252,0.5)",
        "neon-purple": "0 0 16px rgba(196,100,255,0.5)",
        "neon-green": "0 0 16px rgba(57,255,20,0.5)",
      },
      animation: {
        float: "float 3s ease-in-out infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "slide-up": "slide-up 0.4s ease both",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 8px rgba(255,75,75,0.4)" },
          "50%": { boxShadow: "0 0 24px rgba(255,75,75,0.8)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
