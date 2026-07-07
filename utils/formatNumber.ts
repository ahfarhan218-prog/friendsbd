export const formatLargeNumber = (num: number | undefined | null): string => {
  if (num === undefined || num === null || isNaN(num)) return "0";
  if (num < 1000) return num.toString();

  const suffixes = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"];
  const tier = Math.floor(Math.log10(num) / 3);
  
  if (tier === 0) return num.toString();
  
  const suffix = suffixes[tier] || "e" + (tier * 3);
  const scale = Math.pow(10, tier * 3);
  const scaled = num / scale;
  
  // Keep up to 2 decimal places, but drop trailing zeros
  return Number(scaled.toFixed(2)) + suffix;
};
