import { GoogleGenAI, Type } from "@google/genai";
import { TransactionType } from "../types";

const parseTransaction = async (input: string, categories: string[]): Promise<{
  amount?: number;
  type?: TransactionType;
  category?: string;
  description?: string;
  date?: string;
} | null> => {
  // Ensure we have an API key before initializing
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("Gemini API Key is missing. Please check your environment configuration.");
    return null;
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Extract transaction details from this text: "${input}". 
      Available categories: ${categories.join(', ')}. 
      If no category matches, pick the closest one or "Other".
      Current date is ${new Date().toISOString()}.
      Return JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER },
            type: { type: Type.STRING, enum: ["income", "expense"] },
            category: { type: Type.STRING },
            description: { type: Type.STRING },
            date: { type: Type.STRING, description: "ISO 8601 date string" }
          },
          required: ["amount", "type", "category", "description", "date"]
        }
      }
    });

    // Access text output from response.text property
    const text = response.text;
    if (text) {
      return JSON.parse(text);
    }
    return null;

  } catch (error) {
    console.error("Gemini parsing error:", error);
    return null;
  }
};

export const geminiService = {
  parseTransaction
};