import axios from "axios";

export interface Pokemon {
  name: string;
  image: string;
  id: number;
  types: string[];
  height: number;
  weight: number;
  abilities: string[];
  evolutionChain: EvolutionData[];
}

export interface EvolutionData {
  id: number;
  name: string;
  image: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export class PokedexService {
  /**
   * Obtiene los datos de un Pokémon desde la API
   */
  static async fetchPokemon(query: string): Promise<Pokemon> {
    const response = await axios.get(
      `https://pokeapi.co/api/v2/pokemon/${query.toLowerCase().trim()}`
    );
    const data = response.data;

    // Obtener nombre en español
    const speciesResponse = await axios.get(data.species.url);
    const speciesData = speciesResponse.data;
    const spanishName = speciesData.names.find(
      (name: any) => name.language.name === 'es'
    )?.name || data.name;

    // Obtener tipos en español
    const typesPromises = data.types.map(async (type: any) => {
      const typeResponse = await axios.get(type.type.url);
      const typeData = typeResponse.data;
      return typeData.names.find(
        (name: any) => name.language.name === 'es'
      )?.name || type.type.name;
    });
    const spanishTypes = await Promise.all(typesPromises);

    // Obtener habilidades en español
    const abilitiesPromises = data.abilities.map(async (ability: any) => {
      const abilityResponse = await axios.get(ability.ability.url);
      const abilityData = abilityResponse.data;
      return abilityData.names.find(
        (name: any) => name.language.name === 'es'
      )?.name || ability.ability.name;
    });
    const spanishAbilities = await Promise.all(abilitiesPromises);

    // Obtener cadena evolutiva
    const evolutionChainResponse = await axios.get(speciesData.evolution_chain.url);
    const evolutionChainData = evolutionChainResponse.data;

    const evolutionChain: EvolutionData[] = [];
    const chainLinks = [];
    let current = evolutionChainData.chain;
    while (current) {
      chainLinks.push(current);
      current = current.evolves_to?.[0];
    }

    const evolutionPromises = chainLinks.map(async (chain) => {
      const pokemonId = chain.species.url.split('/').slice(-2)[0];
      const pokemonResponse = await axios.get(
        `https://pokeapi.co/api/v2/pokemon/${pokemonId}`
      );
      const pokemonData = pokemonResponse.data;
      const speciesResp = await axios.get(chain.species.url);
      const speciesInfo = speciesResp.data;
      const spanishNameEvo = speciesInfo.names.find(
        (name: any) => name.language.name === 'es'
      )?.name || chain.species.name;

      return {
        id: parseInt(pokemonId),
        name: spanishNameEvo,
        image: pokemonData.sprites.other['official-artwork'].front_default || 
               pokemonData.sprites.front_default,
      };
    });

    const processedChain = await Promise.all(evolutionPromises);
    evolutionChain.push(...processedChain);

    return {
      name: spanishName,
      image: data.sprites.other['official-artwork'].front_default || 
             data.sprites.front_default,
      id: data.id,
      types: spanishTypes,
      height: data.height,
      weight: data.weight,
      abilities: spanishAbilities,
      evolutionChain: evolutionChain,
    };
  }

  /**
   * Genera un ID de Pokémon aleatorio
   */
  static getRandomPokemonId(): number {
    return Math.floor(Math.random() * 898) + 1;
  }

  /**
   * Obtiene el color asociado a un tipo de Pokémon
   */
  static getTypeColor(type: string): string {
    const colors: { [key: string]: string } = {
      'Normal': '#A8A878',
      'Fuego': '#F08030',
      'Agua': '#6890F0',
      'Eléctrico': '#F8D030',
      'Planta': '#78C850',
      'Hielo': '#98D8D8',
      'Lucha': '#C03028',
      'Veneno': '#A040A0',
      'Tierra': '#E0C068',
      'Volador': '#A890F0',
      'Psíquico': '#F85888',
      'Bicho': '#A8B820',
      'Roca': '#B8A038',
      'Fantasma': '#705898',
      'Dragón': '#7038F8',
      'Siniestro': '#705848',
      'Acero': '#B8B8D0',
      'Hada': '#EE99AC',
    };
    return colors[type] || '#A8A878';
  }

  /**
   * Obtiene las debilidades de un Pokémon según sus tipos
   */
  static getTypeWeaknesses(types: string[]): string[] {
    const weaknesses: { [key: string]: string[] } = {
      'Normal': ['Lucha'],
      'Fuego': ['Agua', 'Tierra', 'Roca'],
      'Agua': ['Eléctrico', 'Planta'],
      'Eléctrico': ['Tierra'],
      'Planta': ['Fuego', 'Hielo', 'Veneno', 'Volador', 'Bicho'],
      'Hielo': ['Fuego', 'Lucha', 'Roca', 'Acero'],
      'Lucha': ['Volador', 'Psíquico', 'Hada'],
      'Veneno': ['Tierra', 'Psíquico'],
      'Tierra': ['Agua', 'Planta', 'Hielo'],
      'Volador': ['Eléctrico', 'Hielo', 'Roca'],
      'Psíquico': ['Bicho', 'Fantasma', 'Siniestro'],
      'Bicho': ['Fuego', 'Volador', 'Roca'],
      'Roca': ['Agua', 'Planta', 'Lucha', 'Tierra', 'Acero'],
      'Fantasma': ['Fantasma', 'Siniestro'],
      'Dragón': ['Hielo', 'Dragón', 'Hada'],
      'Siniestro': ['Lucha', 'Bicho', 'Hada'],
      'Acero': ['Fuego', 'Lucha', 'Tierra'],
      'Hada': ['Veneno', 'Acero'],
    };

    const allWeaknesses = types.flatMap(type => weaknesses[type] || []);
    return [...new Set(allWeaknesses)];
  }

  /**
   * Encuentra el índice actual de un Pokémon en su cadena evolutiva
   */
  static getCurrentEvolutionIndex(
    evolutionChain: EvolutionData[], 
    pokemonId: number
  ): number {
    const index = evolutionChain.findIndex(evo => evo.id === pokemonId);
    return index !== -1 ? index : 0;
  }

  /**
   * Genera el contexto del Pokémon para el chat con Gemini
   */
  static getPokemonContext(pokemon: Pokemon): string {
    return `
Nombre: ${pokemon.name}
ID: #${pokemon.id.toString().padStart(3, '0')}
Tipos: ${pokemon.types.join(', ')}
Altura: ${(pokemon.height / 10).toFixed(1)}m
Peso: ${(pokemon.weight / 10).toFixed(1)}kg
Habilidades: ${pokemon.abilities.join(', ')}
Debilidades: ${this.getTypeWeaknesses(pokemon.types).join(', ')}
Cadena Evolutiva: ${pokemon.evolutionChain.map(e => e.name).join(' → ')}
    `;
  }

  /**
   * Valida si una consulta de búsqueda es válida
   */
  static validateSearchQuery(query: string): { valid: boolean; error?: string } {
    if (!query.trim()) {
      return { 
        valid: false, 
        error: "Por favor ingresa un nombre o número de Pokémon" 
      };
    }
    return { valid: true };
  }
}