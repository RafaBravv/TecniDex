import { TouchableOpacity, Text } from 'react-native';
import React from 'react';

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline";
  disabled?: boolean;
  className?: string;
  textClassName?: string;
}

const CustomButton = ({ 
  title, 
  onPress, 
  variant = "primary", 
  disabled = false,
  className = "",
  textClassName = ""
}: CustomButtonProps) => {
  return (
    <TouchableOpacity
      className={`flex-1 rounded-xl py-4 items-center active:opacity-80 ${selectVariant(variant)} ${className}`}
      onPress={onPress}
      disabled={disabled}
    >
      <Text className={`font-bold text-lg ${selectTextVariant(variant)} ${textClassName}`}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

export default CustomButton;

function selectVariant(variant: string) {
  switch (variant) {
    case "primary":
      return "bg-red-500 shadow-md";
    case "secondary":
      return "bg-gray-500 shadow-md";
    case "outline":
      return "bg-transparent border-2 border-red-500";
    default:
      return "bg-red-500 shadow-md";
  }
}

function selectTextVariant(variant: string) {
  switch (variant) {
    case "primary":
      return "text-white";
    case "secondary":
      return "text-white";
    case "outline":
      return "text-red-500";
    default:
      return "text-white";
  }
}