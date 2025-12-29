import { GoogleGenAI } from "@google/genai";
import { Message, MessageRole, GroundingSource } from "../types";

const SYSTEM_INSTRUCTION = `
You are MediGuide AI, a specialized medical guidance assistant. 
Your goal is to provide clear, educational, and non-diagnostic health information.

OPERATIONAL PARAMETERS:
1. USE SEARCH: Always use Google Search to ground your answers in current medical literature.
2. TRIAGE FIRST: If the user describes emergency symptoms (e.g., chest pain, difficulty breathing, slurred speech, sudden weakness, severe allergic reaction), you MUST prioritize a 911/emergency call directive immediately.
3. NON-DIAGNOSTIC: Never say "You have [Condition]". Instead, say "These symptoms are often evaluated for [Condition]" or "This may be associated with [Condition]".
4. LANGUAGE: Use professional yet accessible language. Define medical terms simply for a layperson.
5. NO PRESCRIPTIONS: Never recommend specific prescription dosages.
6. MANDATORY FOOTER: Every single response must end with this exact text: "Disclaimer: This is for educational purposes only. It is not professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition."
`;

// Helper for exponential backoff retries
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithRetry(fn: () => Promise<any>, retries = 2, delay = 2000): Promise<any> {
  try {
    return await fn();
  } catch (error: any) {
    // Retry on rate limits (429) or server errors (500+)
    if (retries > 0 && (error.status === 429 || error.status >= 500)) {
      console.warn(`MediGuide AI: Retrying connection... (${retries} attempts left)`);
      await wait(delay);
      return fetchWithRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

export async function sendMessageToGemini(history: Message[]): Promise<{ text: string, sources: GroundingSource[] }> {
  // Accessing the key strictly from process.env as per guidelines
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey === "undefined" || apiKey === "") {
    console.error("MediGuide AI: API_KEY is missing or invalid in the environment.");
    return { 
      text: "System Configuration Error: The connection to the medical database is not configured. Please ensure your API Key is set in the environment variables.", 
      sources: [] 
    };
  }

  // Initialize SDK
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
    // Medical guidance is a complex reasoning task: use gemini-3-pro-preview
    const response = await fetchWithRetry(() => ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: contents as any,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.1, // Low temperature for maximum factual precision
        tools: [{ googleSearch: {} }],
      },
    }));

    const candidate = response.candidates?.[0];
    
    if (candidate?.finishReason === 'SAFETY') {
      return {
        text: "I cannot provide specific information on this query due to safety protocols. If you are concerned about these symptoms, please consult a medical professional immediately.",
        sources: []
      };
    }

    const text = response.text || "I apologize, I'm unable to generate a guidance response at this moment.";
    
    // Extract grounding sources from Google Search
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

    // Deduplicate sources by URI
    const uniqueSources = Array.from(new Map(sources.map(item => [item.uri, item])).values());

    return { text, sources: uniqueSources };
  } catch (error: any) {
    // Log detailed error for developer debugging
    console.error("Gemini API Error Context:", error);
    
    let userFriendlyMessage = "The medical guidance system is currently unavailable.";
    
    // Specific error mapping
    const errorMsg = error.message || "";
    if (errorMsg.includes("API_KEY_INVALID") || errorMsg.includes("403")) {
      userFriendlyMessage = "Authentication error: The medical database key is invalid or restricted.";
    } else if (errorMsg.includes("429")) {
      userFriendlyMessage = "The system is currently busy. Please wait a moment and try again.";
    } else if (errorMsg.includes("location") || errorMsg.includes("unsupported")) {
      userFriendlyMessage = "This service is not available in your current region.";
    }

    return { 
      text: `${userFriendlyMessage} If you have an urgent health concern, please contact a healthcare professional immediately.`, 
      sources: [] 
    };
  }
}