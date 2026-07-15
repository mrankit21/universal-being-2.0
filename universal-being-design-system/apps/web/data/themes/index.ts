import type { ThemeConfig, ThemeKey } from "@/types/theme";
import { brandTheme } from "./brand";
import { rajasthanTheme } from "./rajasthan";
import { winterTheme } from "./winter";
import { monsoonTheme } from "./monsoon";
import { beachTheme } from "./beach";
import { mountainTheme } from "./mountain";
import { forestTheme } from "./forest";
import { udaipurTheme } from "./udaipur";
import { spitiTheme } from "./spiti";
import { manaliTheme } from "./manali";
import { goaTheme } from "./goa";
import { jibhiTheme } from "./jibhi";

/**
 * Theme registry — the ONLY place that lists every theme by key. Adding a
 * destination mood means adding one config file above and one line here;
 * nothing that consumes `ThemeConfig` needs to change (Phase 3 DX goal).
 */
export const themeRegistry: Record<ThemeKey, ThemeConfig> = {
  brand: brandTheme,
  rajasthan: rajasthanTheme,
  winter: winterTheme,
  monsoon: monsoonTheme,
  beach: beachTheme,
  mountain: mountainTheme,
  forest: forestTheme,
  udaipur: udaipurTheme,
  spiti: spitiTheme,
  manali: manaliTheme,
  goa: goaTheme,
  jibhi: jibhiTheme,
};

export const themeKeys = Object.keys(themeRegistry) as ThemeKey[];
