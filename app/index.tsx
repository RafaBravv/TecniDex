import { useEffect, useState } from "react";
import { Text, Image, TextInput, View, ActivityIndicator, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import "@/global.css";

interface Pokemon {
  name: string;
  image: string;
  id: number;
  types: string[];
  height: number;
  weight: number;
}

export default function Index() {
  const [pokemon, setPokemon] = useState<Pokemon | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

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
      
      setPokemon({
        name: data.name,
        image: data.sprites.other['official-artwork'].front_default || data.sprites.front_default,
        id: data.id,
        types: data.types.map((type: any) => type.type.name),
        height: data.height,
        weight: data.weight,
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

  const getTypeColor = (type: string): string => {
    const colors: { [key: string]: string } = {
      normal: '#A8A878',
      fire: '#F08030',
      water: '#6890F0',
      electric: '#F8D030',
      grass: '#78C850',
      ice: '#98D8D8',
      fighting: '#C03028',
      poison: '#A040A0',
      ground: '#E0C068',
      flying: '#A890F0',
      psychic: '#F85888',
      bug: '#A8B820',
      rock: '#B8A038',
      ghost: '#705898',
      dragon: '#7038F8',
      dark: '#705848',
      steel: '#B8B8D0',
      fairy: '#EE99AC',
    };
    return colors[type] || '#A8A878';
  };

  return (
    <SafeAreaView className="flex-1 bg-red-500">
      <ScrollView contentContainerClassName="flex-grow p-6">
        {/* Header */}
        <View className="items-center mb-6">
          <Text className="text-4xl font-bold text-white mb-2">Pokédex</Text>
          <Text className="text-white opacity-90 text-base">
            Busca tu Pokémon favorito
          </Text>
        </View>

        {/* Search Bar */}
        <View className="bg-white rounded-2xl p-4 mb-6 shadow-lg">
          <Text className="text-gray-700 font-semibold mb-2 text-base">
            Nombre o Número
          </Text>
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
            <TouchableOpacity
              className="flex-1 bg-red-500 rounded-xl py-4 items-center shadow-md active:opacity-80"
              onPress={handleSearch}
              disabled={loading}
            >
              <Text className="text-white font-bold text-lg">
                {loading ? "Buscando..." : "Buscar"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 bg-transparent border-2 border-red-500 rounded-xl py-4 items-center active:opacity-80"
              onPress={handleRandomPokemon}
              disabled={loading}
            >
              <Text className="text-red-500 font-bold text-lg">Aleatorio</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Error Message */}
        {error && (
          <View className="bg-red-100 border-2 border-red-400 rounded-xl p-4 mb-6">
            <Text className="text-red-700 text-center font-semibold">
              {error}
            </Text>
          </View>
        )}

        {/* Loading */}
        {loading && (
          <View className="items-center py-12">
            <ActivityIndicator size="large" color="#ffffff" />
            <Text className="text-white mt-4 text-base">
              Buscando Pokémon...
            </Text>
          </View>
        )}

        {/* Pokemon Card */}
        {pokemon && !loading && (
          <View className="bg-white rounded-3xl p-6 items-center shadow-2xl">
            {/* ID */}
            <Text className="text-gray-400 font-bold text-lg mb-2">
              #{pokemon.id.toString().padStart(3, '0')}
            </Text>

            {/* Image */}
            <View className="bg-gray-50 rounded-full p-4 mb-4">
              <Image
                source={{ uri: pokemon.image }}
                className="w-52 h-52"
                resizeMode="contain"
              />
            </View>

            {/* Name */}
            <Text className="text-3xl font-bold text-gray-800 capitalize mb-4">
              {pokemon.name}
            </Text>

            {/* Types */}
            <View className="flex-row gap-2 mb-6">
              {pokemon.types.map((type, index) => (
                <View
                  key={index}
                  className="px-6 py-2 rounded-full"
                  style={{ backgroundColor: getTypeColor(type) }}
                >
                  <Text className="text-white font-bold capitalize text-sm">
                    {type}
                  </Text>
                </View>
              ))}
            </View>

            {/* Stats */}
            <View className="w-full bg-gray-50 rounded-2xl p-4">
              <Text className="text-lg font-bold text-gray-700 mb-3 text-center">
                Estadísticas
              </Text>
              
              <View className="flex-row justify-around items-center">
                <View className="items-center">
                  <Text className="text-2xl font-bold text-red-500">
                    {(pokemon.height / 10).toFixed(1)}m
                  </Text>
                  <Text className="text-gray-500 text-xs mt-1">Altura</Text>
                </View>

                <View className="w-px h-10 bg-gray-300" />

                <View className="items-center">
                  <Text className="text-2xl font-bold text-blue-500">
                    {(pokemon.weight / 10).toFixed(1)}kg
                  </Text>
                  <Text className="text-gray-500 text-xs mt-1">Peso</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Initial State */}
        {!pokemon && !loading && !error && (
          <View className="items-center py-12">
            <Text className="text-white text-lg text-center">
              Busca un Pokémon por nombre o número
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}