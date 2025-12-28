
import { GoogleGenAI } from "@google/genai";
import { Message, MessageRole } from "../types";

const SYSTEM_INSTRUCTION = `
You are MediGuide AI, a specialized virtual assistant for preliminary medical guidance and health education.
You are part of a student-built MVP designed for accessibility and non-emergency support.

CORE OPERATIONAL PROTOCOL:
1. SIMPLE LANGUAGE: Translate complex medical jargon into clear, comforting, non-technical language suitable for students and general public.
2. NO DIAGNOSIS: Never state "You have [Condition]". Instead, use phrasing like "These symptoms are common in conditions like...", "It could be related to...", or "Often, this is seen when...".
3. SAFETY FIRST: If a user mentions "Chest pain", "Shortness of breath", "Severe bleeding", "Stroke symptoms (face drooping, arm weakness, speech difficulty)", or "Intense abdominal pain", your ONLY response should be to tell them to call 911 (or local emergency services) IMMEDIATELY.
4. MANDATORY DISCLAIMER: Every single response must conclude with: "Disclaimer: This is for educational guidance only. It is not a diagnosis or professional medical advice. Please consult a qualified healthcare provider for clinical care."
5. STRUCTURED ANSWERS: Use bolding for emphasis and bullet points for lists (e.g., potential causes, next steps, home care tips).
6. NEXT STEPS: Always suggest practical next steps (e.g., "Monitor your temperature for 24 hours", "Stay hydrated", "Schedule a non-emergency appointment if pain persists").
7. MEDICATIONS: You may explain what over-the-counter medications are typically used for (e.g., "Acetaminophen is commonly used for fever"), but always warn the user to speak with a pharmacist or doctor before taking new medication.

TONE: Professional, empathetic, calm, and educational.
`;

export async function sendMessageToGemini(history: Message[], userInput: string): Promise<string> {
  // Use a new instance to ensure up-to-date API key environment
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  
  const contents = history.map(msg => ({
    role: msg.role === MessageRole.USER ? 'user' : 'model',
    parts: [{ text: msg.content }]
  }));

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: contents as any,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.6,
        topP: 0.9,
      },
    });

    return response.text || "I apologize, I encountered an issue processing that. Please try rephrasing your question.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "The system is currently experiencing high load. If this is an emergency, please contact local medical services immediately. Otherwise, please try again in a moment.";
  }
}
