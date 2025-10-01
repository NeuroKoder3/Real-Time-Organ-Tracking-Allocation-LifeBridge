import type { UserRole } from "../shared/schema.js"; 

// ---------------------------------------------------------
// Entity / Operation Types
// ---------------------------------------------------------
export type EntityType =
  | "donors"
  | "recipients"
  | "organs"
  | "allocations"
  | "transports"
  | "messages"
  | "custodyLogs"
  | "metrics"
  | "users"
  | "auditLogs";

export type Operation = "create" | "read" | "update" | "delete";

export type SpecialOperation =
  | "exportData"
  | "viewAuditLogs"
  | "manageUsers"
  | "viewAllData"
  | "updateAllocation"
  | "updateMedicalData";

// ---------------------------------------------------------
// Permission configuration structure
// ---------------------------------------------------------
interface PermissionConfig {
  entities: Record<EntityType, Record<Operation, UserRole[]>>;
  special: Record<SpecialOperation, UserRole[]>;
  fieldAccess: Record<EntityType, Record<string, UserRole[]>>;
}

// ---------------------------------------------------------
// Full permission configuration
// ---------------------------------------------------------
export const permissions: PermissionConfig = {
  entities: {
    donors: {
      create: ["admin", "coordinator"],
      read: ["admin", "coordinator", "surgeon", "transport"],
      update: ["admin", "coordinator"],
      delete: ["admin"],
    },
    recipients: {
      create: ["admin", "coordinator"],
      read: ["admin", "coordinator", "surgeon"],
      update: ["admin", "coordinator", "surgeon"],
      delete: ["admin"],
    },
    organs: {
      create: ["admin", "coordinator"],
      read: ["admin", "coordinator", "surgeon", "transport"],
      update: ["admin", "coordinator", "surgeon"],
      delete: ["admin"],
    },
    allocations: {
      create: ["admin", "coordinator"],
      read: ["admin", "coordinator", "surgeon"],
      update: ["admin", "coordinator"],
      delete: ["admin"],
    },
    transports: {
      create: ["admin", "coordinator"],
      read: ["admin", "coordinator", "surgeon", "transport"],
      update: ["admin", "coordinator", "transport"],
      delete: ["admin"],
    },
    messages: {
      create: ["admin", "coordinator", "surgeon", "transport"],
      read: ["admin", "coordinator", "surgeon", "transport"],
      update: ["admin", "coordinator"],
      delete: ["admin"],
    },
    custodyLogs: {
      create: ["admin", "coordinator", "surgeon", "transport"],
      read: ["admin", "coordinator", "surgeon", "transport"],
      update: ["admin"],
      delete: ["admin"],
    },
    metrics: {
      create: ["admin", "coordinator"],
      read: ["admin", "coordinator", "surgeon"],
      update: ["admin"],
      delete: ["admin"],
    },
    users: {
      create: ["admin"],
      read: ["admin", "coordinator"],
      update: ["admin"],
      delete: ["admin"],
    },
    auditLogs: {
      create: [],
      read: ["admin"],
      update: [],
      delete: [],
    },
  },
  special: {
    exportData: ["admin", "coordinator"],
    viewAuditLogs: ["admin"],
    manageUsers: ["admin"],
    viewAllData: ["admin", "coordinator"],
    updateAllocation: ["admin", "coordinator"],
    updateMedicalData: ["admin", "coordinator", "surgeon"],
  },
  fieldAccess: {
    donors: {
      medicalHistory: ["admin", "coordinator", "surgeon"],
      hlaType: ["admin", "coordinator", "surgeon"],
      consentStatus: ["admin", "coordinator"],
    },
    recipients: {
      firstName: ["admin", "coordinator", "surgeon"],
      lastName: ["admin", "coordinator", "surgeon"],
      medicalData: ["admin", "coordinator", "surgeon"],
      hlaType: ["admin", "coordinator", "surgeon"],
      antibodies: ["admin", "coordinator", "surgeon"],
      meldScore: ["admin", "coordinator", "surgeon"],
      cpcScore: ["admin", "coordinator", "surgeon"],
    },
    organs: {
      biopsyResults: ["admin", "coordinator", "surgeon"],
      crossmatchData: ["admin", "coordinator", "surgeon"],
      qualityScore: ["admin", "coordinator", "surgeon"],
      temperature: ["admin", "coordinator", "surgeon", "transport"],
      currentLocation: ["admin", "coordinator", "transport"],
    },
    allocations: {
      matchScore: ["admin", "coordinator"],
      compatibilityData: ["admin", "coordinator", "surgeon"],
      status: ["admin", "coordinator"],
      declineReason: ["admin", "coordinator"],
    },
    transports: {
      status: ["admin", "coordinator", "transport"],
      currentGpsLat: ["admin", "coordinator", "transport"],
      currentGpsLng: ["admin", "coordinator", "transport"],
      actualPickup: ["admin", "coordinator", "transport"],
      actualDelivery: ["admin", "coordinator", "transport"],
      costEstimate: ["admin", "coordinator"],
    },
    messages: {},
    custodyLogs: {
      temperature: ["admin", "coordinator", "surgeon", "transport"],
      signature: ["admin", "coordinator", "surgeon", "transport"],
    },
    metrics: {},
    users: {
      role: ["admin"],
      department: ["admin"],
    },
    auditLogs: {},
  },
};

// ---------------------------------------------------------
// Permission helpers
// ---------------------------------------------------------
export function hasPermission(
  userRole: UserRole | undefined,
  entityType: EntityType,
  operation: Operation,
): boolean {
  if (!userRole) return false;
  const allowedRoles = permissions.entities[entityType]?.[operation] || [];
  return allowedRoles.includes(userRole);
}

export function hasSpecialPermission(
  userRole: UserRole | undefined,
  specialOp: SpecialOperation,
): boolean {
  if (!userRole) return false;
  const allowedRoles = permissions.special[specialOp] || [];
  return allowedRoles.includes(userRole);
}

export function hasFieldAccess(
  userRole: UserRole | undefined,
  entityType: EntityType,
  fieldName: string,
): boolean {
  if (!userRole) return false;
  const fieldRestrictions = permissions.fieldAccess[entityType]?.[fieldName];
  if (!fieldRestrictions) {
    return hasPermission(userRole, entityType, "read");
  }
  return fieldRestrictions.includes(userRole);
}

export function filterFieldsByRole<T extends Record<string, any>>(
  data: T,
  userRole: UserRole | undefined,
  entityType: EntityType,
): Partial<T> {
  if (!userRole || !data) return {};
  if (userRole === "admin") return data;

  const filtered: Partial<T> = {};
  const fieldRestrictions = permissions.fieldAccess[entityType] || {};

  for (const [key, value] of Object.entries(data)) {
    if (fieldRestrictions[key]) {
      if (hasFieldAccess(userRole, entityType, key)) {
        filtered[key as keyof T] = value;
      }
    } else {
      if (hasPermission(userRole, entityType, "read")) {
        filtered[key as keyof T] = value;
      }
    }
  }
  return filtered;
}

export function validateUpdateFields(
  updates: Record<string, any>,
  userRole: UserRole | undefined,
  entityType: EntityType,
): { valid: boolean; unauthorizedFields: string[] } {
  if (!userRole) {
    return { valid: false, unauthorizedFields: Object.keys(updates) };
  }
  if (userRole === "admin") {
    return { valid: true, unauthorizedFields: [] };
  }

  const unauthorizedFields: string[] = [];
  const fieldRestrictions = permissions.fieldAccess[entityType] || {};

  for (const field of Object.keys(updates)) {
    if (fieldRestrictions[field]) {
      if (!hasFieldAccess(userRole, entityType, field)) {
        unauthorizedFields.push(field);
      }
    } else if (!hasPermission(userRole, entityType, "update")) {
      unauthorizedFields.push(field);
    }
  }

  return {
    valid: unauthorizedFields.length === 0,
    unauthorizedFields,
  };
}
