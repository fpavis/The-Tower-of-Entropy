import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  if (!process.env.API_KEY) return null;
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

const FALLBACK_WISDOMS = [
  "Chaos is inevitable, but so is your persistence.",
  "The rings align for those who seek order.",
  "Every move defies the heat death of the universe.",
  "Efficiency is the rebellion against decay.",
  "The tower stands tall amidst the void.",
  "Time flows only forward; make your moves count.",
  "Entropy increases, but your will remains constant.",
  "In the face of infinity, every step matters.",
  "Disorder is only order you haven't understood yet.",
  "Each ring you place is a small defeat for the dark.",
  "The tower remembers every move you make."
];

const BOSS_WISDOMS = [
  "Something vast has noticed your tower.",
  "Guardians of the void do not tire. Be efficient.",
  "A singularity bends every path toward its center."
];

const randomOf = (list: string[]) => list[Math.floor(Math.random() * list.length)];

const localWisdom = (context: string) =>
  /boss/i.test(context) ? randomOf(BOSS_WISDOMS) : randomOf(FALLBACK_WISDOMS);

export const getOracleWisdom = async (context: string): Promise<string> => {
  const ai = getClient();
  if (!ai) return localWisdom(context);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are The Oracle of Entropy, a mysterious entity observing a player struggling against the heat death of the universe in a Tower of Hanoi game. 
      
      Context: ${context}
      
      Provide a short, cryptic, but slightly encouraging sentence (max 20 words). Focus on order, chaos, cycles, or the futility of time.`,
    });
    
    // Safety check for empty response
    return response.text?.trim() || localWisdom(context);
  } catch (error: any) {
    // Graceful fallback for Rate Limits (429) or other API issues
    const errorMessage = error.toString();
    if (errorMessage.includes('429') || error.status === 429 || error?.error?.code === 429) {
      console.warn("Gemini Quota Exceeded: switching to backup protocol.");
    } else {
      console.warn("Gemini API Error:", error);
    }
    
    // Return a random fallback so the UI always has content
    return localWisdom(context);
  }
};