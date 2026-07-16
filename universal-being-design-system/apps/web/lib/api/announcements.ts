import { isDatabaseConfigured, connectToDatabase } from "@/lib/db/mongoose";
import { AnnouncementModel, type AnnouncementDocument } from "@/lib/db/models";
import { activeAnnouncement as staticActiveAnnouncement } from "@/data/layout/announcement";
import type { AnnouncementConfig } from "@/types/layout";

/**
 * lib/api/announcements.ts — Step 7.6C-B Part 2. Same DB-first / static-
 * fallback swap point as `lib/api/home.ts` and `lib/api/destinations.ts`,
 * applied to the Announcement Bar. Previously `components/layout/root-shell.tsx`
 * imported `data/layout/announcement.ts` directly, so publishing/editing an
 * announcement in the Admin Panel (Announcements CRUD already existed) never
 * reached the live site. This file is now the ONLY place that decides
 * "database or seed data" for the announcement bar; `app/layout.tsx` calls
 * it once and passes the result down as a prop.
 *
 * Rule enforced here: MongoDB is read first; `data/layout/announcement.ts`
 * is used only when the database isn't configured, or no enabled/current
 * announcement exists in the database yet.
 */

function docToConfig(doc: {
  _id: unknown;
  kind: AnnouncementConfig["kind"];
  message: string;
  href?: string;
  linkLabel?: string;
  dismissible: boolean;
}): AnnouncementConfig {
  return {
    id: String(doc._id),
    kind: doc.kind,
    message: doc.message,
    href: doc.href,
    linkLabel: doc.linkLabel,
    dismissible: doc.dismissible,
  };
}

/**
 * Resolves the single announcement the bar should show: the most recently
 * updated announcement that is `enabled` and not past its `expiresAt`, or
 * `null` if none qualify. Falls back to the static seed config only when
 * the database isn't configured at all — an admin explicitly disabling or
 * deleting every announcement should result in no bar, not the static one
 * reappearing.
 */
export async function getActiveAnnouncement(): Promise<AnnouncementConfig | null> {
  if (!isDatabaseConfigured()) return staticActiveAnnouncement;

  try {
    await connectToDatabase();
    const now = new Date().toISOString();
    const doc = (await AnnouncementModel.findOne({
      enabled: true,
      $or: [{ expiresAt: { $exists: false } }, { expiresAt: "" }, { expiresAt: { $gt: now } }],
    })
      .sort({ updatedAt: -1 })
      .lean()) as (AnnouncementDocument & { _id: unknown }) | null;

    return doc ? docToConfig(doc) : null;
  } catch (err) {
    // A configured-but-unreachable MONGODB_URI must never take down every
    // page on the site -- this runs inside the root layout on every request.
    console.error("[getActiveAnnouncement] MongoDB unreachable, falling back to static announcement:", err);
    return staticActiveAnnouncement;
  }
}
