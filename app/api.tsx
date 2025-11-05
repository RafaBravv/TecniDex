// GeminiService.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

export class GeminiService {
  private ai: GoogleGenerativeAI;
  private model: any;

  constructor(apiKey: string) {
    this.ai = new GoogleGenerativeAI(apiKey);
    this.model = this.ai.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
  }

  async analyzePokemon(pokemonData: string, userQuestion: string): Promise<string> {
    const prompt = `Eres un experto en Pokémon. Aquí están los datos del Pokémon actual:

${pokemonData}

Pregunta del usuario: ${userQuestion}

Por favor, responde de manera clara y concisa, analizando las estadísticas, tipos, habilidades y debilidades según la pregunta. Usa formato Markdown para mejor legibilidad.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error: any) {
      throw new Error(error.message || "Error al comunicarse con Gemini");
    }
  }
}