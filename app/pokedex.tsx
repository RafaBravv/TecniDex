// PokedexComponent.tsx
import { GeminiService } from "@/app/api";
import CustomButton from "@/components/customButton";
import CustomText from "@/components/customText";
import "@/global.css";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Component, createRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import Markdown from 'react-native-markdown-display';
import { SafeAreaView } from "react-native-safe-area-context";
import { PokedexService, Pokemon, ChatMessage } from "@/app/funciones";

interface PokedexState {
  pokemon: Pokemon | null;
  searchQuery: string;
  loading: boolean;
  error: string;
  currentEvolutionIndex: number;
  spinValue: Animated.Value;
  showChatModal: boolean;
  chatMessages: ChatMessage[];
  chatInput: string;
  chatLoading: boolean;
  geminiService: GeminiService | null;
}

export class PokedexComponent extends Component<{}, PokedexState> {
  private scrollViewRef: React.RefObject<any>;

  constructor(props: {}) {
    super(props);

    this.scrollViewRef = createRef<ScrollView>();
    
    const APIKEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    console.log('API Key existe:', !!APIKEY);
    console.log('Primeros caracteres:', APIKEY?.substring(0, 10));
    
    this.state = {
      pokemon: null,
      searchQuery: "",
      loading: false,
      error: "",
      currentEvolutionIndex: 0,
      spinValue: new Animated.Value(0),
      showChatModal: false,
      chatMessages: [],
      chatInput: "",
      chatLoading: false,
      geminiService: APIKEY ? new GeminiService(APIKEY) : null,
    };
  }

  // ======================= LIFECYCLE =======================
  componentDidMount() {
    this.handleRandomPokemon();
  }

  componentDidUpdate(prevProps: {}, prevState: PokedexState) {
    if (this.state.loading && !prevState.loading) {
      this.state.spinValue.setValue(0);
      Animated.loop(
        Animated.timing(this.state.spinValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    }
  }

  // ======================= POKEMON HANDLERS =======================
  fetchPokemon = async (query: string) => {
    const validation = PokedexService.validateSearchQuery(query);
    if (!validation.valid) {
      this.setState({ error: validation.error || "" });
      return;
    }

    this.setState({ loading: true, error: "" });

    try {
      const pokemon = await PokedexService.fetchPokemon(query);
      const currentIndex = PokedexService.getCurrentEvolutionIndex(
        pokemon.evolutionChain, 
        pokemon.id
      );

      this.setState({
        pokemon,
        currentEvolutionIndex: currentIndex,
        loading: false,
      });
    } catch (err: any) {
      this.setState({
        error: err.response?.data?.message || err.message || "Error al buscar el Pokémon",
        pokemon: null,
        loading: false,
      });
    }
  };

  handleSearch = () => {
    this.fetchPokemon(this.state.searchQuery);
  };

  handleRandomPokemon = () => {
    const randomId = PokedexService.getRandomPokemonId();
    this.setState({ searchQuery: randomId.toString() });
    this.fetchPokemon(randomId.toString());
  };

  handlePreviousEvolution = async () => {
    const { pokemon, currentEvolutionIndex } = this.state;
    if (!pokemon || currentEvolutionIndex <= 0) return;
    
    const prevEvolution = pokemon.evolutionChain[currentEvolutionIndex - 1];
    await this.fetchPokemon(prevEvolution.id.toString());
  };

  handleNextEvolution = async () => {
    const { pokemon, currentEvolutionIndex } = this.state;
    if (!pokemon || currentEvolutionIndex >= pokemon.evolutionChain.length - 1) return;
    
    const nextEvolution = pokemon.evolutionChain[currentEvolutionIndex + 1];
    await this.fetchPokemon(nextEvolution.id.toString());
  };

  // ======================= CHAT HANDLERS =======================
  openChat = () => {
    if (!this.state.geminiService) {
      this.setState({ 
        error: "API Key de Gemini no configurada. Añade EXPO_PUBLIC_GEMINI_API_KEY a tu archivo .env" 
      });
      return;
    }

    if (!this.state.pokemon) {
      this.setState({ error: "Primero busca un Pokémon para analizar" });
      return;
    }

    this.setState({ 
      showChatModal: true,
      chatMessages: [{
        role: 'assistant',
        content: `¡Hola! Soy tu asistente de análisis Pokémon. Estoy listo para analizar a **${this.state.pokemon.name}**. ¿Qué te gustaría saber acerca de él/ella?`
      }]
    });
  };

  closeChat = () => {
    this.setState({ showChatModal: false, chatMessages: [], chatInput: "" });
  };

  sendMessage = async () => {
    const { chatInput, pokemon, geminiService, chatMessages } = this.state;

    if (!chatInput.trim() || !pokemon || !geminiService) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: chatInput
    };

    this.setState({ 
      chatMessages: [...chatMessages, userMessage],
      chatInput: "",
      chatLoading: true
    });

    const pokemonContext = PokedexService.getPokemonContext(pokemon);

    try {
      const response = await geminiService.analyzePokemon(pokemonContext, chatInput);
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response
      };

      this.setState({ 
        chatMessages: [...this.state.chatMessages, assistantMessage],
        chatLoading: false
      });

      setTimeout(() => {
        this.scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error: any) {
      this.setState({ 
        chatMessages: [...this.state.chatMessages, {
          role: 'assistant',
          content: `❌ Error: ${error.message}`
        }],
        chatLoading: false
      });
    }
  };

  // ======================= RENDER =======================
  render() {
    const { 
      pokemon, 
      searchQuery, 
      loading, 
      error, 
      currentEvolutionIndex, 
      spinValue, 
      showChatModal, 
      chatMessages, 
      chatInput, 
      chatLoading 
    } = this.state;

    const spin = spinValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    return (
      <SafeAreaView className="flex-1 bg-white relative">
        <View className="h-[50%] bg-red-500 -z-1 absolute inset-0"/>
        <ScrollView contentContainerClassName="flex-grow p-6 z-1000">
          <View className="items-center mb-6">
            <CustomText variant="header" value="Pokédex" />
            <CustomText variant="subheader" value="Busca tu Pokémon favorito" />
          </View>

          {/* ======================= Panel de búsqueda ======================= */}
          <View className="bg-white rounded-2xl p-4 mb-6 shadow-lg">
            <CustomText variant="label" value="Nombre o Número" />
            <TextInput
              className="bg-gray-100 border-2 border-gray-300 rounded-xl px-4 py-3 text-gray-900 mb-3"
              placeholder="Ej: Pikachu o 25"
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={(text) => this.setState({ searchQuery: text })}
              autoCapitalize="none"
              onSubmitEditing={this.handleSearch}
            />
            
            <View className="flex-row gap-2">
              <CustomButton
                title={loading ? "Buscando..." : "Buscar"}
                onPress={this.handleSearch}
                variant="primary"
                disabled={loading}
              />

              <CustomButton
                title="Aleatorio"
                onPress={this.handleRandomPokemon}
                variant="outline"
                disabled={loading}
              />
            </View>
          </View>

          {error && (
            <View className="bg-red-100 border-2 border-red-400 rounded-xl p-4 mb-6">
              <CustomText variant="error" value={error} />
            </View>
          )}

          {loading && (
            <View className="items-center py-12">
              <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <MaterialIcons name="catching-pokemon" size={64} color="#ff0000" className="shadow-lg"/>
              </Animated.View>
              <CustomText variant="subtitle" value="Buscando Pokémon..." />
            </View>
          )}

          {pokemon && !loading && (
            <View className="bg-white rounded-3xl p-6 items-center shadow-2xl">
              <CustomText 
                variant="pokemonId"
                value={`#${pokemon.id.toString().padStart(3, '0')}`}
              />

              <View className="w-full mb-4">
                {/* ======================= Visualizador de pokemones ======================= */}
                <View className="flex-row items-center justify-center">
                  <TouchableOpacity
                    onPress={this.handlePreviousEvolution}
                    disabled={currentEvolutionIndex <= 0}
                    className="p-3"
                  >
                    <CustomText 
                      variant="title" 
                      value="◀" 
                      color={currentEvolutionIndex <= 0 ? "text-gray-300" : "text-red-500"}
                    />
                  </TouchableOpacity>

                  <View className="bg-gray-50 rounded-full p-4">
                    <Image
                      source={{ uri: pokemon.image }}
                      className="w-52 h-52"
                      resizeMode="contain"
                    />
                  </View>

                  <TouchableOpacity
                    onPress={this.handleNextEvolution}
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

                {/* ======================= Visualizador de cadena evolutiva ======================= */}
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
                          onPress={() => this.fetchPokemon(evo.id.toString())}
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

              <CustomText variant="pokemonName" value={pokemon.name} />

              <View className="flex-row gap-2 mb-6">
                {pokemon.types.map((type, index) => (
                  <View
                    key={index}
                    className="px-6 py-2 rounded-full"
                    style={{ backgroundColor: PokedexService.getTypeColor(type) }}
                  >
                    <CustomText variant="typeText" value={type} />
                  </View>
                ))}
              </View>

              {/* Botón de Chat con Gemini */}
              <TouchableOpacity
                onPress={this.openChat}
                className="bg-purple-600 px-6 py-3 rounded-full flex-row items-center gap-2 mb-6"
              >
                <MaterialIcons name="chat" size={24} color="white" />
                <CustomText variant="typeText" value="Analizar con Gemini AI" />
              </TouchableOpacity>

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

              <View className="w-full bg-gray-50 rounded-2xl p-4">
                <CustomText variant="statsTitle" value="Debilidades" />
                <View className="flex-row flex-wrap gap-2 justify-center mt-2">
                  {PokedexService.getTypeWeaknesses(pokemon.types).map((weakness, index) => (
                    <View
                      key={index}
                      className="px-4 py-2 rounded-full"
                      style={{ backgroundColor: PokedexService.getTypeColor(weakness) }}
                    >
                      <CustomText variant="typeText" value={weakness} />
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          {!pokemon && !loading && !error && (
            <View className="items-center py-12">
              <CustomText 
                variant="initial"
                value="Busca un Pokémon por nombre o número"
              />
            </View>
          )}
        </ScrollView>

        {/* Modal de Chat con Gemini */}
        <Modal
          visible={showChatModal}
          animationType="fade"
          transparent={true}
          onRequestClose={this.closeChat}
        >
          <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="flex-1"
          >
            <View className="flex-1 bg-black/50 justify-end items-center">
              <View className="bg-white rounded-t-3xl h-[60%] w-[95%]">
                {/* Header del Chat */}
                <View className="bg-purple-600 rounded-t-3xl p-4 flex-row justify-between items-center">
                  <View className="flex-row items-center gap-2">
                    <MaterialIcons name="psychology" size={28} color="white" />
                    <CustomText variant="typeText" value={`Analizando: ${pokemon?.name || ''}`} />
                  </View>
                  <TouchableOpacity onPress={this.closeChat}>
                    <MaterialIcons name="close" size={28} color="white" />
                  </TouchableOpacity>
                </View>

                {/* Mensajes del Chat */}
                <ScrollView 
                  ref={this.scrollViewRef}
                  className="flex-1 p-4"
                  onContentSizeChange={() => this.scrollViewRef.current?.scrollToEnd({ animated: true })}
                >
                  {chatMessages.map((message, index) => (
                    <View 
                      key={index}
                      className={`mb-4 ${message.role === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <View className={`max-w-[80%] p-3 rounded-2xl ${
                        message.role === 'user' 
                          ? 'bg-purple-600' 
                          : 'bg-gray-100'
                      }`}>
                        {message.role === 'assistant' ? (
                          <Markdown
                            style={{
                              body: { color: '#000', fontSize: 14 },
                              heading1: { fontSize: 18, fontWeight: 'bold', marginVertical: 4 },
                              heading2: { fontSize: 16, fontWeight: 'bold', marginVertical: 3 },
                              code_inline: { backgroundColor: '#e0e0e0', paddingHorizontal: 4, borderRadius: 4 },
                              strong: { fontWeight: 'bold' },
                              em: { fontStyle: 'italic' },
                            }}
                          >
                            {message.content}
                          </Markdown>
                        ) : (
                          <CustomText 
                            variant="typeText" 
                            value={message.content}
                          />
                        )}
                      </View>
                    </View>
                  ))}
                  {chatLoading && (
                    <View className="items-start mb-4">
                      <View className="bg-gray-100 p-3 rounded-2xl">
                        <ActivityIndicator size="small" color="#9333ea" />
                      </View>
                    </View>
                  )}
                </ScrollView>

                {/* Input del Chat */}
                <View className="border-t border-gray-200 p-4 flex-row gap-2">
                  <TextInput
                    className="flex-1 bg-gray-100 rounded-full px-4 py-3 text-gray-900"
                    placeholder="Pregunta sobre este Pokémon..."
                    placeholderTextColor="#9ca3af"
                    value={chatInput}
                    onChangeText={(text) => this.setState({ chatInput: text })}
                    onSubmitEditing={this.sendMessage}
                    multiline
                  />
                  <TouchableOpacity
                    onPress={this.sendMessage}
                    disabled={!chatInput.trim() || chatLoading}
                    className={`bg-purple-600 rounded-full w-12 h-12 items-center justify-center ${
                      (!chatInput.trim() || chatLoading) ? 'opacity-50' : ''
                    }`}
                  >
                    <MaterialIcons name="send" size={24} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </SafeAreaView>
    );
  }
}