import "@/global.css";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Image, ScrollView, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomText from "@/components/customText";
import CustomButton from "@/components/customButton";
import axios from "axios";

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
      const response = await axios.get(
        `https://pokeapi.co/api/v2/pokemon/${query.toLowerCase().trim()}`
      );
      const data = response.data;

      // Obtener nombres en español
      const speciesResponse = await axios.get(data.species.url);
      const speciesData = speciesResponse.data;
      const spanishName = speciesData.names.find((name: any) => name.language.name === 'es')?.name || data.name;

      // Obtener tipos en español
      const typesPromises = data.types.map(async (type: any) => {
        const typeResponse = await axios.get(type.type.url);
        const typeData = typeResponse.data;
        return typeData.names.find((name: any) => name.language.name === 'es')?.name || type.type.name;
      });
      const spanishTypes = await Promise.all(typesPromises);

      // Obtener habilidades en español
      const abilitiesPromises = data.abilities.map(async (ability: any) => {
        const abilityResponse = await axios.get(ability.ability.url);
        const abilityData = abilityResponse.data;
        return abilityData.names.find((name: any) => name.language.name === 'es')?.name || ability.ability.name;
      });
      const spanishAbilities = await Promise.all(abilitiesPromises);

      // Obtener cadena evolutiva
      const evolutionChainResponse = await axios.get(speciesData.evolution_chain.url);
      const evolutionChainData = evolutionChainResponse.data;

      const evolutionChain: EvolutionData[] = [];
      // Recopilar todos los enlaces de la cadena de manera iterativa para evitar recursión profunda
      const chainLinks = [];
      let current = evolutionChainData.chain;
      while (current) {
        chainLinks.push(current);
        current = current.evolves_to?.[0]; // Asumiendo cadena lineal, ignorando ramificaciones
      }

      // Procesar todos los enlaces en paralelo
      const evolutionPromises = chainLinks.map(async (chain) => {
        const pokemonId = chain.species.url.split('/').slice(-2)[0];
        const pokemonResponse = await axios.get(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);
        const pokemonData = pokemonResponse.data;
        const speciesResp = await axios.get(chain.species.url);
        const speciesInfo = speciesResp.data;
        const spanishNameEvo = speciesInfo.names.find((name: any) => name.language.name === 'es')?.name || chain.species.name;

        return {
          id: parseInt(pokemonId),
          name: spanishNameEvo,
          image: pokemonData.sprites.other['official-artwork'].front_default || pokemonData.sprites.front_default,
        };
      });

      const processedChain = await Promise.all(evolutionPromises);
      evolutionChain.push(...processedChain);

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
      setError(err.response?.data?.message || err.message || "Error al buscar el Pokémon");
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