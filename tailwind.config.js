module.exports = {
  content: [
    "./src/**/*.{njk,html,js,md}",
    "./src/_includes/**/*.{njk,html,js,md}",
  ],
  safelist: [
    // broad patterns for mainThree colors (bg/text/border)
    { pattern: /bg-(blue|red|green)-(50|100|200|300|400|500|600)/ },
    { pattern: /text-(blue|red|green)-(100|200|300|400|500|600)/ },
    { pattern: /border-(blue|red|green)-(100|200|300|400|500|600)/ },
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
