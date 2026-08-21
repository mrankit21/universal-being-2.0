/**
 * A small, fixed palette of gradient/accent themes, assigned to each
 * executive deterministically by name — same person always gets the
 * same color across the leaderboard strip, the performance grid, and
 * their own detail page, with zero configuration needed as new
 * salespeople get added.
 */
export interface ExecutiveTheme {
  gradient: string; // avatar / header background
  ring: string; // border accent
  soft: string; // light background for chips/bars
  text: string; // accent text color
  bar: string; // solid bar fill for charts
}

const PALETTE: ExecutiveTheme[] = [
  { gradient: "from-violet-500 to-fuchsia-500", ring: "ring-violet-300", soft: "bg-violet-50", text: "text-violet-700", bar: "bg-violet-500" },
  { gradient: "from-sky-500 to-cyan-400", ring: "ring-sky-300", soft: "bg-sky-50", text: "text-sky-700", bar: "bg-sky-500" },
  { gradient: "from-amber-500 to-orange-400", ring: "ring-amber-300", soft: "bg-amber-50", text: "text-amber-700", bar: "bg-amber-500" },
  { gradient: "from-emerald-500 to-teal-400", ring: "ring-emerald-300", soft: "bg-emerald-50", text: "text-emerald-700", bar: "bg-emerald-500" },
  { gradient: "from-rose-500 to-pink-400", ring: "ring-rose-300", soft: "bg-rose-50", text: "text-rose-700", bar: "bg-rose-500" },
  { gradient: "from-indigo-500 to-blue-400", ring: "ring-indigo-300", soft: "bg-indigo-50", text: "text-indigo-700", bar: "bg-indigo-500" },
  { gradient: "from-lime-500 to-green-400", ring: "ring-lime-300", soft: "bg-lime-50", text: "text-lime-700", bar: "bg-lime-500" },
  { gradient: "from-fuchsia-500 to-purple-400", ring: "ring-fuchsia-300", soft: "bg-fuchsia-50", text: "text-fuchsia-700", bar: "bg-fuchsia-500" },
];

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

export function themeFor(name: string): ExecutiveTheme {
  return PALETTE[hash(name.trim().toLowerCase()) % PALETTE.length];
}

export function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
