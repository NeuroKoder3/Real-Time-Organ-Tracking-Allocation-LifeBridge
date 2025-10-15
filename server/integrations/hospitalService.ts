// server/integrations/hospitalService.ts

export interface HospitalNotification {
  organId: string;
  status: "arriving" | "delayed" | "delivered";
  eta: string;
}

export interface HospitalResponse {
  acknowledged: boolean;
  notes?: string;
}

export class HospitalService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.HOSPITAL_API_URL || "https://api.hospitaldemo.org";
  }

  async notifyOrganStatus(update: HospitalNotification): Promise<HospitalResponse> {
    console.log("[Hospital Stub] Sending organ status update:", update);
    return {
      acknowledged: true,
      notes: "Notification received (stubbed)",
    };
  }
}

export const hospitalService = new HospitalService();
export default hospitalService;
