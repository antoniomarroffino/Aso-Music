import 'react-native-reanimated';
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "./src/context/AuthContext";
import LoginScreen from "./src/screens/LoginScreen";
import BottomTabs from "./src/navigation/BottomTabs";
import {useAuth} from "./src/hooks/useAuth";
import { View } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

function Root() {
    const { user } = useAuth();

    return (
        <View style={{ flex: 1 }}>
            {user ? <BottomTabs /> : <LoginScreen />}
            <StatusBar style="light" />
        </View>
    );
}

export default function App() {
    return (
        <QueryClientProvider client={queryClient}>
        <AuthProvider>
            <Root />
        </AuthProvider>
        </QueryClientProvider>
    );
}
