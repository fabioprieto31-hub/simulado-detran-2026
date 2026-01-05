import { GoogleGenAI, Type } from "@google/genai";
import { Question } from '../types';

export const generateQuestions = async (count: number = 5): Promise<Question[]> => {
  // Ensure the API key is retrieved exclusively from process.env as per guidelines
  if (!process.env.API_KEY) {
    throw new Error("API Key not found");
  }

  // Initialize the GoogleGenAI client using the named parameter 'apiKey'
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Define the schema for structured JSON output, using 'Type' from the SDK as recommended
  const schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        text: { type: Type.STRING },
        options: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        correctAnswer: { type: Type.INTEGER },
        explanation: { type: Type.STRING },
        category: { type: Type.STRING },
      },
      required: ["text", "options", "correctAnswer", "explanation"],
    },
  };

  // Upgraded to gemini-3-pro-preview as generating high-quality exam questions requires advanced reasoning
  const modelId = "gemini-3-pro-preview";
  
  try {
    // Call generateContent with both model name and prompt in a single step
    const response = await ai.models.generateContent({
      model: modelId,
      contents: `Gere ${count} questões de múltipla escolha para um simulado do DETRAN Brasil (nível difícil). 
      As questões devem cobrir: Legislação, Direção Defensiva, Primeiros Socorros, Mecânica e Meio Ambiente.
      A resposta correta deve ser o índice (0, 1, 2 ou 3) do array de opções.
      As opções não devem ter letras (a, b, c, d) no início, apenas o texto.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        systemInstruction: "Você é um instrutor especialista de trânsito do DETRAN. Gere questões técnicas e precisas."
      }
    });

    // Access the 'text' property directly from the response object (not a method call)
    const jsonText = response.text;
    if (!jsonText) return [];

    const rawQuestions = JSON.parse(jsonText);
    
    // Map response to internal Question type while ensuring unique local IDs
    return rawQuestions.map((q: any, index: number) => ({
      id: Date.now() + index,
      text: q.text,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      category: q.category || "Geral"
    }));

  } catch (error) {
    console.error("Error generating questions:", error);
    return [];
  }
};
