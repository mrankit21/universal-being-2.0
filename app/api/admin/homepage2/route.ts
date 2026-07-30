/** GET/PATCH /api/admin/homepage2 — single-document "Homepage 2.0"
 * management (Hero Parallax, Floating Quick Links, Featured Trips Stack).
 * Same upsert-a-singleton pattern as `/api/admin/homepage`, kept as its
 * own collection so v1 and v2 content never collide. */
import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db/mongoose";
import { HomepageV2Model } from "@/lib/db/models";
import { homepageV2UpdateSchema } from "@/lib/validators/homepage-v2.schema";
import { ok, handleApiError } from "@/lib/api-helpers/respond";
import { requirePermission } from "@/lib/api-helpers/guard";

async function getOrCreateSingleton() {
  let doc = await HomepageV2Model.findOne();
  if (!doc) doc = await HomepageV2Model.create({});
  return doc;
}

export async function GET() {
  try {
    await requirePermission("homepage:read");
    await connectToDatabase();
    const homepage = await getOrCreateSingleton();
    return ok(homepage);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requirePermission("homepage:write");
    await connectToDatabase();
    const body = await req.json();
    const parsed = homepageV2UpdateSchema.parse(body);
    // Only forward keys the client actually sent — see the identical note
    // in app/api/admin/homepage/route.ts for why a definedness filter on
    // `parsed` isn't enough once zod `.default()`s are in play.
    const update = Object.fromEntries(
      Object.entries(parsed).filter(([k]) => Object.prototype.hasOwnProperty.call(body, k))
    );

    const doc = await getOrCreateSingleton();
    Object.assign(doc, update, { updatedBy: session.email });
    await doc.save();

    revalidatePath("/");
    return ok(doc);
  } catch (err) {
    return handleApiError(err);
  }
}
