import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db/mongoose";
import { ThemeModel } from "@/lib/db/models";
import { themeUpdateSchema } from "@/lib/validators/theme.schema";
import { ok, fail, handleApiError } from "@/lib/api-helpers/respond";
import { requirePermission } from "@/lib/api-helpers/guard";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    await requirePermission("themes:write");
    await connectToDatabase();
    const { id } = await params;
    const parsed = themeUpdateSchema.partial().parse(await req.json());
    // See destinations/[id]/route.ts — `.partial()` leaves untouched fields
    // as explicit `undefined` rather than omitting them, which Mongoose
    // would otherwise $set (i.e. unset) on the document.
    const update = Object.fromEntries(Object.entries(parsed).filter(([, v]) => v !== undefined));

    if (parsed.isActiveHomepageTheme) {
      // Only one theme can be the active homepage theme at a time.
      await ThemeModel.updateMany({ _id: { $ne: id } }, { isActiveHomepageTheme: false });
    }

    // Fetch as plain object, merge, write the whole document back — see
    // destinations/[id]/route.ts for why hydrate-then-save() wasn't
    // reliable enough here.
    const existing = await ThemeModel.findById(id).lean();
    if (!existing) return fail("Theme not found", 404);
    const merged = { ...existing, ...update };
    delete (merged as Record<string, unknown>)._id;
    delete (merged as Record<string, unknown>).__v;
    delete (merged as Record<string, unknown>).createdAt;
    delete (merged as Record<string, unknown>).updatedAt;

    const theme = await ThemeModel.findByIdAndUpdate(id, merged, {
      new: true,
      overwrite: true,
    });
    if (!theme) return fail("Theme not found", 404);

    revalidatePath("/", "layout");
    return ok(theme);
  } catch (err) {
    return handleApiError(err);
  }
}
