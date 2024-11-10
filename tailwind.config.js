// const toggleSafeList = Array.from({ length: 9 }).reduce((acc, ))
import plugin from "tailwindcss/plugin";

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // UI bckground colors. Default is the background for the whole site
        background: {
          darkDEFAULT: "#0B0C0F",
          darkContainer: "#38383C",
          darkInput: "#272D34",
          darkPanel: "#191B23",
          darkPanelSurface: "#272D34",
          darkLime: "#C7FF00",
          DEFAULT: "#F3F3F3",
          container: "#FFFFFF",
          input: "#FFFFFF",
          panel: "#FFFFFF",
          panelSurface: "#F3F3F3",
          panelStroke: "#38383C94",
          lime: "#103bd2",
        },
        // Primary color for highlights
        primary: {
          // eslint-disable-next-line no-undef
          DEFAULT: process.env.PRIMARY ?? "#099cca", //"#1EE385",
        },
        // Text colors.
        oldtext: {
          button: "#2E2F2D",
          DEFAULT: "#FFFFFF",
          placeholder: "#A7A7A7",
          danger: "#ff5252",
          warning: "#F6BE00",
          tradeGreen: "#98E31E",
          darkButton: "#0B0C0F",
        },
        text: {
          button: "#2E2F2D",
          DEFAULT: "#191b23",
          placeholder: "#909090",
          danger: "#ff5252",
          warning: "#E36138",
          tradeGreen: "#103bd2",
          darkButton: "#0B0C0F",
        },
        chart: {
          0: "#103BD2",
          1: "var(--primary)",
          2: "#E36138",
          3: "#9D40D7",
          4: "#F579FF",
          5: "#4CB5F5",
        },
        oldchart: {
          0: "var(--primary)", // primary green
          1: "#FFC658", // aquamarine
          2: "#98E31E", // salad green
          3: "#8A57FF", // royal purple
          4: "#F579FF", // cotton candy
          5: "#4CB5F5", // sky blue
        },
      },
      fontFamily: {
        khand: ["Poppins"],
        montserrat: ["Montserrat"],
      },
      boxShadow: {
        "armada-glow":
          "0 0 5px var(--primary), 0 0 5px var(--primary), 0 0 5px var(--primary), 0 0 15px var(--primary)",
      },
      textShadow: {
        DEFAULT: "0 0px 10px var(--primary)",
        lg: "0 0 19px var(--primary)",
      },
    },
  },
  variants: {
    extend: {
      boxShadow: ["hover"],
    },
  },
  safelist: [
    {
      pattern: /w-1\/(0|1|2|3|4|5|6|7|8|9)/,
    },
    {
      pattern: /chart-(0|1|2|3|4|5)/,
    },
  ],
  plugins: [
    plugin(function ({ matchUtilities, theme }) {
      matchUtilities(
        {
          "text-shadow": (value) => ({
            textShadow: value,
          }),
        },
        { values: theme("textShadow") }
      );
    }),
  ],
};
