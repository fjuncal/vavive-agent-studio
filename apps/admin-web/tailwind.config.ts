import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#172033",
        mist: "#F5F7FB",
        line: "#E6EAF2",
        brand: {
          50: "#EEF9F7",
          100: "#D7F0EA",
          500: "#22A587",
          600: "#16876E",
          700: "#116B59"
        }
      },
      boxShadow: {
        soft: "0 18px 50px rgba(28, 39, 64, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
