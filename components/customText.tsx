import { Text } from 'react-native';
import React from 'react';

interface CustomTextProps {
  value?: string;
  variant?: "normal" | "subtitle" | "title" | "description" | "header" | "subheader" | "label" | "error" | "loading" | "pokemonId" | "pokemonName" | "typeText" | "statValue" | "statLabel" | "statsTitle" | "initial";
  color?: string;
  className?: string;
}

const CustomText = ({ value = "", variant = "normal", color, className = "" }: CustomTextProps) => {
  return (
    <Text className={`${selectVariant(variant)} ${color || ''} ${className}`}>
      {value}
    </Text>
  );
};

export default CustomText;

function selectVariant(variant: string) {
  switch (variant) {
    case "normal":
      return "text-black font-normal";
    case "subtitle":
      return "text-gray-400 font-bold text-xl";
    case "title":
      return "text-black font-bold text-2xl";
    case "description":
      return "text-gray-400 text-xs";
    case "header":
      return "text-4xl font-bold text-white mb-2";
    case "subheader":
      return "text-white opacity-90 text-base";
    case "label":
      return "text-gray-700 font-semibold mb-2 text-base";
    case "error":
      return "text-red-700 text-center font-semibold";
    case "loading":
      return "text-white mt-4 text-base";
    case "pokemonId":
      return "text-gray-400 font-bold text-lg mb-2";
    case "pokemonName":
      return "text-3xl font-bold text-gray-800 capitalize mb-4";
    case "typeText":
      return "text-white font-bold capitalize text-sm";
    case "statValue":
      return "text-2xl font-bold";
    case "statLabel":
      return "text-gray-500 text-xs mt-1";
    case "statsTitle":
      return "text-lg font-bold text-gray-700 mb-3 text-center";
    case "initial":
      return "text-white text-lg text-center";
    default:
      return "text-black font-normal";
  }
}