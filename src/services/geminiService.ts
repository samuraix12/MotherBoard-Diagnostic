import { GoogleGenAI } from "@google/genai";
import { TelemetryData, DiagnosticReport } from "../types";

export async function analyzeStability(telemetry: TelemetryData[]): Promise<DiagnosticReport> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  const recentData = telemetry.slice(-10);
  const avgStability = recentData.reduce((acc, d) => acc + d.stabilityScore, 0) / recentData.length;
  const maxRipple = Math.max(...recentData.map(d => d.vcoreRipple));
  const maxTemp = Math.max(...recentData.map(d => d.vrmTemp));

  const prompt = `Analyze this motherboard telemetry data for hardware stability:
    Average Stability Score: ${avgStability.toFixed(1)}%
    Max VCore Ripple: ${maxRipple}mV
    Max VRM Temperature: ${maxTemp}°C
    Recent Load: ${recentData[recentData.length - 1].load}%

    Provide a professional forensic hardware report in JSON format with:
    - summary: A concise technical summary of the board's health.
    - recommendations: 3 specific technical actions to improve stability.
    - riskLevel: "low", "medium", or "high".`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
      }
    });

    const result = JSON.parse(response.text || "{}");
    return {
      summary: result.summary || "Unable to generate summary.",
      recommendations: result.recommendations || ["Check power connections", "Update BIOS", "Improve airflow"],
      riskLevel: result.riskLevel || "low"
    };
  } catch (error) {
    console.error("AI Analysis failed:", error);
    return {
      summary: "Local analysis: System appears stable but AI diagnostics are currently offline.",
      recommendations: ["Monitor VRM temperatures", "Check for voltage spikes"],
      riskLevel: "low"
    };
  }
}
