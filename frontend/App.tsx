import "react-native-reanimated";
import { StatusBar } from "expo-status-bar";
import { Slot } from "expo-router";
import { View } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./src/context/AuthContext";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <View style={{ flex: 1 }}>
          <StatusBar style="light" />
          <Slot /> {/* 👈 Qui il router inserirà le tue pagine */}
        </View>
      </AuthProvider>
    </QueryClientProvider>
  );
}
