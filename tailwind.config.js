/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        navy: {
          900: '#172554',
        },
      },
      fontFamily: {
        sans: ['var(--font-montserrat-alternates)', 'sans-serif'],
        'montserrat-alternates': ['var(--font-montserrat-alternates)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
