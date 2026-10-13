export const prefersDark = matchMedia("(prefers-color-scheme: dark)");

export const isDark = () => {
  const theme = document.documentElement.dataset.theme;
  return theme ? theme === "dark" : prefersDark.matches;
};
