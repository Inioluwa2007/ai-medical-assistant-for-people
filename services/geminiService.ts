
import { GoogleGenAI } from "@google/genai";
import { Message, MessageRole, GroundingSource } from "../types";

const SYSTEM_INSTRUCTION = `
You are MediGuide AI, a specialized virtual assistant for preliminary medical guidance and health education.
You use Google Search to provide up-to-date information.

CORE OPERATIONAL PROTOCOL:
1. SIMPLE LANGUAGE: Translate complex medical jargon into clear, comforting, non-technical language for students.
2. NO DIAGNOSIS: Never state "You have [Condition]". Use phrasing like "These symptoms are commonly associated with conditions like...".
3. SAFETY FIRST: If a user mentions emergency symptoms (chest pain, stroke signs, severe bleeding, or extreme pain), your ONLY response is to instruct them to call 911 (or local emergency services) immediately.
4. SEARCH GROUNDING: Use Google Search to verify recent health data. Cite your findings indirectly by answering based on the facts.
5. MANDATORY DISCLAIMER: Every response MUST conclude with: "Disclaimer: This is for educational guidance only. It is not a diagnosis or professional medical advice. Please consult a qualified healthcare provider for clinical care."
6. IMAGE ANALYSIS: If a user provides an image of a medication label or a diagram, explain its contents clearly. Never diagnose a clinical condition (like a rash) from a photo; instead, describe what it *could* be and suggest professional evaluation.
7. STRUCTURE: Use bolding for key terms and bullet points for steps or common causes.
`;

export async function sendMessageToGemini(history: Message[]): Promise<{ text: string, sources: GroundingSource[] }> {
  // Always create a new instance to get the latest environment variables
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  
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
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: contents as any,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.3, // Lower temperature for more factual consistency
        thinkingConfig: {
          thinkingBudget: 2000 // Enable reasoning for better medical structure
        },
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "I apologize, I encountered an issue processing that guidance. Please try rephrasing.";
    const sources: GroundingSource[] = [];

    // Extract grounding sources from Google Search
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

    // Filter for unique source URIs
    const uniqueSources = sources.filter((v, i, a) => a.findIndex(t => t.uri === v.uri) === i);

    return { text, sources: uniqueSources };
  } catch (error) {
    console.error("Gemini API Error:", error);
    return { 
      text: "The guidance system is temporarily unavailable. If you have an urgent health concern, please contact a medical professional immediately.", 
      sources: [] 
    };
  }
}
