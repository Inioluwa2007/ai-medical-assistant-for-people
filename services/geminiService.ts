
import { GoogleGenAI } from "@google/genai";
import { Message, MessageRole, GroundingSource } from "../types";

const SYSTEM_INSTRUCTION = `
You are MediGuide AI, a specialized medical guidance assistant. 
Your goal is to provide clear, educational, and non-diagnostic health information.

OPERATIONAL PARAMETERS:
1. USE SEARCH: Always use Google Search to ground your answers in current medical literature.
2. TRIAGE FIRST: If the user describes emergency symptoms (e.g., chest pain, difficulty breathing, slurred speech, sudden weakness, severe allergic reaction), you MUST prioritize a 911/emergency call directive immediately.
3. NON-DIAGNOSTIC: Never say "You have [Condition]". Instead, say "These symptoms are often evaluated for [Condition]" or "This may be associated with [Condition]".
4. NO PRESCRIPTIONS: Never recommend specific prescription dosages.
5. MANDATORY FOOTER: Every single response must end with this exact text: "Disclaimer: This is for educational purposes only. It is not professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition."
`;

export async function sendMessageToGemini(history: Message[]): Promise<{ text: string, sources: GroundingSource[] }> {
  // Use the API key from environment variables safely
  let apiKey = '';
  try {
    // Check if process exists to avoid ReferenceError on some mobile browsers/environments
    if (typeof process !== 'undefined' && process.env) {
      apiKey = process.env.API_KEY || '';
    }
  } catch (e) {
    console.error("Failed to access process.env", e);
  }
  
  if (!apiKey) {
    return { 
      text: "Configuration Error: API Key is missing or invalid. Please ensure the environment is correctly configured with an API_KEY.", 
      sources: [] 
    };
  }

  // Always create a new instance to ensure we use the most up-to-date key
  const ai = new GoogleGenAI({ apiKey });
  
  const contents = history.map(msg => {
    const parts: any[] = [{ text: msg.content }];
    if (msg.image) {
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: msg.image.includes(',') ? msg.image.split(',')[1] : msg.image
        }
      });
    }
    return {
      role: msg.role === MessageRole.USER ? 'user' : 'model',
      parts
    };
  });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: contents as any,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.1,
        tools: [{ googleSearch: {} }],
      },
    });

    const candidate = response.candidates?.[0];
    
    if (candidate?.finishReason === 'SAFETY') {
      return {
        text: "I cannot provide specific information on this query due to safety protocols. Please consult a healthcare professional for specific concerns.",
        sources: []
      };
    }

    const text = response.text || "I'm sorry, I couldn't generate a response.";
    
    const sources: GroundingSource[] = [];
    const chunks = candidate?.groundingMetadata?.groundingChunks;
    
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web?.uri && chunk.web?.title) {
          sources.push({
            title: chunk.web.title,
            uri: chunk.web.uri
          });
        }
      });
    }

    const uniqueSources = Array.from(new Map(sources.map(item => [item.uri, item])).values());
    return { text, sources: uniqueSources };
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    let errorMsg = "The service is temporarily unavailable.";
    if (error.message?.includes("429")) errorMsg = "The system is busy (Rate Limit). Please try again in a moment.";
    if (error.message?.includes("API_KEY_INVALID")) errorMsg = "Invalid API Key configuration.";
    
    return { 
      text: `${errorMsg} If you are experiencing a medical emergency, please call 911 immediately.`, 
      sources: [] 
    };
  }
}
