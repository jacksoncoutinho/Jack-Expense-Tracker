import { GoogleGenAI, Type } from "@google/genai";
import { TransactionType } from "../types";

const parseTransaction = async (input: string, categories: string[]): Promise<{
  amount?: number;
  type?: TransactionType;
  category?: string;
  description?: string;
  date?: string;
} | null> => {
  // Always initialize GoogleGenAI with the named parameter apiKey from process.env.API_KEY.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

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

    // Access text via the property, not as a method.
    const resultText = response.text;
    if (resultText) {
      return JSON.parse(resultText);
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