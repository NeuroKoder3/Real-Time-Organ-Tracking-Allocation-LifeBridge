import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  integer,
  boolean,
  decimal,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/* -------------------------------------------------------------------------- */
/*                                  Sessions                                  */
/* -------------------------------------------------------------------------- */

export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire", { withTimezone: true }).notNull(),
  },
  (table) => [index("idx_sessions_expire").on(table.expire)]
);

/* -------------------------------------------------------------------------- */
/*                                    Users                                   */
/* -------------------------------------------------------------------------- */

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("coordinator"),
  department: varchar("department"),
  organization: varchar("organization"),
  hospitalId: varchar("hospital_id"),
  phoneNumber: varchar("phone_number"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/* -------------------------------------------------------------------------- */
/*                                   Donors                                   */
/* -------------------------------------------------------------------------- */

export const donors = pgTable("donors", {
  id: uuid("id").defaultRandom().primaryKey(),
  unosId: varchar("unos_id").unique(),
  bloodType: varchar("blood_type").notNull(),
  age: integer("age"),
  weight: decimal("weight", { precision: 5, scale: 2 }),
  height: decimal("height", { precision: 5, scale: 2 }),
  location: varchar("location").notNull(),
  hospitalId: varchar("hospital_id"),
  status: varchar("status").notNull().default("active"),
  consentStatus: varchar("consent_status").notNull(),
  medicalHistory: jsonb("medical_history"),
  hlaType: jsonb("hla_type"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/* -------------------------------------------------------------------------- */
/*                                 Recipients                                 */
/* -------------------------------------------------------------------------- */

export const recipients = pgTable("recipients", {
  id: uuid("id").defaultRandom().primaryKey(),
  unosId: varchar("unos_id").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  bloodType: varchar("blood_type").notNull(),
  organNeeded: varchar("organ_needed").notNull(),
  urgencyStatus: varchar("urgency_status").notNull(),
  waitlistDate: timestamp("waitlist_date", { withTimezone: true }).notNull(),
  location: varchar("location").notNull(),
  hospitalId: varchar("hospital_id"),
  medicalData: jsonb("medical_data"),
  hlaType: jsonb("hla_type"),
  antibodies: jsonb("antibodies"),
  meldScore: integer("meld_score"),
  cpcScore: integer("cpc_score"),
  status: varchar("status").notNull().default("waiting"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/* -------------------------------------------------------------------------- */
/*                                    Organs                                  */
/* -------------------------------------------------------------------------- */

export const organs = pgTable("organs", {
  id: uuid("id").defaultRandom().primaryKey(),
  donorId: uuid("donor_id").references(() => donors.id).notNull(),
  organType: varchar("organ_type").notNull(),
  bloodType: varchar("blood_type").notNull(),
  status: varchar("status").notNull().default("available"),
  viabilityHours: integer("viability_hours").notNull(),
  preservationStartTime: timestamp("preservation_start_time", { withTimezone: true }).notNull(),
  viabilityDeadline: timestamp("viability_deadline", { withTimezone: true }).notNull(),
  currentLocation: varchar("current_location"),
  temperature: decimal("temperature", { precision: 4, scale: 2 }),
  preservationSolution: varchar("preservation_solution"),
  qualityScore: varchar("quality_score"),
  biopsyResults: jsonb("biopsy_results"),
  crossmatchData: jsonb("crossmatch_data"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/* -------------------------------------------------------------------------- */
/*                                 Allocations                                */
/* -------------------------------------------------------------------------- */

export const allocations = pgTable("allocations", {
  id: uuid("id").defaultRandom().primaryKey(),
  organId: uuid("organ_id").references(() => organs.id).notNull(),
  recipientId: uuid("recipient_id").references(() => recipients.id).notNull(),
  matchScore: decimal("match_score", { precision: 5, scale: 2 }).notNull(),
  compatibilityData: jsonb("compatibility_data"),
  status: varchar("status").notNull().default("proposed"),
  proposedAt: timestamp("proposed_at", { withTimezone: true }).defaultNow().notNull(),
  respondedAt: timestamp("responded_at", { withTimezone: true }),
  respondedBy: uuid("responded_by").references(() => users.id),
  declineReason: text("decline_reason"),
  priority: integer("priority").notNull().default(1),
});

/* -------------------------------------------------------------------------- */
/*                                  Transports                                */
/* -------------------------------------------------------------------------- */

export const transports = pgTable("transports", {
  id: uuid("id").defaultRandom().primaryKey(),
  organId: uuid("organ_id").references(() => organs.id).notNull(),
  allocationId: uuid("allocation_id").references(() => allocations.id),
  transportMode: varchar("transport_mode").notNull(),
  status: varchar("status").notNull().default("scheduled"),
  originLocation: varchar("origin_location").notNull(),
  destinationLocation: varchar("destination_location").notNull(),
  scheduledPickup: timestamp("scheduled_pickup", { withTimezone: true }).notNull(),
  scheduledDelivery: timestamp("scheduled_delivery", { withTimezone: true }).notNull(),
  actualPickup: timestamp("actual_pickup", { withTimezone: true }),
  actualDelivery: timestamp("actual_delivery", { withTimezone: true }),
  courierId: uuid("courier_id").references(() => users.id),
  carrierInfo: jsonb("carrier_info"),
  trackingNumber: varchar("tracking_number"),
  currentGpsLat: decimal("current_gps_lat", { precision: 9, scale: 6 }),
  currentGpsLng: decimal("current_gps_lng", { precision: 9, scale: 6 }),
  backupPlan: jsonb("backup_plan"),
  weatherImpact: varchar("weather_impact"),
  costEstimate: decimal("cost_estimate", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/* -------------------------------------------------------------------------- */
/*                                   Messages                                 */
/* -------------------------------------------------------------------------- */

export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  allocationId: uuid("allocation_id").references(() => allocations.id),
  transportId: uuid("transport_id").references(() => transports.id),
  senderId: uuid("sender_id").references(() => users.id).notNull(),
  messageType: varchar("message_type").notNull(),
  content: text("content").notNull(),
  attachmentUrl: varchar("attachment_url"),
  priority: varchar("priority").notNull().default("normal"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/* -------------------------------------------------------------------------- */
/*                                Custody Logs                                */
/* -------------------------------------------------------------------------- */

export const custodyLogs = pgTable("custody_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  organId: uuid("organ_id").references(() => organs.id).notNull(),
  action: varchar("action").notNull(),
  performedBy: uuid("performed_by").references(() => users.id).notNull(),
  location: varchar("location").notNull(),
  timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow().notNull(),
  temperature: decimal("temperature", { precision: 4, scale: 2 }),
  notes: text("notes"),
  signature: varchar("signature"),
});

/* -------------------------------------------------------------------------- */
/*                                   Metrics                                  */
/* -------------------------------------------------------------------------- */

export const metrics = pgTable("metrics", {
  id: uuid("id").defaultRandom().primaryKey(),
  metricType: varchar("metric_type").notNull(),
  organType: varchar("organ_type"),
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  period: varchar("period").notNull(),
  date: timestamp("date", { withTimezone: true }).notNull(),
  metadata: jsonb("metadata"),
});

/* -------------------------------------------------------------------------- */
/*                                 Audit Logs                                 */
/* -------------------------------------------------------------------------- */

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id),
    userEmail: varchar("user_email"),
    userRole: varchar("user_role"),
    userName: varchar("user_name"),
    sessionId: varchar("session_id").notNull(),
    ipAddress: varchar("ip_address").notNull(),
    userAgent: text("user_agent"),
    httpMethod: varchar("http_method"),
    endpoint: varchar("endpoint"),
    action: varchar("action").notNull(),
    actionCategory: varchar("action_category").notNull(),
    entityType: varchar("entity_type"),
    entityId: uuid("entity_id"),
    previousValues: jsonb("previous_values"),
    newValues: jsonb("new_values"),
    changedFields: jsonb("changed_fields"),
    queryParams: jsonb("query_params"),
    resultCount: integer("result_count"),
    success: boolean("success").notNull().default(true),
    errorMessage: text("error_message"),
    errorCode: varchar("error_code"),
    timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow().notNull(),
    metadata: jsonb("metadata"),
    phiAccessed: boolean("phi_accessed").notNull().default(false),
    exportFormat: varchar("export_format"),
    exportRecordCount: integer("export_record_count"),
  },
  (table) => [
    index("idx_audit_logs_timestamp").on(table.timestamp),
    index("idx_audit_logs_user_id").on(table.userId),
    index("idx_audit_logs_entity").on(table.entityType, table.entityId),
    index("idx_audit_logs_action").on(table.action),
    index("idx_audit_logs_action_category").on(table.actionCategory),
    index("idx_audit_logs_session_id").on(table.sessionId),
    index("idx_audit_logs_phi_accessed").on(table.phiAccessed),
  ]
);

/* -------------------------------------------------------------------------- */
/*                               Auth Audit Logs                               */
/* -------------------------------------------------------------------------- */

export const authAuditLogs = pgTable(
  "auth_audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id),
    userEmail: varchar("user_email"),
    attemptedEmail: varchar("attempted_email"),
    eventType: varchar("event_type").notNull(),
    eventStatus: varchar("event_status").notNull(),
    sessionId: varchar("session_id"),
    ipAddress: varchar("ip_address").notNull(),
    userAgent: text("user_agent"),
    failureReason: varchar("failure_reason"),
    consecutiveFailures: integer("consecutive_failures").default(0),
    mfaUsed: boolean("mfa_used").default(false),
    loginMethod: varchar("login_method"),
    previousRole: varchar("previous_role"),
    newRole: varchar("new_role"),
    changedBy: uuid("changed_by").references(() => users.id),
    timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow().notNull(),
    metadata: jsonb("metadata"),
  },
  (table) => [
    index("idx_auth_audit_timestamp").on(table.timestamp),
    index("idx_auth_audit_user_id").on(table.userId),
    index("idx_auth_audit_event_type").on(table.eventType),
    index("idx_auth_audit_ip_address").on(table.ipAddress),
    index("idx_auth_audit_session_id").on(table.sessionId),
  ]
);

/* -------------------------------------------------------------------------- */
/*                                    Types                                   */
/* -------------------------------------------------------------------------- */

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertDonor = typeof donors.$inferInsert;
export type Donor = typeof donors.$inferSelect;

export type InsertRecipient = typeof recipients.$inferInsert;
export type Recipient = typeof recipients.$inferSelect;

export type InsertOrgan = typeof organs.$inferInsert;
export type Organ = typeof organs.$inferSelect;

export type InsertAllocation = typeof allocations.$inferInsert;
export type Allocation = typeof allocations.$inferSelect;

export type InsertTransport = typeof transports.$inferInsert;
export type Transport = typeof transports.$inferSelect;

export type InsertMessage = typeof messages.$inferInsert;
export type Message = typeof messages.$inferSelect;

export type InsertCustodyLog = typeof custodyLogs.$inferInsert;
export type CustodyLog = typeof custodyLogs.$inferSelect;

export type InsertMetric = typeof metrics.$inferInsert;
export type Metric = typeof metrics.$inferSelect;

export type InsertAuditLog = typeof auditLogs.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;

export type InsertAuthAuditLog = typeof authAuditLogs.$inferInsert;
export type AuthAuditLog = typeof authAuditLogs.$inferSelect;

/* -------------------------------------------------------------------------- */
/*                                Insert Schemas                               */
/* -------------------------------------------------------------------------- */

export const insertDonorSchema = createInsertSchema(donors).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRecipientSchema = createInsertSchema(recipients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrganSchema = createInsertSchema(organs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAllocationSchema = createInsertSchema(allocations).omit({
  id: true,
  proposedAt: true,
});

export const insertTransportSchema = createInsertSchema(transports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertCustodyLogSchema = createInsertSchema(custodyLogs).omit({
  id: true,
  timestamp: true,
});

export const insertMetricSchema = createInsertSchema(metrics).omit({ id: true });

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  timestamp: true,
});

export const insertAuthAuditLogSchema = createInsertSchema(authAuditLogs).omit({
  id: true,
  timestamp: true,
});

/* -------------------------------------------------------------------------- */
/*                              Schema Input Types                             */
/* -------------------------------------------------------------------------- */

export type InsertDonorData = z.infer<typeof insertDonorSchema>;
export type InsertRecipientData = z.infer<typeof insertRecipientSchema>;
export type InsertOrganData = z.infer<typeof insertOrganSchema>;
export type InsertAllocationData = z.infer<typeof insertAllocationSchema>;
export type InsertTransportData = z.infer<typeof insertTransportSchema>;
export type InsertMessageData = z.infer<typeof insertMessageSchema>;
export type InsertCustodyLogData = z.infer<typeof insertCustodyLogSchema>;
export type InsertMetricData = z.infer<typeof insertMetricSchema>;
export type InsertAuditLogData = z.infer<typeof insertAuditLogSchema>;
export type InsertAuthAuditLogData = z.infer<typeof insertAuthAuditLogSchema>;

/* -------------------------------------------------------------------------- */
/*                           Role and Department Types                         */
/* -------------------------------------------------------------------------- */

export type UserRole = "admin" | "coordinator" | "surgeon" | "transport";

export type Department =
  "cardiology" |
  "nephrology" |
  "hepatology" |
  "pulmonology" |
  "transplant_coordination";

/* -------------------------------------------------------------------------- */
/*                              UI-Friendly Types                              */
/* -------------------------------------------------------------------------- */

export interface UIRecipient extends Recipient {
  name: string;
  urgencyLevel: string;
  medicalId: string;
  hospital: string | null;
  medicalConditions?: string;
  compatibilityScore?: number;
}

export interface UIOrgan extends Organ {
  hlaMarkers?: string;
  specialRequirements?: string;
}
