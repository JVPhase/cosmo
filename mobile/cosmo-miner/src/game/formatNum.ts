export function formatNum(n: number): string {
  if (!Number.isFinite(n)) return "0";
  if (n >= 1e18) return (n / 1e18).toFixed(1) + "BB";
  if (n >= 1e15) return (n / 1e15).toFixed(1) + "MB";
  if (n >= 1e12) return (n / 1e12).toFixed(1) + "KB";
  if (n >= 1e9) return (n / 1e9).toFixed(1) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return Math.floor(n).toString();
}

