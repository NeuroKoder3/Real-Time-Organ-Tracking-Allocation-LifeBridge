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

import { db } from "./db.js";
import { eq, and, desc, sql } from "drizzle-orm";
import { randomUUID } from "crypto"; // (currently unused, kept as-is)
import { encryptionService, PHI_FIELDS } from "./encryptionService.js";
import "./config/env";

// Interface for storage operations
export interface IStorage {
  // Search operations for encrypted fields
  searchRecipientsByName(firstName?: string, lastName?: string): Promise<Recipient[]>;
  searchDonorsByLocation(location: string): Promise<Donor[]>;
  searchRecipientsByLocation(location: string): Promise<Recipient[]>;

  // User operations for authentication
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

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
  getActiveTransports(): Promise<Transport[]>;
  createTransport(transport: InsertTransport): Promise<Transport>;
  updateTransport(id: string, updates: Partial<InsertTransport>): Promise<Transport>;

  // Message operations
  getMessages(allocationId?: string, transportId?: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageRead(id: string): Promise<Message>;

  // Chain of custody operations
  getCustodyLogs(organId: string): Promise<CustodyLog[]>;
  addCustodyLog(log: InsertCustodyLog): Promise<CustodyLog>;

  // Metrics operations
  getMetrics(period?: string): Promise<Metric[]>;
  addMetric(metric: InsertMetric): Promise<Metric>;

  // Audit logging operations - HIPAA compliant, immutable
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
  // Search operations for encrypted fields
  async searchRecipientsByName(firstName?: string, lastName?: string): Promise<Recipient[]> {
    let query = db.select().from(recipients);
    const conditions = [];

    // Use deterministic encryption to search for encrypted names
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
      query = query.where(and(...conditions)) as any;
    }

    const results = await query;

    // Decrypt PHI fields for each recipient
    return results.map((recipient) =>
      encryptionService.decryptObject(
        recipient,
        PHI_FIELDS.recipients.fields,
        PHI_FIELDS.recipients.deterministicFields
      )
    );
  }

  async searchDonorsByLocation(location: string): Promise<Donor[]> {
    // Use deterministic encryption to search for location
    const encryptedLocation = encryptionService.encryptDeterministic(location);
    if (!encryptedLocation) return [];

    const results = await db
      .select()
      .from(donors)
      .where(eq(donors.location, JSON.stringify(encryptedLocation)));

    // Decrypt PHI fields for each donor
    return results.map((donor) =>
      encryptionService.decryptObject(
        donor,
        PHI_FIELDS.donors.fields,
        PHI_FIELDS.donors.deterministicFields
      )
    );
  }

  async searchRecipientsByLocation(location: string): Promise<Recipient[]> {
    // Use deterministic encryption to search for location
    const encryptedLocation = encryptionService.encryptDeterministic(location);
    if (!encryptedLocation) return [];

    const results = await db
      .select()
      .from(recipients)
      .where(eq(recipients.location, JSON.stringify(encryptedLocation)));

    // Decrypt PHI fields for each recipient
    return results.map((recipient) =>
      encryptionService.decryptObject(
        recipient,
        PHI_FIELDS.recipients.fields,
        PHI_FIELDS.recipients.deterministicFields
      )
    );
  }

  // User operations for authentication
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // First check if user exists by email
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, userData.email || ""))
      .limit(1);

    if (existingUser.length > 0) {
      // Update existing user
      const [user] = await db
        .update(users)
        .set({
          ...userData,
          updatedAt: new Date(),
        })
        .where(eq(users.email, userData.email || ""))
        .returning();
      return user;
    } else {
      // Insert new user
      const [user] = await db.insert(users).values(userData).returning();
      return user;
    }
  }

  // Donor operations
  async getDonors(): Promise<Donor[]> {
    const donorsList = await db.select().from(donors).orderBy(desc(donors.createdAt));
    // Decrypt PHI fields for each donor
    return donorsList.map((donor) =>
      encryptionService.decryptObject(donor, PHI_FIELDS.donors.fields, PHI_FIELDS.donors.deterministicFields)
    );
  }

  async getDonor(id: string): Promise<Donor | undefined> {
    const [donor] = await db.select().from(donors).where(eq(donors.id, id));
    if (donor) {
      return encryptionService.decryptObject(donor, PHI_FIELDS.donors.fields, PHI_FIELDS.donors.deterministicFields);
    }
    return donor;
  }

  async createDonor(donorData: InsertDonor): Promise<Donor> {
    // Encrypt PHI fields before inserting
    const encryptedData = encryptionService.encryptObject(
      donorData,
      PHI_FIELDS.donors.fields,
      PHI_FIELDS.donors.deterministicFields
    );
    const [donor] = await db.insert(donors).values(encryptedData).returning();
    // Decrypt before returning
    return encryptionService.decryptObject(donor, PHI_FIELDS.donors.fields, PHI_FIELDS.donors.deterministicFields);
  }

  async updateDonor(id: string, updates: Partial<InsertDonor>): Promise<Donor> {
    // Encrypt PHI fields in updates
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
    // Decrypt before returning
    return encryptionService.decryptObject(donor, PHI_FIELDS.donors.fields, PHI_FIELDS.donors.deterministicFields);
  }

  // Recipient operations
  async getRecipients(): Promise<Recipient[]> {
    const recipientsList = await db.select().from(recipients).orderBy(recipients.waitlistDate);
    // Decrypt PHI fields for each recipient
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
    return recipient;
  }

  async getWaitingRecipients(organType: string): Promise<Recipient[]> {
    const recipientsList = await db
      .select()
      .from(recipients)
      .where(and(eq(recipients.organNeeded, organType), eq(recipients.status, "waiting")))
      .orderBy(recipients.urgencyStatus, recipients.waitlistDate);

    // Decrypt PHI fields for each recipient
    return recipientsList.map((recipient) =>
      encryptionService.decryptObject(
        recipient,
        PHI_FIELDS.recipients.fields,
        PHI_FIELDS.recipients.deterministicFields
      )
    );
  }

  async createRecipient(recipientData: InsertRecipient): Promise<Recipient> {
    // Encrypt PHI fields before inserting
    const encryptedData = encryptionService.encryptObject(
      recipientData,
      PHI_FIELDS.recipients.fields,
      PHI_FIELDS.recipients.deterministicFields
    );
    const [recipient] = await db.insert(recipients).values(encryptedData).returning();
    // Decrypt before returning
    return encryptionService.decryptObject(
      recipient,
      PHI_FIELDS.recipients.fields,
      PHI_FIELDS.recipients.deterministicFields
    );
  }

  async updateRecipient(id: string, updates: Partial<InsertRecipient>): Promise<Recipient> {
    // Encrypt PHI fields in updates
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
    // Decrypt before returning
    return encryptionService.decryptObject(
      recipient,
      PHI_FIELDS.recipients.fields,
      PHI_FIELDS.recipients.deterministicFields
    );
  }

  // Organ operations
  async getOrgans(): Promise<Organ[]> {
    return await db.select().from(organs).orderBy(desc(organs.createdAt));
  }

  async getOrgan(id: string): Promise<Organ | undefined> {
    const [organ] = await db.select().from(organs).where(eq(organs.id, id));
    return organ;
  }

  async getAvailableOrgans(): Promise<Organ[]> {
    return await db
      .select()
      .from(organs)
      .where(eq(organs.status, "available"))
      .orderBy(organs.viabilityDeadline);
  }

  async getOrgansByDonor(donorId: string): Promise<Organ[]> {
    return await db.select().from(organs).where(eq(organs.donorId, donorId));
  }

  async createOrgan(organData: InsertOrgan): Promise<Organ> {
    const [organ] = await db.insert(organs).values(organData).returning();
    return organ;
  }

  async updateOrgan(id: string, updates: Partial<InsertOrgan>): Promise<Organ> {
    const [organ] = await db
      .update(organs)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(organs.id, id))
      .returning();
    return organ;
  }

  // Allocation operations
  async getAllocations(): Promise<Allocation[]> {
    return await db.select().from(allocations).orderBy(desc(allocations.proposedAt));
  }

  async getAllocation(id: string): Promise<Allocation | undefined> {
    const [allocation] = await db.select().from(allocations).where(eq(allocations.id, id));
    return allocation;
  }

  async getAllocationsByOrgan(organId: string): Promise<Allocation[]> {
    return await db
      .select()
      .from(allocations)
      .where(eq(allocations.organId, organId))
      .orderBy(allocations.priority);
  }

  async getAllocationsByRecipient(recipientId: string): Promise<Allocation[]> {
    return await db
      .select()
      .from(allocations)
      .where(eq(allocations.recipientId, recipientId))
      .orderBy(desc(allocations.proposedAt));
  }

  async createAllocation(allocationData: InsertAllocation): Promise<Allocation> {
    const [allocation] = await db.insert(allocations).values(allocationData).returning();
    return allocation;
  }

  async updateAllocation(id: string, updates: Partial<InsertAllocation>): Promise<Allocation> {
    const [allocation] = await db.update(allocations).set(updates).where(eq(allocations.id, id)).returning();
    return allocation;
  }

  // Transport operations
  async getTransports(): Promise<Transport[]> {
    return await db.select().from(transports).orderBy(desc(transports.createdAt));
  }

  async getTransport(id: string): Promise<Transport | undefined> {
    const [transport] = await db.select().from(transports).where(eq(transports.id, id));
    return transport;
  }

  async getActiveTransports(): Promise<Transport[]> {
    return await db
      .select()
      .from(transports)
      .where(sql`${transports.status} IN ('scheduled', 'in_progress')`)
      .orderBy(transports.scheduledPickup);
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

  // Message operations
  async getMessages(allocationId?: string, transportId?: string): Promise<Message[]> {
    let query = db.select().from(messages);

    if (allocationId) {
      query = query.where(eq(messages.allocationId, allocationId)) as any;
    } else if (transportId) {
      query = query.where(eq(messages.transportId, transportId)) as any;
    }

    const messagesList = await query.orderBy(desc(messages.createdAt));
    // Decrypt PHI fields for each message
    return messagesList.map((message) =>
      encryptionService.decryptObject(
        message,
        PHI_FIELDS.messages.fields,
        PHI_FIELDS.messages.deterministicFields
      )
    );
  }

  async createMessage(messageData: InsertMessage): Promise<Message> {
    // Encrypt PHI fields before inserting
    const encryptedData = encryptionService.encryptObject(
      messageData,
      PHI_FIELDS.messages.fields,
      PHI_FIELDS.messages.deterministicFields
    );
    const [message] = await db.insert(messages).values(encryptedData).returning();
    // Decrypt before returning
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

  // Chain of custody operations
  async getCustodyLogs(organId: string): Promise<CustodyLog[]> {
    const logs = await db.select().from(custodyLogs).where(eq(custodyLogs.organId, organId));
    // Decrypt PHI fields for each log
    return logs.map((log) =>
      encryptionService.decryptObject(
        log,
        PHI_FIELDS.custodyLogs.fields,
        PHI_FIELDS.custodyLogs.deterministicFields
      )
    );
  }

  async addCustodyLog(logData: InsertCustodyLog): Promise<CustodyLog> {
    // Encrypt PHI fields before inserting
    const encryptedData = encryptionService.encryptObject(
      logData,
      PHI_FIELDS.custodyLogs.fields,
      PHI_FIELDS.custodyLogs.deterministicFields
    );
    const [log] = await db.insert(custodyLogs).values(encryptedData).returning();
    // Decrypt before returning
    return encryptionService.decryptObject(
      log,
      PHI_FIELDS.custodyLogs.fields,
      PHI_FIELDS.custodyLogs.deterministicFields
    );
  }

  // Metrics operations
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

  // Audit logging operations - HIPAA compliant, immutable
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
    const conditions = [];

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
      query = query.where(and(...conditions)) as any;
    }

    return await query.orderBy(desc(auditLogs.timestamp));
  }

  async getAuthAuditLogs(filter?: {
    userId?: string;
    eventType?: string;
    startDate?: Date;
    endDate?: Date;
    sessionId?: string;
  }): Promise<AuthAuditLog[]> {
    let query = db.select().from(authAuditLogs);
    const conditions = [];

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
      query = query.where(and(...conditions)) as any;
    }

    return await query.orderBy(desc(authAuditLogs.timestamp));
  }
}

// ✅ Named export (existing) AND default export (new)
export const storage = new DatabaseStorage();
export default storage;
