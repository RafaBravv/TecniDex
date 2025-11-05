import "@/global.css";
import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity } from 'react-native';

interface buttonProps{
    isLoading: boolean;
    onPress: () => void;
}

export function Button ({isLoading, onPress}: buttonProps) {
  return (
    <TouchableOpacity
        disabled={isLoading}
        className="h-[50px] items-center justify-center bg-teal-600 py-4 px-6 rounded-xl flex-row gap-4"
        onPress={onPress}
    >
        {isLoading && <ActivityIndicator size="small" color="#000000"/>}
        <Text className='font-semibold text-lg text-ehite text-center text-white'>
            {isLoading ? ("Generando..."):("Enviar")}
        </Text>
    </TouchableOpacity>
  )
}