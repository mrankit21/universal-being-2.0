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
    const body = await req.json();
    const parsed = userUpdateSchema.parse(body);

    if (id === session.sub && parsed.active === false) {
      return fail("You cannot deactivate your own account", 400);
    }

    // Only forward keys the client actually sent in the RAW body. Every
    // field userUpdateSchema didn't get a value for still ends up on
    // `parsed` as an explicit `key: undefined` — spreading that straight
    // into `update` and on to findByIdAndUpdate is relying on the Mongo
    // driver's undefined-handling to quietly drop those keys, which isn't
    // guaranteed. Checking the pre-zod `body` for the key is the reliable
    // way to tell "client sent this" from "zod left this undefined".
    const update: Record<string, unknown> = Object.fromEntries(
      Object.entries(parsed).filter(([k]) => Object.prototype.hasOwnProperty.call(body, k))
    );
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
