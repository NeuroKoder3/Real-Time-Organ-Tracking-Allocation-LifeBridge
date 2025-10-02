// server/auditedStorage.ts
// Enhanced storage layer with integrated audit logging for HIPAA compliance

import { DatabaseStorage } from "./storage.js"; // <-- must be a VALUE import (not `import type`)
import type {
  InsertDonor,
  Donor,
  InsertRecipient,
  Recipient,
  InsertOrgan,
  Organ,
  InsertAllocation,
  Allocation,
  InsertTransport,
  Transport,
  InsertAuditLog,
} from "../shared/schema.js";

export class AuditedDatabaseStorage extends DatabaseStorage {
  // Helper to create audit log for data modifications
  private async auditDataChange(
    userId: string | null,
    action: string,
    entityType: string,
    entityId: string | null,
    previousValues?: any,
    newValues?: any,
    metadata?: any
  ) {
    const auditLog: InsertAuditLog = {
      userId,
      userEmail: null, // Will be filled by middleware
      userRole: null,  // Will be filled by middleware
      userName: null,  // Will be filled by middleware
      sessionId: metadata?.sessionId || "system",
      ipAddress: metadata?.ipAddress || "system",
      userAgent: metadata?.userAgent || "system",
      httpMethod: null,
      endpoint: null,
      action,
      actionCategory: "data_modification",
      entityType,
      entityId,
      previousValues,
      newValues,
      changedFields:
        previousValues && newValues
          ? Object.keys(newValues).filter(
              (key) =>
                JSON.stringify(previousValues[key]) !==
                JSON.stringify(newValues[key])
            )
          : null,
      success: true,
      phiAccessed: true,
      metadata,
    };

    await this.createAuditLog(auditLog);
  }

  // Override donor methods with audit logging
  async updateDonor(
    id: string,
    updates: Partial<InsertDonor>,
    auditContext?: any
  ): Promise<Donor> {
    const previousDonor = await this.getDonor(id);
    const updatedDonor = await super.updateDonor(id, updates);

    await this.auditDataChange(
      auditContext?.userId || null,
      "update",
      "donors",
      id,
      previousDonor,
      updatedDonor,
      auditContext
    );

    return updatedDonor;
  }

  // Override recipient methods with audit logging
  async updateRecipient(
    id: string,
    updates: Partial<InsertRecipient>,
    auditContext?: any
  ): Promise<Recipient> {
    const previousRecipient = await this.getRecipient(id);
    const updatedRecipient = await super.updateRecipient(id, updates);

    await this.auditDataChange(
      auditContext?.userId || null,
      "update",
      "recipients",
      id,
      previousRecipient,
      updatedRecipient,
      auditContext
    );

    return updatedRecipient;
  }

  // Override organ methods with audit logging
  async updateOrgan(
    id: string,
    updates: Partial<InsertOrgan>,
    auditContext?: any
  ): Promise<Organ> {
    const previousOrgan = await this.getOrgan(id);
    const updatedOrgan = await super.updateOrgan(id, updates);

    await this.auditDataChange(
      auditContext?.userId || null,
      "update",
      "organs",
      id,
      previousOrgan,
      updatedOrgan,
      auditContext
    );

    return updatedOrgan;
  }

  // Override allocation methods with audit logging
  async updateAllocation(
    id: string,
    updates: Partial<InsertAllocation>,
    auditContext?: any
  ): Promise<Allocation> {
    const previousAllocation = await this.getAllocation(id);
    const updatedAllocation = await super.updateAllocation(id, updates);

    await this.auditDataChange(
      auditContext?.userId || null,
      "update",
      "allocations",
      id,
      previousAllocation,
      updatedAllocation,
      auditContext
    );

    return updatedAllocation;
  }

  // Override transport methods with audit logging
  async updateTransport(
    id: string,
    updates: Partial<InsertTransport>,
    auditContext?: any
  ): Promise<Transport> {
    const previousTransport = await this.getTransport(id);
    const updatedTransport = await super.updateTransport(id, updates);

    await this.auditDataChange(
      auditContext?.userId || null,
      "update",
      "transports",
      id,
      previousTransport,
      updatedTransport,
      auditContext
    );

    return updatedTransport;
  }

  // Add methods for tracking data exports
  async auditDataExport(
    userId: string,
    entityType: string,
    recordCount: number,
    format: string,
    filters?: any,
    auditContext?: any
  ) {
    const auditLog: InsertAuditLog = {
      userId,
      userEmail: auditContext?.userEmail || null,
      userRole: auditContext?.userRole || null,
      userName: auditContext?.userName || null,
      sessionId: auditContext?.sessionId || "system",
      ipAddress: auditContext?.ipAddress || "system",
      userAgent: auditContext?.userAgent || "system",
      httpMethod: "GET",
      endpoint: `/api/${entityType}/export`,
      action: "export",
      actionCategory: "export",
      entityType,
      entityId: null,
      queryParams: filters,
      resultCount: recordCount,
      exportFormat: format,
      exportRecordCount: recordCount,
      success: true,
      phiAccessed: true,
      metadata: {
        ...auditContext,
        exportTimestamp: new Date().toISOString(),
      },
    };

    await this.createAuditLog(auditLog);
  }

  // Add method for bulk operations auditing
  async auditBulkOperation(
    userId: string,
    action: string,
    entityType: string,
    entityIds: string[],
    metadata?: any
  ) {
    const auditLog: InsertAuditLog = {
      userId,
      userEmail: metadata?.userEmail || null,
      userRole: metadata?.userRole || null,
      userName: metadata?.userName || null,
      sessionId: metadata?.sessionId || "system",
      ipAddress: metadata?.ipAddress || "system",
      userAgent: metadata?.userAgent || "system",
      httpMethod: metadata?.httpMethod || null,
      endpoint: metadata?.endpoint || null,
      action,
      actionCategory: "data_modification",
      entityType,
      entityId: null,
      success: true,
      phiAccessed: true,
      metadata: {
        ...metadata,
        bulkOperation: true,
        affectedEntityIds: entityIds,
        affectedCount: entityIds.length,
      },
    };

    await this.createAuditLog(auditLog);
  }

  // Add method for tracking permission checks
  async auditPermissionCheck(
    userId: string,
    resource: string,
    action: string,
    allowed: boolean,
    auditContext?: any
  ) {
    const auditLog: InsertAuditLog = {
      userId,
      userEmail: auditContext?.userEmail || null,
      userRole: auditContext?.userRole || null,
      userName: auditContext?.userName || null,
      sessionId: auditContext?.sessionId || "system",
      ipAddress: auditContext?.ipAddress || "system",
      userAgent: auditContext?.userAgent || "system",
      httpMethod: null,
      endpoint: null,
      action: "permission_check",
      actionCategory: "authorization",
      entityType: resource,
      entityId: null,
      success: allowed,
      metadata: {
        ...auditContext,
        requestedAction: action,
        permissionGranted: allowed,
      },
      phiAccessed: false,
    };

    await this.createAuditLog(auditLog);
  }
}

// Export singleton instance (named + default for import compatibility)
export const auditedStorage = new AuditedDatabaseStorage();
export default auditedStorage;
