/**
 * Simple cookie utility for sidebar state persistence
 * Based on shadcn-admin's cookie handling
 */

export function getCookie(name) {
  if (typeof document === 'undefined') return null;
  const value = document.cookie.split('; ').find((row) => row.startsWith(`${name}=`));
  return value ? value.split('=')[1] : null;
}

export function setCookie(name, value, days = 365) {
  if (typeof document === 'undefined') return;
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
}

export function removeCookie(name) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
}
