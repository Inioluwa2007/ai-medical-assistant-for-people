import { GoogleGenAI } from "@google/genai";
import { Message, MessageRole, GroundingSource } from "../types";

const SYSTEM_INSTRUCTION = `
You are MediGuide AI, a high-fidelity medical guidance assistant. 
Your goal is to provide clear, educational, and non-diagnostic health information.

OPERATIONAL PARAMETERS:
1. USE SEARCH: Always use Google Search to ground your answers in current medical literature.
2. TRIAGE FIRST: If the user describes emergency symptoms (e.g., chest pain, difficulty breathing, slurred speech, sudden weakness, severe allergic reaction), you MUST prioritize a 911/emergency call directive over any other information.
3. NON-DIAGNOSTIC: Never say "You have X". Instead, say "These symptoms can be seen in conditions such as X" or "Medical professionals often evaluate these signs for Y".
4. LANGUAGE: Use professional yet accessible language. Define medical terms simply.
5. NO PRESCRIPTIONS: Never recommend specific prescription dosages. Suggest general over-the-counter types only if standard (e.g., "acetaminophen for fever").
6. MANDATORY FOOTER: Every single response must end with this exact text: "Disclaimer: This is for educational purposes only. It is not professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition."
`;

// Helper for exponential backoff
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithRetry(fn: () => Promise<any>, retries = 3, delay = 1000): Promise<any> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0 && (error.status === 429 || error.status >= 500)) {
      await wait(delay);
      return fetchWithRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

export async function sendMessageToGemini(history: Message[]): Promise<{ text: string, sources: GroundingSource[] }> {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    console.error("MediGuide AI: API_KEY is missing.");
    return { 
      text: "System Configuration Error: The connection to the health database is offline. Please check your API key settings.", 
      sources: [] 
    };
  }

  // Create a fresh instance for every request to ensure the latest config/key is used
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
    const response = await fetchWithRetry(() => ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: contents as any,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.15, // Extremely low for high factual precision
        topP: 0.8,
        tools: [{ googleSearch: {} }],
      },
    }));

    const candidate = response.candidates?.[0];
    
    // Safety check
    if (candidate?.finishReason === 'SAFETY') {
      return {
        text: "I cannot provide information on this specific topic due to safety protocols. If you are experiencing a medical issue, please consult a healthcare professional immediately.",
        sources: []
      };
    }

    const text = response.text || "I'm sorry, I couldn't generate a helpful response. Please try rephrasing your health concern.";
    
    // Extract grounding sources
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

    // Deduplicate sources
    const uniqueSources = Array.from(new Map(sources.map(item => [item.uri, item])).values());

    return { text, sources: uniqueSources };
  } catch (error: any) {
    console.error("MediGuide API Error:", error);
    
    let userFriendlyMessage = "The guidance system is temporarily unavailable.";
    
    if (error.message?.includes("429")) {
      userFriendlyMessage = "The system is currently handling many requests. Please wait a moment.";
    } else if (error.message?.includes("API_KEY_INVALID")) {
      userFriendlyMessage = "Critical Error: Invalid authentication. Please contact system support.";
    } else if (error.message?.includes("location")) {
      userFriendlyMessage = "The system is currently unavailable in your region.";
    }

    return { 
      text: `${userFriendlyMessage} If this is an emergency, please contact a doctor immediately.`, 
      sources: [] 
    };
  }
}