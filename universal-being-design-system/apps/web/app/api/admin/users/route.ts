/** GET/POST /api/admin/users — User Management (requirement #10), gated to
 * `users:read`/`users:write` which only the `admin` role has (`lib/auth/rbac.ts`). */
import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { UserModel } from "@/lib/db/models";
import { userCreateSchema } from "@/lib/validators/user.schema";
import { hashPassword } from "@/lib/auth/password";
import { ok, created, fail, handleApiError } from "@/lib/api-helpers/respond";
import { requirePermission } from "@/lib/api-helpers/guard";

export async function GET() {
  try {
    await requirePermission("users:read");
    await connectToDatabase();
    const users = await UserModel.find().select("-passwordHash").sort({ createdAt: -1 }).lean();
    return ok(users);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requirePermission("users:write");
    await connectToDatabase();
    const parsed = userCreateSchema.parse(await req.json());

    const existing = await UserModel.findOne({ email: parsed.email.toLowerCase() });
    if (existing) return fail(`A user with email "${parsed.email}" already exists`, 409);

    const passwordHash = await hashPassword(parsed.password);
    const user = await UserModel.create({
      name: parsed.name,
      email: parsed.email.toLowerCase(),
      role: parsed.role,
      active: parsed.active,
      passwordHash,
    });

    const { passwordHash: _hash, ...safeUser } = user.toObject();
    void _hash;
    return created(safeUser);
  } catch (err) {
    return handleApiError(err);
  }
}
