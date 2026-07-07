export interface StatusTier {
  title: string;
  min: number;
  max: number;
  color: string;
}

export const STATUS_TIERS: StatusTier[] = [
  { title: "Newbie Explorer", min: 0, max: 9, color: "text-slate-400 bg-slate-500/10 border-slate-500/20" },
  { title: "Basic Member", min: 10, max: 499, color: "text-slate-300 bg-slate-500/10 border-slate-500/20" },
  { title: "Rising Star", min: 500, max: 1499, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  { title: "Active Enthusiast", min: 1500, max: 2999, color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20" },
  { title: "Trusted Member", min: 3000, max: 5999, color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" },
  { title: "Elite Member", min: 6000, max: 11999, color: "text-teal-400 bg-teal-500/10 border-teal-500/20" },
  { title: "Golden Contributor", min: 12000, max: 23999, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  { title: "Sapphire Member", min: 24000, max: 47999, color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  { title: "Royal Member", min: 48000, max: 59999, color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
  { title: "Platinum Member", min: 60000, max: 79999, color: "text-rose-400 bg-rose-500/10 border-rose-500/20" },
  { title: "FBD Geek", min: 80000, max: 99999, color: "text-orange-400 bg-orange-500/10 border-orange-500/20" },
  { title: "FBD VIP", min: 100000, max: 119999, color: "text-pink-400 bg-pink-500/10 border-pink-500/20" },
  { title: "FBD Legend", min: 120000, max: 179999, color: "text-violet-400 bg-violet-500/10 border-violet-500/20" },
  { title: "FBD Verified User", min: 180000, max: Infinity, color: "text-emerald-400 bg-emerald-500/20 border-emerald-500/30" }
];

export const getUserStatus = (plusses: number): StatusTier => {
  const count = plusses || 0;
  const matched = STATUS_TIERS.find(tier => count >= tier.min && count <= tier.max);
  return matched || STATUS_TIERS[0];
};
