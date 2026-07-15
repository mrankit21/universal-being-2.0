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

    if (parsed.isActiveHomepageTheme) {
      // Only one theme can be the active homepage theme at a time.
      await ThemeModel.updateMany({ _id: { $ne: id } }, { isActiveHomepageTheme: false });
    }

    const theme = await ThemeModel.findByIdAndUpdate(id, parsed, { new: true, runValidators: true });
    if (!theme) return fail("Theme not found", 404);

    revalidatePath("/", "layout");
    return ok(theme);
  } catch (err) {
    return handleApiError(err);
  }
}
