export const light = {
  bg: '#F3EFE6',
  surface: '#FFFCF8',
  surface2: '#EFE8DC',
  text: '#2C2926',
  muted: '#5A534C',
  green: '#244440',
  button: '#3E5C58',
  onButton: '#FFFFFF',
  line: '#DDD4C6',
  danger: '#6E2E2A',
  dangerBg: '#F8EBE7',
};

export const dark = {
  bg: '#12131A',
  surface: '#1C1D27',
  surface2: '#262833',
  text: '#F4EFE6',
  muted: '#C9C3B8',
  green: '#C5DDD7',
  button: '#3E5C58',
  onButton: '#FFFFFF',
  line: '#343644',
  danger: '#F0C2BA',
  dangerBg: '#3A2424',
};

export const night = {
  bg: '#101218',
  card: '#1A1C28',
  text: '#F4EFE6',
  body: '#DDD6CA',
  muted: '#C5D2CE',
  line: '#2E3344',
  button: '#3E5C58',
  onButton: '#FFFFFF',
};

export function resolveTheme(mode, date = new Date()) {
  if (mode === 'light' || mode === 'dark') return mode;
  const hour = date.getHours();
  return hour >= 20 || hour < 6 ? 'dark' : 'light';
}
