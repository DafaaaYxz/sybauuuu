import { GoogleGenAI } from "@google/genai";
import { Message } from '../types';

// DIRECT API KEY USAGE TO PREVENT "PROCESS NOT DEFINED" ERRORS
const API_KEY = 'AIzaSyA0GsDqsh2f8F1kh2JFrliXriLjluym8QI';

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const streamGeminiResponse = async (
  history: Message[],
  persona: string,
  newMessage: string,
  onChunk: (text: string) => void
): Promise<string> => {
  try {
    // Map history to API format
    // Filter out empty messages and ensure role is valid
    const validHistory = history
      .filter(h => h.text.trim() !== '')
      .map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.text }],
      }));

    // Using gemini-2.0-flash as requested
    const modelId = 'gemini-2.0-flash'; 

    const chat = ai.chats.create({
      model: modelId,
      config: {
        systemInstruction: persona, 
        temperature: 0.7,
      },
      history: validHistory,
    });

    const result = await chat.sendMessageStream({ message: newMessage });

    let fullText = '';
    
    for await (const chunk of result) {
      const chunkText = chunk.text;
      if (chunkText) {
        fullText += chunkText;
        onChunk(chunkText);
      }
    }

    return fullText;

  } catch (error) {
    console.error("Gemini API Error:", error);
    // Fallback error message for the UI
    onChunk("\n[Connection Error: Please verify the API key or try again later]");
    throw error;
  }
};
