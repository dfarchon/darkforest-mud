// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export const mode = "jit";
export const purge = [
  "./src/**/*.{html,js,jsx,ts,tsx}", // Ensure all JS/TS files within src are included
  "./public/index.html", // Include HTML files in public directory
];
export const content = [
  "./index.html", // Ensure HTML files are included
  "./src/**/*.{js,ts,jsx,tsx}", // Ensure all JavaScript/TypeScript files are included
];
export const theme = {
  extend: {
    // Custom colors
    colors: {
      darkGray: "#333", // Example dark grey color
      lighterGray: "#444", // Example lighter grey color
    },
    // Other customizations
  },
};
export const plugins = [require("@tailwindcss/typography"), require("daisyui"), require("tailwindcss-animate")];

export const daisyui = {
  // false: only light + dark | true: all themes | array: specific themes like this ["light", "dark", "cupcake"]
  darkTheme: "forest", // name of one of the included themes for dark mode
  base: true, // applies background color and foreground color for root element by default
  styled: true, // include daisyUI colors and design decisions for all components
  utils: true, // adds responsive and modifier utility classes
  prefix: "", // prefix for daisyUI classnames (components, modifiers and responsive class names. Not colors)
  logs: true, // Shows info about daisyUI version and used config in the console when building your CSS
  themeRoot: ":root", // The element that receives theme color CSS variables
  themes: [
    {
      forest: {
        ...require("daisyui/src/theming/themes")["forest"],
        "--rounded-btn": "0.25rem",
      },
    },
    "forest",
  ],
};

// export const daisyui = {
//   darkTheme: "forest",
//   base: true,
//   utils: true,
//   themes: [
//     {
//       forest: {
//         ...require("daisyui/src/theming/themes")["forest"],
//         "--rounded-btn": "0.25rem",
//       },
//     },
//     "forest",
//   ],
// };
