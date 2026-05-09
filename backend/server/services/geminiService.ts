import { GoogleGenerativeAI } from "@google/generative-ai";

const getGenAI = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing.");
  }

  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
};

// ✅ Types
export type ResearchSection =
  | 'Title'
  | 'Abstract'
  | 'Introduction'
  | 'Literature Review'
  | 'Methodology'
  | 'Results'
  | 'Conclusion'
  | 'References';

export interface ResearchState {
  topic: string;
  field: string;
  purpose: string;
  level: string;
  currentSection: ResearchSection;
  completedSections: Record<ResearchSection, string>;
}

// ✅ System instruction
const SYSTEM_INSTRUCTION = `You are ScholarFlow, a beginner-friendly AI Research Mentor.
Explain things simply, use examples, guide step-by-step, and keep the tone encouraging.`;

// ✅ Advice function
export async function generateResearchAdvice(
  prompt: string,
  history: { role: 'user' | 'assistant' | 'model', parts: { text: string }[] }[]
) {
  try {
    const model = getGenAI().getGenerativeModel({
      model: "gemini-1.5-flash-latest",
      systemInstruction: SYSTEM_INSTRUCTION
    });

    const chat = model.startChat({
      history: history.map(h => ({
        role: h.role === 'model' ? 'assistant' : h.role,
        parts: [{ text: h.parts[0]?.text || '' }]
      })),
    });

    const result = await chat.sendMessage(prompt);
    return result.response.text();

  } catch (error: any) {
    console.error("Gemini advice error:", error);
    throw new Error(error.message || "Gemini API failed");
  }
}

// ✅ Draft function
export async function generateSectionDraft(
  section: ResearchSection,
  state: ResearchState
) {
  try {
    const model = getGenAI().getGenerativeModel({
      model: "gemini-1.5-flash-latest",
      systemInstruction: SYSTEM_INSTRUCTION
    });

    const prompt = `
Generate a simple, beginner-friendly draft for the "${section}" section.

Topic: ${state.topic}
Field: ${state.field}
Purpose: ${state.purpose}
Level: ${state.level}

Use very simple language and explain clearly.
`;

    const result = await model.generateContent(prompt);
    return result.response.text();

  } catch (error: any) {
    console.error("Gemini draft error:", error);
    throw new Error(error.message || "Gemini API failed");
  }
}
