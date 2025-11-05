import { Button } from "@/app/componentesApi/button";
import PromptText from "@/app/componentesApi/promptText";

import { GoogleGenerativeAI } from "@google/generative-ai"; // ✅ Importación correcta
import React, { useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, Text } from "react-native";

import Markdown from 'react-native-markdown-display';

const GeminiApi = () => {
    const [response, setResponse] = useState("");
    const [value, setValue] = useState("");
    const [isLoading, setLoading] = useState(false);
    const [error, setError] = useState<string>("");

    const APIKEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

    // ✅ Validar que existe la API Key
    if (!APIKEY) {
        return (
            <SafeAreaView className="flex-1 justify-center items-center bg-white">
                <Text className="text-red-500 p-4 text-center">
                    Error: EXPO_PUBLIC_GEMINI_API_KEY no está configurada en .env
                </Text>
            </SafeAreaView>
        );
    }

    const ai = new GoogleGenerativeAI(APIKEY); // ✅ Pasar la API Key

    const requestGemini = async (prompt: string) => {
        if (!prompt.trim()) {
            setError("Por favor ingresa un texto");
            return;
        }

        setLoading(true);
        setError("");
        setResponse("");

        try {
            // ✅ API correcta
            const model = ai.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
            const result = await model.generateContent(prompt);
            const text = result.response.text();
            
            setResponse(text);
            console.log("Respuesta:", text);
        } catch (err: any) {
            console.error("Error:", err);
            setError(err.message || "Error al comunicarse con Gemini");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 justify-center items-center bg-white p-4">
            <PromptText value={value} onChangeText={setValue} />
            
            <Button
                onPress={() => requestGemini(value)}
                isLoading={isLoading} // ✅ Pasar el estado
            />

            {isLoading && <ActivityIndicator size="large" color="#0000ff" />}

            {/* ✅ Mostrar respuesta */}
            {response.length > 0 && (
                <ScrollView className="m-4 p-6 bg-gray-100 rounded-[20px] shadow-lg">
                    <Markdown>
                        {response}
                    </Markdown>
                </ScrollView>
            )}
            {error.length > 0 && (
                <Text className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg">
                    {error}
                </Text>
            )}
        </SafeAreaView>
    );
};

export default GeminiApi;