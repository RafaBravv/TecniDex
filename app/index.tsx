import { useEffect, useState } from "react";
import { Text, Image, TextInput, View, ActivityIndicator, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Pokédex</Text>
          <Text style={styles.subtitle}>Busca tu Pokémon favorito</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.label}>Nombre o Número</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: pikachu o 25"
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            onSubmitEditing={handleSearch}
          />
          
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleSearch}
              disabled={loading}
            >
              <Text style={styles.primaryButtonText}>
                {loading ? "Buscando..." : "Buscar"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={handleRandomPokemon}
              disabled={loading}
            >
              <Text style={styles.secondaryButtonText}>Aleatorio</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Loading */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#ffffff" />
            <Text style={styles.loadingText}>Buscando Pokémon...</Text>
          </View>
        )}

        {/* Pokemon Card */}
        {pokemon && !loading && (
          <View style={styles.card}>
            {/* ID */}
            <Text style={styles.pokemonId}>
              #{pokemon.id.toString().padStart(3, '0')}
            </Text>

            {/* Image */}
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: pokemon.image }}
                style={styles.pokemonImage}
                resizeMode="contain"
              />
            </View>

            {/* Name */}
            <Text style={styles.pokemonName}>{pokemon.name}</Text>

            {/* Types */}
            <View style={styles.typesContainer}>
              {pokemon.types.map((type, index) => (
                <View
                  key={index}
                  style={[styles.typeBadge, { backgroundColor: getTypeColor(type) }]}
                >
                  <Text style={styles.typeText}>{type}</Text>
                </View>
              ))}
            </View>

            {/* Stats */}
            <View style={styles.statsContainer}>
              <Text style={styles.statsTitle}>Estadísticas</Text>
              
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {(pokemon.height / 10).toFixed(1)}m
                  </Text>
                  <Text style={styles.statLabel}>Altura</Text>
                </View>

                <View style={styles.statDivider} />

                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: '#3b82f6' }]}>
                    {(pokemon.weight / 10).toFixed(1)}kg
                  </Text>
                  <Text style={styles.statLabel}>Peso</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Initial State */}
        {!pokemon && !loading && !error && (
          <View style={styles.initialState}>
            <Text style={styles.initialText}>
              Busca un Pokémon por nombre o número
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ef4444',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    color: '#ffffff',
    opacity: 0.9,
    fontSize: 16,
  },
  searchContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  label: {
    color: '#374151',
    fontWeight: '600',
    marginBottom: 8,
    fontSize: 16,
  },
  input: {
    backgroundColor: '#f3f4f6',
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#111827',
    marginBottom: 12,
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#ef4444',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#ef4444',
  },
  secondaryButtonText: {
    color: '#ef4444',
    fontWeight: 'bold',
    fontSize: 18,
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    borderWidth: 2,
    borderColor: '#f87171',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  errorText: {
    color: '#b91c1c',
    textAlign: 'center',
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    color: '#ffffff',
    marginTop: 16,
    fontSize: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  pokemonId: {
    color: '#9ca3af',
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 8,
  },
  imageContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 100,
    padding: 16,
    marginBottom: 16,
  },
  pokemonImage: {
    width: 200,
    height: 200,
  },
  pokemonName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    textTransform: 'capitalize',
    marginBottom: 16,
  },
  typesContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  typeBadge: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
  },
  typeText: {
    color: '#ffffff',
    fontWeight: 'bold',
    textTransform: 'capitalize',
    fontSize: 14,
  },
  statsContainer: {
    width: '100%',
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 16,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 12,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  statLabel: {
    color: '#6b7280',
    fontSize: 12,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#d1d5db',
  },
  initialState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  initialText: {
    color: '#ffffff',
    fontSize: 18,
    textAlign: 'center',
  },
});