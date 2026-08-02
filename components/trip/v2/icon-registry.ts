import {
  Building2,
  Sparkles,
  MapIcon,
  Image as ImageIcon,
  Star,
  HelpCircle,
  Globe2,
  Mountain,
  Compass,
  Sun,
  Snowflake,
  Camera,
  Utensils,
  Bed,
  Car,
  Tent,
  Backpack,
  Landmark,
  ShieldCheck,
  Heart,
  type LucideIcon,
} from "lucide-react";

/**
 * Trip 2.0 — shared icon-name registry. Same idea as
 * `components/home/v2/floating-quick-links.tsx`'s `QUICK_LINK_ICONS`: a
 * name→component map lets Quick Links tiles and Did You Know cards store
 * their icon as a plain string in MongoDB and be picked from a `<Select>`
 * in the admin UI, instead of trying to serialize a component reference.
 */
export const TRIP2_ICONS: Record<string, LucideIcon> = {
  Building2,
  Sparkles,
  MapIcon,
  ImageIcon,
  Star,
  HelpCircle,
  Globe2,
  Mountain,
  Compass,
  Sun,
  Snowflake,
  Camera,
  Utensils,
  Bed,
  Car,
  Tent,
  Backpack,
  Landmark,
  ShieldCheck,
  Heart,
};

export type Trip2IconName = keyof typeof TRIP2_ICONS;
export const TRIP2_ICON_NAMES = Object.keys(TRIP2_ICONS) as Trip2IconName[];

export function resolveTrip2Icon(name: string | undefined): LucideIcon {
  return (name && TRIP2_ICONS[name]) || Sparkles;
}
