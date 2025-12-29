
import { GoogleGenAI } from "@google/genai";
import { Message, MessageRole, GroundingSource } from "../types";

const SYSTEM_INSTRUCTION = `
You are MediGuide AI, a specialized virtual assistant for preliminary medical guidance and health education.
You use Google Search to provide up-to-date information.

CORE OPERATIONAL PROTOCOL:
1. SIMPLE LANGUAGE: Translate complex medical jargon into clear, comforting, non-technical language.
2. NO DIAGNOSIS: Never state "You have [Condition]". Use phrasing like "These symptoms are commonly associated with...".
3. SAFETY FIRST: If a user mentions emergency symptoms (chest pain, stroke signs, severe bleeding), instruct them to call 911 immediately.
4. SEARCH GROUNDING: Use Google Search to verify health data.
5. MANDATORY DISCLAIMER: Every response MUST conclude with: "Disclaimer: This is for educational guidance only. It is not a diagnosis or professional medical advice. Please consult a qualified healthcare provider for clinical care."
6. STRUCTURE: Use bolding for key terms and bullet points for lists.
`;

export async function sendMessageToGemini(history: Message[]): Promise<{ text: string, sources: GroundingSource[] }> {
  // Ensure we have a valid key or at least don't crash the constructor
  const apiKey = process.env.API_KEY || "";
  const ai = new GoogleGenAI({ apiKey });
  
  const contents = history.map(msg => {
    const parts: any[] = [{ text: msg.content }];
    if (msg.image) {
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: msg.image.split(',')[1] || msg.image
        }
      });
    }
    return {
      role: msg.role === MessageRole.USER ? 'user' : 'model',
      parts
    };
  });

  try {
    // Using gemini-3-flash-preview for better availability and performance in production
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: contents as any,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.3,
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "I apologize, I couldn't generate a response. Please try rephrasing your question.";
    const sources: GroundingSource[] = [];

    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web && chunk.web.uri && chunk.web.title) {
          sources.push({
            title: chunk.web.title,
            uri: chunk.web.uri
          });
        }
      });
    }

    const uniqueSources = sources.filter((v, i, a) => a.findIndex(t => t.uri === v.uri) === i);

    return { text, sources: uniqueSources };
  } catch (error: any) {
    console.error("Gemini API Error Detail:", error);
    
    let errorMessage = "The guidance system is temporarily unavailable. ";
    if (error.message?.includes("API_KEY_INVALID") || !apiKey) {
      errorMessage = "Configuration error: The health database could not be reached. Please check your system settings.";
    }

    return { 
      text: `${errorMessage}If you have an urgent health concern, please contact a medical professional immediately.`, 
      sources: [] 
    };
  }
}
