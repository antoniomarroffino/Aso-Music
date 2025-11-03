import React from "react";
import { ScrollView, ScrollViewProps } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SafeScrollView({
                                           children,
                                           contentContainerStyle,
                                           ...props
                                       }: ScrollViewProps) {
    const insets = useSafeAreaInsets();

    return (
        <ScrollView
            {...props}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
                { flexGrow: 1, paddingBottom: insets.bottom + 120 },
                contentContainerStyle,
            ]}
        >
            {children}
        </ScrollView>
    );
}
