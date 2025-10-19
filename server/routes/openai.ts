/**
 * ✅ OpenAI Integration Route
 * Performs AI-powered recipient ranking and transplant forecasting
 * using your trained OpenAI prompt (hosted prompt ID).
 */

import express, { type Request, type Response, type Router } from "express";
import OpenAI from "openai";

const router: Router = express.Router();

// ✅ Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// ✅ TypeScript interface for OpenAI response
interface OpenAIResponse {
  output?: {
    content?: {
      text?: string;
    }[];
  }[];
}

/**
 * POST /api/openai/analyze
 * Expected body: {
 *   organType: string,
 *   bloodType: string,
 *   recipientZip: string,
 *   donorZip?: string,
 *   urgencyLevel: "low" | "medium" | "high",
 *   patientAge?: number,
 *   patientGender?: string,
 *   hospital?: string
 * }
 */
router.post("/analyze", async (req: Request, res: Response) => {
  try {
    const inputData = req.body;

    if (!inputData?.organType) {
      return res.status(400).json({ error: "Missing organType or input data." });
    }

    console.log("🧠 [OpenAI] Running recipient analysis for:", inputData);

    // ✅ Prepare request payload
    const requestPayload = {
      ...inputData,
      timestamp: new Date().toISOString(),
    };

    // ✅ Call your hosted OpenAI prompt
    const response = (await openai.responses.create({
      prompt: {
        id: "pmpt_68f466998b408194b816aaf34577b58e0d2fe7c948cb1f20",
        version: "3",
      },
      input: requestPayload,
    })) as OpenAIResponse;

    // ✅ Extract output from response
    const output = response?.output?.[0]?.content?.[0]?.text || "No response generated";

    console.log("✅ [OpenAI] Response:", output);

    res.json({
      success: true,
      message: "AI analysis completed successfully",
      output,
    });
  } catch (error: any) {
    console.error("❌ [OpenAI] Error during analysis:", error);

    res.status(500).json({
      success: false,
      error: error?.message || "OpenAI request failed",
    });
  }
});

export default router;
