// Public types (exported so callers can type their requests/responses)
export interface AirlineBookingRequest {
  organId: string;
  origin: string;
  destination: string;
  priorityLevel: "standard" | "urgent" | "emergency";
}

export interface AirlineBookingResponse {
  success: boolean;
  bookingId?: string;
  message?: string;
}

export interface AirlineStatusResponse {
  bookingId: string;
  status: "scheduled" | "in-transit" | "delivered" | "cancelled" | "error";
  timestamp: string;
  details?: string;
}

/**
 * Stubbed Airline service client.
 * In production, replace internals with secure HTTP calls and auth.
 */
export class AirlineService {
  private baseUrl: string;
  private apiKey?: string;

  constructor() {
    // In real use, set these in your environment (.env / Netlify / Docker)
    this.baseUrl = process.env.AIRLINE_API_URL || "https://sandbox.aircarrier.com/api";
    this.apiKey = process.env.AIRLINE_API_KEY;
  }

  /**
   * Simulate sending a booking request to airline partner.
   * Replace with a real POST request when integration is live.
   */
  async sendBookingRequest(
    req: AirlineBookingRequest
  ): Promise<AirlineBookingResponse> {
    try {
      console.log("[Airline Stub] Sending booking request:", req);

      return {
        success: true,
        bookingId: `air-${req.organId}-${Date.now()}`,
        message: "Stubbed airline booking confirmed",
      };
    } catch (error) {
      console.error("[Airline Stub] Error sending booking:", error);
      return {
        success: false,
        message: "Failed to send booking to airline (stub)",
      };
    }
  }

  /**
   * Simulate fetching the booking status from airline partner.
   * Replace with a real GET request when integration is live.
   */
  async getBookingStatus(bookingId: string): Promise<AirlineStatusResponse> {
    try {
      console.log("[Airline Stub] Fetching booking status:", bookingId);

      return {
        bookingId,
        status: "in-transit",
        timestamp: new Date().toISOString(),
        details: "Stubbed airline status response",
      };
    } catch (error) {
      console.error("[Airline Stub] Error fetching booking status:", error);
      return {
        bookingId,
        status: "error",
        timestamp: new Date().toISOString(),
        details: "Failed to fetch airline booking status (stub)",
      };
    }
  }
}

// Named singleton export
export const airlineService = new AirlineService();

// Default export
export default airlineService;
