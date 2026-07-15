/** GET /api/admin/themes — list all theme docs (seeded from `data/themes/*`
 * on first read if the collection is empty, so the Theme Management screen
 * always has the 7 existing moods to tune, per Architecture §4). */
import { connectToDatabase } from "@/lib/db/mongoose";
import { ThemeModel } from "@/lib/db/models";
import { themeRegistry } from "@/data/themes";
import { ok, handleApiError } from "@/lib/api-helpers/respond";
import { requirePermission } from "@/lib/api-helpers/guard";

export async function GET() {
  try {
    await requirePermission("themes:read");
    await connectToDatabase();

    const count = await ThemeModel.countDocuments();
    if (count === 0) {
      // First-run seed: mirror the local `data/themes/*` ThemeConfig objects
      // into the DB collection so admins start from real content, not blanks.
      await ThemeModel.insertMany(
        Object.values(themeRegistry).map((theme) => ({
          key: theme.key,
          name: theme.name,
          config: theme,
          isSeasonal: false,
          isActiveHomepageTheme: theme.key === "brand",
        }))
      );
    }

    const themes = await ThemeModel.find().sort({ key: 1 }).lean();
    return ok(themes);
  } catch (err) {
    return handleApiError(err);
  }
}
