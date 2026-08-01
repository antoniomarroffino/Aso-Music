// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import type {
  SymbolViewProps,
  SymbolWeight,
} from "expo-symbols";

import type {
  ComponentProps,
} from "react";

import type {
  OpaqueColorValue,
  StyleProp,
  TextStyle,
} from "react-native";

type SFSymbolName =
    Extract<
        SymbolViewProps["name"],
        string
    >;

type MaterialIconName =
    ComponentProps<
        typeof MaterialIcons
    >["name"];

const MAPPING = {
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right":
      "code",
  "chevron.right": "chevron-right",
} as const satisfies Partial<
    Record<
        SFSymbolName,
        MaterialIconName
    >
>;

export type IconSymbolName =
    keyof typeof MAPPING;

type IconSymbolProps = {
  name: IconSymbolName;
  size?: number;
  color:
      | string
      | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
};

/**
 * An icon component that uses Material Icons
 * as fallback on Android and web.
 *
 * Icon names are based on the SF Symbols
 * explicitly declared inside MAPPING.
 */
export function IconSymbol({
                             name,
                             size = 24,
                             color,
                             style,
                           }: IconSymbolProps) {
  return (
      <MaterialIcons
          name={MAPPING[name]}
          size={size}
          color={color}
          style={style}
      />
  );
}