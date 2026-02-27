const KEY = 23;

export function obfuscate(value = '') {
  const transformed = Array.from(value).map((ch) => String.fromCharCode(ch.charCodeAt(0) ^ KEY)).join('');
  return btoa(transformed);
}

export function deobfuscate(value = '') {
  if (!value) return '';
  try {
    const decoded = atob(value);
    return Array.from(decoded).map((ch) => String.fromCharCode(ch.charCodeAt(0) ^ KEY)).join('');
  } catch {
    return '';
  }
}
