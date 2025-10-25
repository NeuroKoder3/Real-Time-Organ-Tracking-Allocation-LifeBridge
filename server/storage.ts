// LifeBridge storage layer - includes auth functionality and organ tracking operations

import {
  users,
  donors,
  recipients,
  organs,
  allocations,
  transports,
  messages,
  custodyLogs,
  metrics,
  auditLogs,
  authAuditLogs,
  type User,
  type UpsertUser,
  type Donor,
  type InsertDonor,
  type Recipient,
  type InsertRecipient,
  type Organ,
  type InsertOrgan,
  type Allocation,
  type InsertAllocation,
  type Transport,
  type InsertTransport,
  type Message,
  type InsertMessage,
  type CustodyLog,
  type InsertCustodyLog,
  type Metric,
  type InsertMetric,
  type AuditLog,
  type InsertAuditLog,
  type AuthAuditLog,
  type InsertAuthAuditLog,
} from "../shared/schema.js";

import db from "./db.js";
import { eq, and, desc, sql } from "drizzle-orm";
import { encryptionService, PHI_FIELDS } from "./encryptionService.js";
import "./config/env.js";

// Interface for storage operations
export interface IStorage {
  // Search operations
  searchRecipientsByName(firstName?: string, lastName?: string): Promise<Recipient[]>;
  searchDonorsByLocation(location: string): Promise<Donor[]>;
  searchRecipientsByLocation(location: string): Promise<Recipient[]>;

  // User / auth operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<UpsertUser>): Promise<User>;

  // Donor operations
  getDonors(): Promise<Donor[]>;
  getDonor(id: string): Promise<Donor | undefined>;
  createDonor(donor: InsertDonor): Promise<Donor>;
  updateDonor(id: string, updates: Partial<InsertDonor>): Promise<Donor>;

  // Recipient operations
  getRecipients(): Promise<Recipient[]>;
  getRecipient(id: string): Promise<Recipient | undefined>;
  getWaitingRecipients(organType: string): Promise<Recipient[]>;
  createRecipient(recipient: InsertRecipient): Promise<Recipient>;
  updateRecipient(id: string, updates: Partial<InsertRecipient>): Promise<Recipient>;

  // Organ operations
  getOrgans(): Promise<Organ[]>;
  getOrgan(id: string): Promise<Organ | undefined>;
  getAvailableOrgans(): Promise<Organ[]>;
  getOrgansByDonor(donorId: string): Promise<Organ[]>;
  createOrgan(organ: InsertOrgan): Promise<Organ>;
  updateOrgan(id: string, updates: Partial<InsertOrgan>): Promise<Organ>;

  // Allocation operations
  getAllocations(): Promise<Allocation[]>;
  getAllocation(id: string): Promise<Allocation | undefined>;
  getAllocationsByOrgan(organId: string): Promise<Allocation[]>;
  getAllocationsByRecipient(recipientId: string): Promise<Allocation[]>;
  createAllocation(allocation: InsertAllocation): Promise<Allocation>;
  updateAllocation(id: string, updates: Partial<InsertAllocation>): Promise<Allocation>;

  // Transport operations
  getTransports(): Promise<Transport[]>;
  getTransport(id: string): Promise<Transport | undefined>;
  getActiveTransports(): Promise<(Transport & { currentLat: number; currentLng: number })[]>;
  createTransport(transport: InsertTransport): Promise<Transport>;
  updateTransport(id: string, updates: Partial<InsertTransport>): Promise<Transport>;

  // Message operations
  getMessages(allocationId?: string, transportId?: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageRead(id: string): Promise<Message>;

  // Chain of custody
  getCustodyLogs(organId: string): Promise<CustodyLog[]>;
  addCustodyLog(log: InsertCustodyLog): Promise<CustodyLog>;

  // Metrics
  getMetrics(period?: string): Promise<Metric[]>;
  addMetric(metric: InsertMetric): Promise<Metric>;

  // Audit logs
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  createAuthAuditLog(log: InsertAuthAuditLog): Promise<AuthAuditLog>;
  getAuditLogs(filter?: {
    userId?: string;
    entityType?: string;
    entityId?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    sessionId?: string;
  }): Promise<AuditLog[]>;
  getAuthAuditLogs(filter?: {
    userId?: string;
    eventType?: string;
    startDate?: Date;
    endDate?: Date;
    sessionId?: string;
  }): Promise<AuthAuditLog[]>;
}

export class DatabaseStorage implements IStorage {
  // Search operations
  async searchRecipientsByName(firstName?: string, lastName?: string): Promise<Recipient[]> {
    let query = db.select().from(recipients);
    const conditions: unknown[] = [];

    if (firstName) {
      const encryptedFirstName = encryptionService.encryptDeterministic(firstName);
      if (encryptedFirstName) {
        conditions.push(eq(recipients.firstName, JSON.stringify(encryptedFirstName)));
      }
    }
    if (lastName) {
      const encryptedLastName = encryptionService.encryptDeterministic(lastName);
      if (encryptedLastName) {
        conditions.push(eq(recipients.lastName, JSON.stringify(encryptedLastName)));
      }
    }
    if (conditions.length > 0) {
      query = (query.where(and(...(conditions as any[]))) as any);
    }
    const results = await query;
    return results.map((recipient) =>
      encryptionService.decryptObject(
        recipient,
        PHI_FIELDS.recipients.fields,
        PHI_FIELDS.recipients.deterministicFields
      )
    );
  }

  async searchDonorsByLocation(location: string): Promise<Donor[]> {
    const encryptedLocation = encryptionService.encryptDeterministic(location);
    if (!encryptedLocation) return [];
    const results = await db
      .select()
      .from(donors)
      .where(eq(donors.location, JSON.stringify(encryptedLocation)));
    return results.map((donor) =>
      encryptionService.decryptObject(
        donor,
        PHI_FIELDS.donors.fields,
        PHI_FIELDS.donors.deterministicFields
      )
    );
  }

  async searchRecipientsByLocation(location: string): Promise<Recipient[]> {
    const encryptedLocation = encryptionService.encryptDeterministic(location);
    if (!encryptedLocation) return [];
    const results = await db
      .select()
      .from(recipients)
      .where(eq(recipients.location, JSON.stringify(encryptedLocation)));
    return results.map((recipient) =>
      encryptionService.decryptObject(
        recipient,
        PHI_FIELDS.recipients.fields,
        PHI_FIELDS.recipients.deterministicFields
      )
    );
  }

  // ========== USER / AUTH OPERATIONS ==========

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(userData).returning();
    return newUser;
  }

  async updateUser(id: string, updates: Partial<UpsertUser>): Promise<User> {
    const [updated] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  // ========== DONOR OPERATIONS ==========

  async getDonors(): Promise<Donor[]> {
    const donorsList = await db.select().from(donors).orderBy(desc(donors.createdAt));
    return donorsList.map((donor) =>
      encryptionService.decryptObject(
        donor,
        PHI_FIELDS.donors.fields,
        PHI_FIELDS.donors.deterministicFields
      )
    );
  }

  async getDonor(id: string): Promise<Donor | undefined> {
    const [donor] = await db.select().from(donors).where(eq(donors.id, id));
    if (donor) {
      return encryptionService.decryptObject(
        donor,
        PHI_FIELDS.donors.fields,
        PHI_FIELDS.donors.deterministicFields
      );
    }
    return undefined;
  }

  async createDonor(donorData: InsertDonor): Promise<Donor> {
    const encryptedData = encryptionService.encryptObject(
      donorData,
      PHI_FIELDS.donors.fields,
      PHI_FIELDS.donors.deterministicFields
    );
    const [donor] = await db.insert(donors).values(encryptedData).returning();
    return encryptionService.decryptObject(
      donor,
      PHI_FIELDS.donors.fields,
      PHI_FIELDS.donors.deterministicFields
    );
  }

  async updateDonor(id: string, updates: Partial<InsertDonor>): Promise<Donor> {
    const encryptedUpdates = encryptionService.encryptObject(
      updates,
      PHI_FIELDS.donors.fields,
      PHI_FIELDS.donors.deterministicFields
    );
    const [donor] = await db
      .update(donors)
      .set({ ...encryptedUpdates, updatedAt: new Date() })
      .where(eq(donors.id, id))
      .returning();
    return encryptionService.decryptObject(
      donor,
      PHI_FIELDS.donors.fields,
      PHI_FIELDS.donors.deterministicFields
    );
  }

  // ========== RECIPIENT OPERATIONS ==========

  async getRecipients(): Promise<Recipient[]> {
    const recipientsList = await db.select().from(recipients).orderBy(recipients.waitlistDate);
    return recipientsList.map((recipient) =>
      encryptionService.decryptObject(
        recipient,
        PHI_FIELDS.recipients.fields,
        PHI_FIELDS.recipients.deterministicFields
      )
    );
  }

  async getRecipient(id: string): Promise<Recipient | undefined> {
    const [recipient] = await db.select().from(recipients).where(eq(recipients.id, id));
    if (recipient) {
      return encryptionService.decryptObject(
        recipient,
        PHI_FIELDS.recipients.fields,
        PHI_FIELDS.recipients.deterministicFields
      );
    }
    return undefined;
  }

  async getWaitingRecipients(organType: string): Promise<Recipient[]> {
    const recipientsList = await db
      .select()
      .from(recipients)
      .where(and(eq(recipients.organNeeded, organType), eq(recipients.status, "waiting")))
      .orderBy(recipients.urgencyStatus, recipients.waitlistDate);
    return recipientsList.map((recipient) =>
      encryptionService.decryptObject(
        recipient,
        PHI_FIELDS.recipients.fields,
        PHI_FIELDS.recipients.deterministicFields
      )
    );
  }

  async createRecipient(recipientData: InsertRecipient): Promise<Recipient> {
    const encryptedData = encryptionService.encryptObject(
      recipientData,
      PHI_FIELDS.recipients.fields,
      PHI_FIELDS.recipients.deterministicFields
    );
    const [recipient] = await db.insert(recipients).values(encryptedData).returning();
    return encryptionService.decryptObject(
      recipient,
      PHI_FIELDS.recipients.fields,
      PHI_FIELDS.recipients.deterministicFields
    );
  }

  async updateRecipient(id: string, updates: Partial<InsertRecipient>): Promise<Recipient> {
    const encryptedUpdates = encryptionService.encryptObject(
      updates,
      PHI_FIELDS.recipients.fields,
      PHI_FIELDS.recipients.deterministicFields
    );
    const [recipient] = await db
      .update(recipients)
      .set({ ...encryptedUpdates, updatedAt: new Date() })
      .where(eq(recipients.id, id))
      .returning();
    return encryptionService.decryptObject(
      recipient,
      PHI_FIELDS.recipients.fields,
      PHI_FIELDS.recipients.deterministicFields
    );
  }

  // ========== ORGAN OPERATIONS ==========

  async getOrgans(): Promise<Organ[]> {
    const organsList = await db.select().from(organs).orderBy(desc(organs.createdAt));
    return organsList;
  }

  async getOrgan(id: string): Promise<Organ | undefined> {
    const [organ] = await db.select().from(organs).where(eq(organs.id, id));
    return organ;
  }

  async getAvailableOrgans(): Promise<Organ[]> {
    const avail = await db
      .select()
      .from(organs)
      .where(eq(organs.status, "available"))
      .orderBy(organs.viabilityDeadline);
    return avail;
  }

  async getOrgansByDonor(donorId: string): Promise<Organ[]> {
    const organsList = await db.select().from(organs).where(eq(organs.donorId, donorId));
    return organsList;
  }

async createOrgan(organData: InsertOrgan): Promise<Organ> {
  try {
    const preservationStartTime = new Date(organData.preservationStartTime);
    const viabilityDeadline =
      organData.viabilityDeadline ??
      new Date(preservationStartTime.getTime() + organData.viabilityHours * 60 * 60 * 1000).toISOString();

    const mappedData = {
      donor_id: organData.donorId,
      organ_type: organData.organType,
      blood_type: organData.bloodType,
      condition: organData.condition ?? "healthy",
      status: organData.status ?? "available",
      viability_hours: organData.viabilityHours,
      preservation_start_time: organData.preservationStartTime,
      viability_deadline: viabilityDeadline,
      current_location: organData.currentLocation,
      temperature: organData.temperature ?? 4.0,
      preservation_solution: organData.preservationSolution ?? "UW Solution",
      quality_score: organData.qualityScore ?? "A",
      biopsy_results: organData.biopsyResults ?? {},
      crossmatch_data: organData.crossmatchData ?? {},
      created_at: new Date(),
    };

    const [organ] = await db
      .insert(organs)
      .values(mappedData as any)
      .returning();

    return organ;
  } catch (err) {
    console.error("[Storage] createOrgan DB error:", err);
    throw err;
  }
}



  async updateOrgan(id: string, updates: Partial<InsertOrgan>): Promise<Organ> {
    const [organ] = await db
      .update(organs)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(organs.id, id))
      .returning();
    return organ;
  }

  // ========== ALLOCATION OPERATIONS ==========

  async getAllocations(): Promise<Allocation[]> {
    const allocationsList = await db.select().from(allocations).orderBy(desc(allocations.proposedAt));
    return allocationsList;
  }

  async getAllocation(id: string): Promise<Allocation | undefined> {
    const [allocation] = await db.select().from(allocations).where(eq(allocations.id, id));
    return allocation;
  }

  async getAllocationsByOrgan(organId: string): Promise<Allocation[]> {
    const results = await db
      .select()
      .from(allocations)
      .where(eq(allocations.organId, organId))
      .orderBy(allocations.priority);
    return results;
  }

  async getAllocationsByRecipient(recipientId: string): Promise<Allocation[]> {
    const results = await db
      .select()
      .from(allocations)
      .where(eq(allocations.recipientId, recipientId))
      .orderBy(desc(allocations.proposedAt));
    return results;
  }

  async createAllocation(allocationData: InsertAllocation): Promise<Allocation> {
    const [allocation] = await db.insert(allocations).values(allocationData).returning();
    return allocation;
  }

  async updateAllocation(id: string, updates: Partial<InsertAllocation>): Promise<Allocation> {
    const [allocation] = await db
      .update(allocations)
      .set(updates)
      .where(eq(allocations.id, id))
      .returning();
    return allocation;
  }

  // ========== TRANSPORT OPERATIONS ==========

  async getTransports(): Promise<Transport[]> {
    const transportsList = await db.select().from(transports).orderBy(desc(transports.createdAt));
    return transportsList;
  }

  async getTransport(id: string): Promise<Transport | undefined> {
    const [transport] = await db.select().from(transports).where(eq(transports.id, id));
    return transport;
  }

  async getActiveTransports(): Promise<(Transport & { currentLat: number; currentLng: number })[]> {
  const results = await db
    .select()
    .from(transports)
    .where(sql`${transports.status} IN ('scheduled', 'in_progress')`)
    .orderBy(transports.scheduledPickup);

  return results.map((t, i) => ({
    ...(t as Transport),
    currentLat: (t as any).currentLat ?? (37.7749 + i * 0.01),
    currentLng: (t as any).currentLng ?? (-122.4194 + i * 0.01),
  }));
}


  async createTransport(transportData: InsertTransport): Promise<Transport> {
    const [transport] = await db.insert(transports).values(transportData).returning();
    return transport;
  }

  async updateTransport(id: string, updates: Partial<InsertTransport>): Promise<Transport> {
    const [transport] = await db
      .update(transports)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(transports.id, id))
      .returning();
    return transport;
  }

  // ========== MESSAGE OPERATIONS ==========

  async getMessages(allocationId?: string, transportId?: string): Promise<Message[]> {
    let query = db.select().from(messages);
    if (allocationId) {
      query = (query.where(eq(messages.allocationId, allocationId)) as any);
    } else if (transportId) {
      query = (query.where(eq(messages.transportId, transportId)) as any);
    }
    const messagesList = await query.orderBy(desc(messages.createdAt));
    return messagesList.map((msg) =>
      encryptionService.decryptObject(
        msg,
        PHI_FIELDS.messages.fields,
        PHI_FIELDS.messages.deterministicFields
      )
    );
  }

  async createMessage(messageData: InsertMessage): Promise<Message> {
    const encryptedData = encryptionService.encryptObject(
      messageData,
      PHI_FIELDS.messages.fields,
      PHI_FIELDS.messages.deterministicFields
    );
    const [message] = await db.insert(messages).values(encryptedData).returning();
    return encryptionService.decryptObject(
      message,
      PHI_FIELDS.messages.fields,
      PHI_FIELDS.messages.deterministicFields
    );
  }

  async markMessageRead(id: string): Promise<Message> {
    const [message] = await db.update(messages).set({ isRead: true }).where(eq(messages.id, id)).returning();
    return message;
  }

  // ========== CHAIN OF CUSTODY ==========

  async getCustodyLogs(organId: string): Promise<CustodyLog[]> {
    const logs = await db.select().from(custodyLogs).where(eq(custodyLogs.organId, organId));
    return logs.map((log) =>
      encryptionService.decryptObject(
        log,
        PHI_FIELDS.custodyLogs.fields,
        PHI_FIELDS.custodyLogs.deterministicFields
      )
    );
  }

  async addCustodyLog(logData: InsertCustodyLog): Promise<CustodyLog> {
    const encryptedData = encryptionService.encryptObject(
      logData,
      PHI_FIELDS.custodyLogs.fields,
      PHI_FIELDS.custodyLogs.deterministicFields
    );
    const [log] = await db.insert(custodyLogs).values(encryptedData).returning();
    return encryptionService.decryptObject(
      log,
      PHI_FIELDS.custodyLogs.fields,
      PHI_FIELDS.custodyLogs.deterministicFields
    );
  }

  // ========== METRICS ==========

  async getMetrics(period?: string): Promise<Metric[]> {
    if (period) {
      return await db.select().from(metrics).where(eq(metrics.period, period));
    }
    return await db.select().from(metrics);
  }

  async addMetric(metricData: InsertMetric): Promise<Metric> {
    const [metric] = await db.insert(metrics).values(metricData).returning();
    return metric;
  }

  // ========== AUDIT LOGS ==========

  async createAuditLog(logData: InsertAuditLog): Promise<AuditLog> {
    const [log] = await db.insert(auditLogs).values(logData).returning();
    return log;
  }

  async createAuthAuditLog(logData: InsertAuthAuditLog): Promise<AuthAuditLog> {
    const [log] = await db.insert(authAuditLogs).values(logData).returning();
    return log;
  }

  async getAuditLogs(filter?: {
    userId?: string;
    entityType?: string;
    entityId?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    sessionId?: string;
  }): Promise<AuditLog[]> {
    let query = db.select().from(auditLogs);
    const conditions: unknown[] = [];

    if (filter?.userId) {
      conditions.push(eq(auditLogs.userId, filter.userId));
    }
    if (filter?.entityType) {
      conditions.push(eq(auditLogs.entityType, filter.entityType));
    }
    if (filter?.entityId) {
      conditions.push(eq(auditLogs.entityId, filter.entityId));
    }
    if (filter?.action) {
      conditions.push(eq(auditLogs.action, filter.action));
    }
    if (filter?.sessionId) {
      conditions.push(eq(auditLogs.sessionId, filter.sessionId));
    }
    if (filter?.startDate) {
      conditions.push(sql`${auditLogs.timestamp} >= ${filter.startDate}`);
    }
    if (filter?.endDate) {
      conditions.push(sql`${auditLogs.timestamp} <= ${filter.endDate}`);
    }

    if (conditions.length > 0) {
      query = (query.where(and(...(conditions as any[]))) as any);
    }
    const logs = await query.orderBy(desc(auditLogs.timestamp));
    return logs;
  }

  async getAuthAuditLogs(filter?: {
    userId?: string;
    eventType?: string;
    startDate?: Date;
    endDate?: Date;
    sessionId?: string;
  }): Promise<AuthAuditLog[]> {
    let query = db.select().from(authAuditLogs);
    const conditions: unknown[] = [];

    if (filter?.userId) {
      conditions.push(eq(authAuditLogs.userId, filter.userId));
    }
    if (filter?.eventType) {
      conditions.push(eq(authAuditLogs.eventType, filter.eventType));
    }
    if (filter?.sessionId) {
      conditions.push(eq(authAuditLogs.sessionId, filter.sessionId));
    }
    if (filter?.startDate) {
      conditions.push(sql`${authAuditLogs.timestamp} >= ${filter.startDate}`);
    }
    if (filter?.endDate) {
      conditions.push(sql`${authAuditLogs.timestamp} <= ${filter.endDate}`);
    }

    if (conditions.length > 0) {
      query = (query.where(and(...(conditions as any[]))) as any);
    }
    const authLogs = await query.orderBy(desc(authAuditLogs.timestamp));
    return authLogs;
  }
}

// Named export
export const storage = new DatabaseStorage();
export default storage;
