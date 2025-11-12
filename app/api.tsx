import { GoogleGenerativeAI } from "@google/generative-ai";

export class GeminiService {
  private ai: GoogleGenerativeAI;
  private model: any;

  constructor(apiKey: string) {
    this.ai = new GoogleGenerativeAI(apiKey);
    
    this.model = this.ai.getGenerativeModel({ 
      model: "gemini-2.5-flash"
    });
  }

  async analyzePokemon(
    pokemonIdentifier: number | string, 
    userQuestion: string
  ): Promise<string> {
    const prompt = `Eres un experto en Pokémon. 

Pokémon: ${typeof pokemonIdentifier === 'number' ? `#${pokemonIdentifier}` : pokemonIdentifier}

Pregunta del usuario: ${userQuestion}

Responde de manera clara, concisa y precisa en español. Usa formato Markdown para mejor legibilidad.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error: any) {
      console.error("Error de Gemini:", error);
      throw new Error(error.message || "Error al comunicarse con Gemini");
    }
  }
}