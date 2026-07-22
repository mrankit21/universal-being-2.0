import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { UserModel } from "@/lib/db/models";
import { userUpdateSchema } from "@/lib/validators/user.schema";
import { hashPassword } from "@/lib/auth/password";
import { ok, fail, handleApiError } from "@/lib/api-helpers/respond";
import { requirePermission } from "@/lib/api-helpers/guard";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await requirePermission("users:write");
    await connectToDatabase();
    const { id } = await params;
    const parsed = userUpdateSchema.parse(await req.json());

    if (id === session.sub && parsed.active === false) {
      return fail("You cannot deactivate your own account", 400);
    }

    const update: Record<string, unknown> = { ...parsed };
    delete update.password;
    if (parsed.password) update.passwordHash = await hashPassword(parsed.password);
    if (parsed.email) update.email = parsed.email.toLowerCase();

    const user = await UserModel.findByIdAndUpdate(id, update, { new: true }).select("-passwordHash");
    if (!user) return fail("User not found", 404);
    return ok(user);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await requirePermission("users:write");
    await connectToDatabase();
    const { id } = await params;

    if (id === session.sub) return fail("You cannot delete your own account", 400);

    const user = await UserModel.findByIdAndDelete(id);
    if (!user) return fail("User not found", 404);
    return ok({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
