import React from "react";
import { View } from "react-native";
import { useAuth } from "../src/hooks/useAuth";
import LoginScreen from "../src/screens/LoginScreen";
import BottomTabs from "../src/navigation/BottomTabs";

export default function Layout() {
  const { user } = useAuth();

  return (
    <View style={{ flex: 1 }}>
      {user ? <BottomTabs /> : <LoginScreen />}
    </View>
  );
}
