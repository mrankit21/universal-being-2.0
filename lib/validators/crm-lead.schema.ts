import { z } from "zod";
import { CRM_LEAD_STATUSES, CRM_LEAD_SOURCES, CRM_LOST_REASONS } from "@/lib/crm/constants";

/** POST /api/admin/crm/leads — manual lead creation (Admin -> CRM -> New
 * Lead). Website/Meta/WhatsApp-originated leads go through their own
 * server-side paths in later phases and won't reuse this exact schema
 * (e.g. they don't need a human picking the source). */
export const createCrmLeadSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  phone: z.string().trim().min(6, "Phone is required").max(20),
  whatsappNumber: z.string().trim().max(20).optional(),
  email: z.string().trim().email().optional().or(z.literal("")),
  destination: z.string().trim().max(200).optional(),
  travelTiming: z.string().trim().max(120).optional(),
  paxCount: z.number().int().positive().optional(),
  budget: z.string().trim().max(60).optional(),
  source: z.enum(CRM_LEAD_SOURCES).default("manual"),
  platform: z.string().trim().max(60).optional(),
  notes: z.string().trim().max(2000).optional(),
  assignedTo: z.string().trim().max(80).optional(),
});
export type CreateCrmLeadInput = z.infer<typeof createCrmLeadSchema>;

/** PATCH /api/admin/crm/leads/[id] — every field optional so the UI can
 * send just the one thing that changed (status button, assignee select,
 * follow-up picker, note textarea) without resubmitting the whole lead. */
export const updateCrmLeadSchema = z
  .object({
    status: z.enum(CRM_LEAD_STATUSES).optional(),
    lostReason: z.enum(CRM_LOST_REASONS).optional(),
    assignedTo: z.string().trim().max(80).nullable().optional(),
    nextFollowUpAt: z.string().datetime().nullable().optional(),
    note: z.string().trim().max(2000).optional(), // appends an activity + sets `notes`
    name: z.string().trim().min(1).max(120).optional(),
    phone: z.string().trim().min(6).max(20).optional(),
    whatsappNumber: z.string().trim().max(20).optional(),
    email: z.string().trim().email().optional().or(z.literal("")),
    destination: z.string().trim().max(200).optional(),
    travelTiming: z.string().trim().max(120).optional(),
    paxCount: z.number().int().positive().optional(),
    budget: z.string().trim().max(60).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "No fields to update." });
export type UpdateCrmLeadInput = z.infer<typeof updateCrmLeadSchema>;
