module.exports = {
  content: [
    "./src/**/*.{njk,html,js,md}",
    "./src/_includes/**/*.{njk,html,js,md}",
  ],
  safelist: [
    "bg-blue-50",
    "bg-pink-50",
    "bg-green-50",
    "text-blue-500",
    "text-pink-500",
    "text-green-500",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
