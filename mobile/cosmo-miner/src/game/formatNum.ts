const SUFFIX_MAP: Record<string, number> = {
  K:  1e3,  M:  1e6,  B:  1e9,
  KB: 1e12, MB: 1e15, BB: 1e18,
  TB: 1e21, QB: 1e24, PB: 1e27,
  XB: 1e30, YB: 1e33, ZB: 1e36,
  AB: 1e39, CB: 1e42, FB: 1e45,
  GB: 1e48, HB: 1e51, IB: 1e54,
  JB: 1e57, LB: 1e60,
};

export function bn(s: string): number {
  const m = s.match(/^([0-9.]+)([A-Z]+)?$/);
  if (!m) throw new Error(`bn: invalid "${s}"`);
  const suffix = m[2] ?? '';
  if (suffix && !(suffix in SUFFIX_MAP)) throw new Error(`bn: unknown suffix "${suffix}"`);
  return parseFloat(m[1]) * (SUFFIX_MAP[suffix] ?? 1);
}

export function formatNum(n: number): string {
  if (!Number.isFinite(n)) return "0";
  if (n >= 1e60) return (n / 1e60).toFixed(1) + "LB";
  if (n >= 1e57) return (n / 1e57).toFixed(1) + "JB";
  if (n >= 1e54) return (n / 1e54).toFixed(1) + "IB";
  if (n >= 1e51) return (n / 1e51).toFixed(1) + "HB";
  if (n >= 1e48) return (n / 1e48).toFixed(1) + "GB";
  if (n >= 1e45) return (n / 1e45).toFixed(1) + "FB";
  if (n >= 1e42) return (n / 1e42).toFixed(1) + "CB";
  if (n >= 1e39) return (n / 1e39).toFixed(1) + "AB";
  if (n >= 1e36) return (n / 1e36).toFixed(1) + "ZB";
  if (n >= 1e33) return (n / 1e33).toFixed(1) + "YB";
  if (n >= 1e30) return (n / 1e30).toFixed(1) + "XB";
  if (n >= 1e27) return (n / 1e27).toFixed(1) + "PB";
  if (n >= 1e24) return (n / 1e24).toFixed(1) + "QB";
  if (n >= 1e21) return (n / 1e21).toFixed(1) + "TB";
  if (n >= 1e18) return (n / 1e18).toFixed(1) + "BB";
  if (n >= 1e15) return (n / 1e15).toFixed(1) + "MB";
  if (n >= 1e12) return (n / 1e12).toFixed(1) + "KB";
  if (n >= 1e9) return (n / 1e9).toFixed(1) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return Math.floor(n).toString();
}

