
import { GoogleGenAI } from "@google/genai";

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });


export const generatePostText = async (prompt: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Based on the following idea, write a short, engaging social media post. Keep it under 280 characters. Idea: "${prompt}"`
        });
        
        return response.text;
    } catch (error) {
        console.error("Error generating post text:", error);
        return "Sorry, I couldn't generate a post right now. Please try again.";
    }
};
