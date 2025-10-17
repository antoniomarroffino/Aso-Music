import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import HomeScreen from "../screens/HomeScreen";
import SearchScreen from "../screens/SearchScreen";
import ArtistsScreen from "../screens/ArtistsScreen";
import { Ionicons } from "@expo/vector-icons";
import { Platform } from "react-native";

const Tab = createBottomTabNavigator();

export default function BottomTabs() {
    return (
        <NavigationContainer>
            <Tab.Navigator
                screenOptions={({ route }) => ({
                    headerShown: false,
                    // 🔹 Margini e padding bilanciati per evitare troncamenti
                    tabBarStyle: {
                        backgroundColor: "#121212",
                        borderTopColor: "#333",
                        paddingBottom: Platform.OS === "ios" ? 25 : 10,
                        paddingTop: 6,
                        height: Platform.OS === "ios" ? 85 : 70,
                    },
                    tabBarLabelStyle: {
                        fontSize: 12,
                        marginBottom: Platform.OS === "ios" ? 5 : 2,
                    },
                    tabBarActiveTintColor: "#1DB954",
                    tabBarInactiveTintColor: "#888",
                    tabBarIcon: ({ color, size }) => {
                        let iconName: keyof typeof Ionicons.glyphMap = "musical-notes";

                        if (route.name === "Home") iconName = "home";
                        else if (route.name === "Search") iconName = "search";
                        else if (route.name === "Artists") iconName = "people";

                        return <Ionicons name={iconName} size={size} color={color} />;
                    },
                })}
            >
                <Tab.Screen name="Home" component={HomeScreen} />
                <Tab.Screen name="Search" component={SearchScreen} />
                <Tab.Screen name="Artists" component={ArtistsScreen} />
            </Tab.Navigator>
        </NavigationContainer>
    );
}
