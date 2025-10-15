// server/integrations/opoService.ts

export interface OPOUpdate {
  donorId: string;
  status: "eligible" | "ineligible" | "pending";
  notes?: string;
}

export interface OPOResponse {
  success: boolean;
  message?: string;
}

export class OPOService {
  private baseUrl: string;
  private apiKey?: string;

  constructor() {
    this.baseUrl = process.env.OPO_API_URL || "https://sandbox.opo.org/api";
    this.apiKey = process.env.OPO_API_KEY;
  }

  async notifyDonorStatus(update: OPOUpdate): Promise<OPOResponse> {
    try {
      console.log("[OPO Stub] Notifying donor status:", update);
      return {
        success: true,
        message: "OPO status update accepted (stubbed)",
      };
    } catch (error) {
      console.error("[OPO Stub] Error notifying OPO:", error);
      return {
        success: false,
        message: "Failed to send to OPO (stub)",
      };
    }
  }
}

export const opoService = new OPOService();
export default opoService;
