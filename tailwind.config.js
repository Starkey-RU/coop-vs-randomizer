export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        hcDark: '#0D0D12',
        hcPanel: '#1a1a24',
        hcBorder: '#2d2d3a',
        hcAccent: '#d2b936',    // Желтый из игры
        hcBlue: '#4b9bb5',      // Синий (синие стратагемы)
        hcRed: '#d23d45',       // Красный (орлы)
        hcGreen: '#4e8c56',     // Зеленый (турели)
        // Для стимп-панк темы
        steamBg: '#1e1c18',
        steamPanel: '#2c2720',
        steamBorder: '#5b4c33',
        steamAccent: '#cca664',
      }
    },
  },
  plugins: [],
}