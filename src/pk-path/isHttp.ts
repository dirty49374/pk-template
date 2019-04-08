
export const isHttp = (uri: string) => {
  const lower = uri.toLowerCase();
  return lower.startsWith('http://') || lower.startsWith('https://');
}
