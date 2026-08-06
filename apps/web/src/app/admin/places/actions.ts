"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { updatePlaceStatus } from "@/lib/admin-api";
import { requireAdmin } from "@/lib/supabase/server";

const schema = z.object({
  placeId: z.uuid(),
  status: z.enum(["draft", "published", "hidden", "closed"]),
});

export async function setPlaceStatus(formData: FormData) {
  const user = await requireAdmin();
  if (!user) throw new Error("Unauthorized");
  const parsed = schema.parse({ placeId: formData.get("placeId"), status: formData.get("status") });
  await updatePlaceStatus(parsed.placeId, parsed.status, user.id);
  revalidatePath("/admin/places");
  revalidatePath("/api/v1/places", "layout");
}
