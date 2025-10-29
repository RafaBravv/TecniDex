import "@/global.css";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Easing, Image, ScrollView, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomText from "@/components/customText";
import CustomButton from "@/components/customButton";

import MaterialIcons from '@expo/vector-icons/MaterialIcons';

interface Pokemon {
  name: string;
  image: string;
  id: number;
  types: string[];
  height: number;
  weight: number;
  abilities: string[];
  evolutionChain: EvolutionData[];
}

interface EvolutionData {
  id: number;
  name: string;
  image: string;
}

export default function Index() {
  const [pokemon, setPokemon] = useState<Pokemon | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [currentEvolutionIndex, setCurrentEvolutionIndex] = useState<number>(0);
  const spinValue = useRef(new Animated.Value(0)).current;

  const fetchPokemon = async (query: string) => {
    if (!query.trim()) {
      setError("Por favor ingresa un nombre o número de Pokémon");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `https://pokeapi.co/api/v2/pokemon/${query.toLowerCase().trim()}`
      );

      if (!response.ok) {
        throw new Error("Pokémon no encontrado");
      }

      const data = await response.json();
      
      // Obtener nombres en español
      const speciesResponse = await fetch(data.species.url);
      const speciesData = await speciesResponse.json();
      const spanishName = speciesData.names.find((name: any) => name.language.name === 'es')?.name || data.name;
      
      // Obtener tipos en español
      const typesPromises = data.types.map(async (type: any) => {
        const typeResponse = await fetch(type.type.url);
        const typeData = await typeResponse.json();
        return typeData.names.find((name: any) => name.language.name === 'es')?.name || type.type.name;
      });
      const spanishTypes = await Promise.all(typesPromises);
      
      // Obtener habilidades en español
      const abilitiesPromises = data.abilities.map(async (ability: any) => {
        const abilityResponse = await fetch(ability.ability.url);
        const abilityData = await abilityResponse.json();
        return abilityData.names.find((name: any) => name.language.name === 'es')?.name || ability.ability.name;
      });
      const spanishAbilities = await Promise.all(abilitiesPromises);
      
      // Obtener cadena evolutiva
      const evolutionChainResponse = await fetch(speciesData.evolution_chain.url);
      const evolutionChainData = await evolutionChainResponse.json();
      
      const evolutionChain: EvolutionData[] = [];
      const processEvolutionChain = async (chain: any) => {
        const pokemonId = chain.species.url.split('/').slice(-2)[0];
        const pokemonResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);
        const pokemonData = await pokemonResponse.json();
        const speciesResp = await fetch(chain.species.url);
        const speciesInfo = await speciesResp.json();
        const spanishNameEvo = speciesInfo.names.find((name: any) => name.language.name === 'es')?.name || chain.species.name;
        
        evolutionChain.push({
          id: parseInt(pokemonId),
          name: spanishNameEvo,
          image: pokemonData.sprites.other['official-artwork'].front_default || pokemonData.sprites.front_default,
        });
        
        if (chain.evolves_to && chain.evolves_to.length > 0) {
          await processEvolutionChain(chain.evolves_to[0]);
        }
      };
      
      await processEvolutionChain(evolutionChainData.chain);
      
      // Encontrar el índice del Pokémon actual en la cadena evolutiva
      const currentIndex = evolutionChain.findIndex(evo => evo.id === data.id);
      setCurrentEvolutionIndex(currentIndex !== -1 ? currentIndex : 0);
      
      setPokemon({
        name: spanishName,
        image: data.sprites.other['official-artwork'].front_default || data.sprites.front_default,
        id: data.id,
        types: spanishTypes,
        height: data.height,
        weight: data.weight,
        abilities: spanishAbilities,
        evolutionChain: evolutionChain,
      });
    } catch (err: any) {
      setError(err.message || "Error al buscar el Pokémon");
      setPokemon(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchPokemon(searchQuery);
  };

  const handleRandomPokemon = () => {
    const randomId = Math.floor(Math.random() * 898) + 1;
    setSearchQuery(randomId.toString());
    fetchPokemon(randomId.toString());
  };

  useEffect(() => {
    handleRandomPokemon();
  }, []);

  useEffect(() => {
    if (loading) {
      spinValue.setValue(0);
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [loading]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handlePreviousEvolution = async () => {
    if (!pokemon || currentEvolutionIndex <= 0) return;
    const prevEvolution = pokemon.evolutionChain[currentEvolutionIndex - 1];
    await fetchPokemon(prevEvolution.id.toString());
  };

  const handleNextEvolution = async () => {
    if (!pokemon || currentEvolutionIndex >= pokemon.evolutionChain.length - 1) return;
    const nextEvolution = pokemon.evolutionChain[currentEvolutionIndex + 1];
    await fetchPokemon(nextEvolution.id.toString());
  };

  const getTypeColor = (type: string): string => {
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
  };

  const translateType = (type: string): string => {
    const translations: { [key: string]: string } = {
      normal: 'Normal',
      fire: 'Fuego',
      water: 'Agua',
      electric: 'Eléctrico',
      grass: 'Planta',
      ice: 'Hielo',
      fighting: 'Lucha',
      poison: 'Veneno',
      ground: 'Tierra',
      flying: 'Volador',
      psychic: 'Psíquico',
      bug: 'Bicho',
      rock: 'Roca',
      ghost: 'Fantasma',
      dragon: 'Dragón',
      dark: 'Siniestro',
      steel: 'Acero',
      fairy: 'Hada',
    };
    return translations[type] || type;
  };

  const translateAbility = (ability: string): string => {
    const translations: { [key: string]: string } = {
      // Habilidades comunes
      'overgrow': 'Espesura',
      'chlorophyll': 'Clorofila',
      'blaze': 'Mar Llamas',
      'solar-power': 'Poder Solar',
      'torrent': 'Torrente',
      'rain-dish': 'Cura Lluvia',
      'shield-dust': 'Polvo Escudo',
      'run-away': 'Fuga',
      'shed-skin': 'Mudar',
      'compound-eyes': 'Ojo Compuesto',
      'swarm': 'Enjambre',
      'keen-eye': 'Vista Lince',
      'tangled-feet': 'Tumbos',
      'big-pecks': 'Sacapecho',
      'guts': 'Agallas',
      'rattled': 'Cobardía',
      'static': 'Electricidad Estática',
      'lightning-rod': 'Pararrayos',
      'sand-veil': 'Velo Arena',
      'sand-rush': 'Ímpetu Arena',
      'poison-point': 'Punto Tóxico',
      'rivalry': 'Rivalidad',
      'sheer-force': 'Potencia Bruta',
      'cute-charm': 'Gran Encanto',
      'magic-guard': 'Muro Mágico',
      'unaware': 'Ignorante',
      'flash-fire': 'Absorbe Fuego',
      'drought': 'Sequía',
      'levitate': 'Levitación',
      'effect-spore': 'Efecto Espora',
      'dry-skin': 'Piel Seca',
      'damp': 'Humedad',
      'wonder-skin': 'Piel Milagro',
      'limber': 'Flexibilidad',
      'imposter': 'Impostor',
      'infiltrator': 'Allanamiento',
      'stench': 'Hedor',
      'sticky-hold': 'Viscosidad',
      'poison-touch': 'Toque Tóxico',
      'synchronize': 'Sincronía',
      'inner-focus': 'Foco Interno',
      'telepathy': 'Telepatía',
      'volt-absorb': 'Absorbe Electricidad',
      'water-absorb': 'Absorbe Agua',
      'oblivious': 'Despiste',
      'cloud-nine': 'Aclimatación',
      'swift-swim': 'Nado Rápido',
      'sniper': 'Francotirador',
      'moody': 'Veleta',
      'adaptability': 'Adaptabilidad',
      'skill-link': 'Encadenado',
      'hydration': 'Hidratación',
      'thick-fat': 'Sebo',
      'huge-power': 'Fuerza Pura',
      'sap-sipper': 'Herbívoro',
      'sand-force': 'Poder Arena',
      'iron-fist': 'Puño Férreo',
      'no-guard': 'Indefenso',
      'steadfast': 'Impasible',
      'pressure': 'Presión',
      'justified': 'Justiciero',
      'regenerator': 'Regeneración',
      'natural-cure': 'Cura Natural',
      'serene-grace': 'Dicha',
      'hustle': 'Entusiasmo',
      'super-luck': 'Afortunado',
      'pickup': 'Recogida',
      'gluttony': 'Gula',
      'unnerve': 'Nerviosismo',
      'defiant': 'Competitivo',
      'quick-feet': 'Pies Rápidos',
      'normalize': 'Normalidad',
      'technician': 'Experto',
      'early-bird': 'Madrugar',
      'scrappy': 'Intrépido',
      'vital-spirit': 'Espíritu Vital',
      'anger-point': 'Irascible',
      'defeatist': 'Flaqueza',
      'solar-blade': 'Filo Solar',
      'contrary': 'Díscolo',
      'prankster': 'Bromista',
      'sturdy': 'Robustez',
      'magic-bounce': 'Espejo Mágico',
      'friend-guard': 'Superguarda',
      'healer': 'Alma Cura',
      'leaf-guard': 'Defensa Hoja',
      'white-smoke': 'Humo Blanco',
      'pure-power': 'Energía Pura',
      'shell-armor': 'Caparazón',
      'air-lock': 'Ausencia Clima',
      'battle-armor': 'Armadura Batalla',
      'clear-body': 'Cuerpo Puro',
      'hyper-cutter': 'Corte Fuerte',
      'magma-armor': 'Escudo Magma',
      'water-veil': 'Velo Agua',
      'magnet-pull': 'Imán',
      'soundproof': 'Insonorizar',
      'illuminate': 'Iluminación',
      'trace': 'Calco',
      'download': 'Descarga',
      'forecast': 'Predicción',
      'anticipation': 'Anticipación',
      'forewarn': 'Alerta',
      'klutz': 'Zoquete',
      'light-metal': 'Liviano',
      'heavy-metal': 'Metal Pesado',
      'multiscale': 'Multiescamas',
      'toxic-boost': 'Ímpetu Tóxico',
      'flare-boost': 'Ímpetu Ardiente',
      'harvest': 'Cosecha',
      'weak-armor': 'Armadura Frágil',
      'cursed-body': 'Cuerpo Maldito',
      'mummy': 'Momia',
      'moxie': 'Autoestima',
      'iron-barbs': 'Punta Acero',
      'overcoat': 'Funda',
      'pickpocket': 'Hurto',
      'arena-trap': 'Trampa Arena',
      'flame-body': 'Cuerpo Llama',
      'minus': 'Menos',
      'plus': 'Más',
      'rock-head': 'Cabeza Roca',
      'rough-skin': 'Piel Tosca',
      'wonder-guard': 'Superguarda',
      'immunity': 'Inmunidad',
      'own-tempo': 'Ritmo Propio',
      'suction-cups': 'Ventosas',
      'intimidate': 'Intimidación',
      'shadow-tag': 'Sombra Trampa',
      'speed-boost': 'Impulso',
      'truant': 'Ausente',
    };
    return translations[ability] || ability.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getTypeWeaknesses = (types: string[]): string[] => {
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
    return [...new Set(allWeaknesses)]; // Eliminar duplicados
  };

  return (
    <SafeAreaView className="flex-1 bg-white relative">
      <View className="h-[50%] bg-red-500 -z-1 absolute inset-0"/>
      <ScrollView contentContainerClassName="flex-grow p-6 z-1000">
        {/* Header */}
        <View className="items-center mb-6">
          <CustomText variant="header" value="Pokédex" />
          <CustomText variant="subheader" value="Busca tu Pokémon favorito" />
        </View>

        {/* Search Bar */}
        <View className="bg-white rounded-2xl p-4 mb-6 shadow-lg">
          <CustomText variant="label" value="Nombre o Número" />
          <TextInput
            className="bg-gray-100 border-2 border-gray-300 rounded-xl px-4 py-3 text-gray-900 mb-3 text-base"
            placeholder="Ej: pikachu o 25"
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            onSubmitEditing={handleSearch}
          />
          
          <View className="flex-row gap-2">
            <CustomButton
              title={loading ? "Buscando..." : "Buscar"}
              onPress={handleSearch}
              variant="primary"
              disabled={loading}
            />

            <CustomButton
              title="Aleatorio"
              onPress={handleRandomPokemon}
              variant="outline"
              disabled={loading}
            />
          </View>
        </View>

        {/* Error Message */}
        {error && (
          <View className="bg-red-100 border-2 border-red-400 rounded-xl p-4 mb-6">
            <CustomText variant="error" value={error} />
          </View>
        )}

        {/* Loading */}
        {loading && (
          <View className="items-center py-12">
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <MaterialIcons name="catching-pokemon" size={64} color="#ff0000" className="shadow-lg"/>
            </Animated.View>
            <CustomText variant="subtitle" value="Buscando Pokémon..." />
          </View>
        )}

        {/* Pokemon Card */}
        {pokemon && !loading && (
          <View className="bg-white rounded-3xl p-6 items-center shadow-2xl">
            {/* ID */}
            <CustomText 
              variant="pokemonId"
              value={`#${pokemon.id.toString().padStart(3, '0')}`}
            />

            {/* Image with Evolution Carousel */}
            <View className="w-full mb-4">
              <View className="flex-row items-center justify-center">
                {/* Previous Evolution Button */}
                <TouchableOpacity
                  onPress={handlePreviousEvolution}
                  disabled={currentEvolutionIndex <= 0}
                  className="p-3"
                >
                  <CustomText 
                    variant="title" 
                    value="◀" 
                    color={currentEvolutionIndex <= 0 ? "text-gray-300" : "text-red-500"}
                  />
                </TouchableOpacity>

                {/* Pokemon Image */}
                <View className="bg-gray-50 rounded-full p-4">
                  <Image
                    source={{ uri: pokemon.image }}
                    className="w-52 h-52"
                    resizeMode="contain"
                  />
                </View>

                {/* Next Evolution Button */}
                <TouchableOpacity
                  onPress={handleNextEvolution}
                  disabled={currentEvolutionIndex >= pokemon.evolutionChain.length - 1}
                  className="p-3"
                >
                  <CustomText 
                    variant="title" 
                    value="▶" 
                    color={currentEvolutionIndex >= pokemon.evolutionChain.length - 1 ? "text-gray-300" : "text-red-500"}
                  />
                </TouchableOpacity>
              </View>

              {/* Evolution Chain Preview */}
              {pokemon.evolutionChain.length > 1 && (
                <View className="mt-3">
                  <CustomText 
                    variant="statLabel" 
                    value="Cadena Evolutiva" 
                    className="text-center mb-2"
                  />
                  <View className="flex-row justify-center gap-2 flex-wrap">
                    {pokemon.evolutionChain.map((evo, index) => (
                      <TouchableOpacity
                        key={index}
                        onPress={() => fetchPokemon(evo.id.toString())}
                        className={`px-3 py-1 rounded-full ${
                          index === currentEvolutionIndex ? 'bg-red-500' : 'bg-gray-300'
                        }`}
                      >
                        <CustomText 
                          variant="typeText" 
                          value={evo.name}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>

            {/* Name */}
            <CustomText variant="pokemonName" value={pokemon.name} />

            {/* Types */}
            <View className="flex-row gap-2 mb-6">
              {pokemon.types.map((type, index) => (
                <View
                  key={index}
                  className="px-6 py-2 rounded-full"
                  style={{ backgroundColor: getTypeColor(type) }}
                >
                  <CustomText variant="typeText" value={type} />
                </View>
              ))}
            </View>

            {/* Stats */}
            <View className="w-full bg-gray-50 rounded-2xl p-4 mb-4">
              <CustomText variant="statsTitle" value="Estadísticas" />
              
              <View className="flex-row justify-around items-center">
                <View className="items-center">
                  <CustomText 
                    variant="statValue" 
                    color="text-red-500"
                    value={`${(pokemon.height / 10).toFixed(1)}m`}
                  />
                  <CustomText variant="statLabel" value="Altura" />
                </View>

                <View className="w-px h-10 bg-gray-300" />

                <View className="items-center">
                  <CustomText 
                    variant="statValue" 
                    color="text-blue-500"
                    value={`${(pokemon.weight / 10).toFixed(1)}kg`}
                  />
                  <CustomText variant="statLabel" value="Peso" />
                </View>
              </View>
            </View>

            {/* Abilities */}
            <View className="w-full bg-gray-50 rounded-2xl p-4 mb-4">
              <CustomText variant="statsTitle" value="Habilidades" />
              <View className="flex-row flex-wrap gap-2 justify-center mt-2">
                {pokemon.abilities.map((ability, index) => (
                  <View
                    key={index}
                    className="bg-purple-500 px-4 py-2 rounded-full"
                  >
                    <CustomText 
                      variant="typeText" 
                      value={ability} 
                    />
                  </View>
                ))}
              </View>
            </View>

            {/* Weaknesses */}
            <View className="w-full bg-gray-50 rounded-2xl p-4">
              <CustomText variant="statsTitle" value="Debilidades" />
              <View className="flex-row flex-wrap gap-2 justify-center mt-2">
                {getTypeWeaknesses(pokemon.types).map((weakness, index) => (
                  <View
                    key={index}
                    className="px-4 py-2 rounded-full"
                    style={{ backgroundColor: getTypeColor(weakness) }}
                  >
                    <CustomText variant="typeText" value={weakness} />
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Initial State */}
        {!pokemon && !loading && !error && (
          <View className="items-center py-12">
            <CustomText 
              variant="initial"
              value="Busca un Pokémon por nombre o número"
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}