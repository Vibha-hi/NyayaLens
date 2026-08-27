import { createServerFn } from "@tanstack/react-start";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const summarizeCaseFn = createServerFn({ method: "POST" })
  .validator((caseId: string) => caseId)
  .handler(async ({ data: caseId }) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured in the environment.");
    }

    const serviceUrl = process.env["RETRIEVAL_SERVICE_URL"] || "http://127.0.0.1:8001";
    const response = await fetch(`${serviceUrl.replace(/\/$/, "")}/documents/${caseId}/text`);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Case text not found.");
      }
      throw new Error(`Failed to fetch case text: ${response.statusText}`);
    }

    const { text } = (await response.json()) as { text: string };

    if (!text || text.trim() === "") {
        throw new Error("Case text is empty.");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are an expert legal assistant. Summarize the material facts, legal issues, and final outcome of the following case in plain English. 
CRITICAL INSTRUCTIONS:
1. Keep the summary short and concise.
2. Keep the format very good.
3. The explanation of the case should be structured and very good.
4. DO NOT use ANY markdown formatting (no asterisks **, no hashes #). 
5. Use plain text only. Keep ideal bullet points.

Case Text:
${text}`;

    try {
        const result = await model.generateContent(prompt);
        return { summary: result.response.text() };
    } catch (error) {
        console.error("Gemini API Error:", error);
        throw new Error("Failed to generate summary from Gemini.");
    }
  });
