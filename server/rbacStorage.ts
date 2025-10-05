import {
  type IStorage,
} from "./storage.js";
import {
  type UpsertUser,
  type User,
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

/**
 * RBACStorage wraps a storage instance and enforces role-based access control.
 * It delegates to the underlying storage but checks the userRole first.
 */
export class RBACStorage implements IStorage {
  constructor(
    private storage: IStorage,
    private userRole: string,
    private userId: string
  ) {}

  // ✅ New methods required by IStorage (added in your new storage.ts)
  async getUserByEmail(email: string) {
    return await this.storage.getUserByEmail(email);
  }

  async createUser(user: UpsertUser) {
    return await this.storage.createUser(user);
  }

  async updateUser(id: string, updates: Partial<UpsertUser>) {
    return await this.storage.updateUser(id, updates);
  }

  // ✅ Existing methods from IStorage
  async getUser(id: string): Promise<User | undefined> {
    // only admins can get arbitrary users; others can only get themselves
    if (this.userRole !== "admin" && this.userId !== id) {
      throw new Error("Forbidden");
    }
    return this.storage.getUser(id);
  }

  // ✅ Replace upsertUser logic with create or update depending on existence
  async upsertUser(user: UpsertUser): Promise<User> {
    if (this.userRole !== "admin") {
      throw new Error("Forbidden");
    }

    const existing = user.email
      ? await this.storage.getUserByEmail(user.email)
      : undefined;

    if (existing) {
      return await this.storage.updateUser(existing.id, user);
    } else {
      return await this.storage.createUser(user);
    }
  }

  // Donor operations
  async getDonors(): Promise<Donor[]> {
    return this.storage.getDonors();
  }

  async getDonor(id: string): Promise<Donor | undefined> {
    return this.storage.getDonor(id);
  }

  async createDonor(donor: InsertDonor): Promise<Donor> {
    if (this.userRole === "clinician" || this.userRole === "coordinator" || this.userRole === "admin") {
      return this.storage.createDonor(donor);
    }
    throw new Error("Forbidden");
  }

  async updateDonor(id: string, updates: Partial<InsertDonor>): Promise<Donor> {
    if (this.userRole === "clinician" || this.userRole === "coordinator" || this.userRole === "admin") {
      return this.storage.updateDonor(id, updates);
    }
    throw new Error("Forbidden");
  }

  // Recipient operations
  async getRecipients(): Promise<Recipient[]> {
    return this.storage.getRecipients();
  }

  async getRecipient(id: string): Promise<Recipient | undefined> {
    return this.storage.getRecipient(id);
  }

  async getWaitingRecipients(organType: string): Promise<Recipient[]> {
    return this.storage.getWaitingRecipients(organType);
  }

  async createRecipient(recipient: InsertRecipient): Promise<Recipient> {
    if (this.userRole === "clinician" || this.userRole === "coordinator" || this.userRole === "admin") {
      return this.storage.createRecipient(recipient);
    }
    throw new Error("Forbidden");
  }

  async updateRecipient(id: string, updates: Partial<InsertRecipient>): Promise<Recipient> {
    if (this.userRole === "clinician" || this.userRole === "coordinator" || this.userRole === "admin") {
      return this.storage.updateRecipient(id, updates);
    }
    throw new Error("Forbidden");
  }

  // Organ operations
  async getOrgans(): Promise<Organ[]> {
    return this.storage.getOrgans();
  }

  async getOrgan(id: string): Promise<Organ | undefined> {
    return this.storage.getOrgan(id);
  }

  async getAvailableOrgans(): Promise<Organ[]> {
    return this.storage.getAvailableOrgans();
  }

  async getOrgansByDonor(donorId: string): Promise<Organ[]> {
    return this.storage.getOrgansByDonor(donorId);
  }

  async createOrgan(organ: InsertOrgan): Promise<Organ> {
    if (this.userRole === "clinician" || this.userRole === "coordinator" || this.userRole === "admin") {
      return this.storage.createOrgan(organ);
    }
    throw new Error("Forbidden");
  }

  async updateOrgan(id: string, updates: Partial<InsertOrgan>): Promise<Organ> {
    if (this.userRole === "clinician" || this.userRole === "coordinator" || this.userRole === "admin") {
      return this.storage.updateOrgan(id, updates);
    }
    throw new Error("Forbidden");
  }

  // Allocation operations
  async getAllocations(): Promise<Allocation[]> {
    return this.storage.getAllocations();
  }

  async getAllocation(id: string): Promise<Allocation | undefined> {
    return this.storage.getAllocation(id);
  }

  async getAllocationsByOrgan(organId: string): Promise<Allocation[]> {
    return this.storage.getAllocationsByOrgan(organId);
  }

  async getAllocationsByRecipient(recipientId: string): Promise<Allocation[]> {
    return this.storage.getAllocationsByRecipient(recipientId);
  }

  async createAllocation(allocation: InsertAllocation): Promise<Allocation> {
    if (this.userRole === "coordinator" || this.userRole === "admin") {
      return this.storage.createAllocation(allocation);
    }
    throw new Error("Forbidden");
  }

  async updateAllocation(id: string, updates: Partial<InsertAllocation>): Promise<Allocation> {
    if (this.userRole === "coordinator" || this.userRole === "admin") {
      return this.storage.updateAllocation(id, updates);
    }
    throw new Error("Forbidden");
  }

  // Transport operations
  async getTransports(): Promise<Transport[]> {
    return this.storage.getTransports();
  }

  async getTransport(id: string): Promise<Transport | undefined> {
    return this.storage.getTransport(id);
  }

  async getActiveTransports(): Promise<Transport[]> {
    return this.storage.getActiveTransports();
  }

  async createTransport(transport: InsertTransport): Promise<Transport> {
    if (this.userRole === "coordinator" || this.userRole === "admin") {
      return this.storage.createTransport(transport);
    }
    throw new Error("Forbidden");
  }

  async updateTransport(id: string, updates: Partial<InsertTransport>): Promise<Transport> {
    if (this.userRole === "coordinator" || this.userRole === "admin") {
      return this.storage.updateTransport(id, updates);
    }
    throw new Error("Forbidden");
  }

  // Message operations
  async getMessages(allocationId?: string, transportId?: string): Promise<Message[]> {
    return this.storage.getMessages(allocationId, transportId);
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    return this.storage.createMessage(message);
  }

  async markMessageRead(id: string): Promise<Message> {
    return this.storage.markMessageRead(id);
  }

  // Chain of custody operations
  async getCustodyLogs(organId: string): Promise<CustodyLog[]> {
    return this.storage.getCustodyLogs(organId);
  }

  async addCustodyLog(log: InsertCustodyLog): Promise<CustodyLog> {
    return this.storage.addCustodyLog(log);
  }

  // Metrics operations
  async getMetrics(period?: string): Promise<Metric[]> {
    return this.storage.getMetrics(period);
  }

  async addMetric(metric: InsertMetric): Promise<Metric> {
    return this.storage.addMetric(metric);
  }

  // Audit logs
  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    return this.storage.createAuditLog(log);
  }

  async createAuthAuditLog(log: InsertAuthAuditLog): Promise<AuthAuditLog> {
    return this.storage.createAuthAuditLog(log);
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
    return this.storage.getAuditLogs(filter);
  }

  async getAuthAuditLogs(filter?: {
    userId?: string;
    eventType?: string;
    startDate?: Date;
    endDate?: Date;
    sessionId?: string;
  }): Promise<AuthAuditLog[]> {
    return this.storage.getAuthAuditLogs(filter);
  }

  // Search methods pass through
  async searchRecipientsByName(firstName?: string, lastName?: string): Promise<Recipient[]> {
    return this.storage.searchRecipientsByName(firstName, lastName);
  }

  async searchDonorsByLocation(location: string): Promise<Donor[]> {
    return this.storage.searchDonorsByLocation(location);
  }

  async searchRecipientsByLocation(location: string): Promise<Recipient[]> {
    return this.storage.searchRecipientsByLocation(location);
  }
}

// ✅ factory
export function createRBACStorage(storage: IStorage, userRole: string, userId: string) {
  return new RBACStorage(storage, userRole, userId);
}
