import React, {
    memo,
    useEffect,
    useRef,
} from "react";
import {
    ActivityIndicator,
    Platform,
    StyleSheet,
    Text,
    View,
} from "react-native";
import {
    DarkTheme,
    ThemeProvider,
    type Theme,
} from "@react-navigation/native";
import {
    QueryClient,
    QueryClientProvider,
} from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
    Audio,
    InterruptionModeAndroid,
    InterruptionModeIOS,
} from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { MotiView } from "moti";
import { Ionicons } from "@expo/vector-icons";
import {
    GestureHandlerRootView,
} from "react-native-gesture-handler";

import {
    AuthProvider,
    useAuth,
} from "@/context/AuthContext";
import {
    PlayerProvider,
} from "@/context/PlayerContext";
import { useAlbums } from "@/hooks/useAlbums";
import {
    usePrefetchAllSongs,
} from "@/hooks/usePrefetchAllSongs";

/* -------------------------------------------------------------------------- */
/* Configuration                                                              */
/* -------------------------------------------------------------------------- */

const MAINTENANCE_MODE = false;

const MAINTENANCE_ADMIN_EMAIL =
    "admin@prova.com";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime:
                1000 * 60 * 5,
            gcTime:
                1000 * 60 * 30,
            retry: 2,
            refetchOnWindowFocus:
                false,
            refetchOnReconnect:
                true,
        },
        mutations: {
            retry: false,
        },
    },
});

const ASO_DARK_THEME: Theme = {
    ...DarkTheme,
    dark: true,
    colors: {
        ...DarkTheme.colors,
        primary: "#1ED760",
        background: "#050506",
        card: "#090B11",
        text: "#F7F8FC",
        border:
            "rgba(255,255,255,0.06)",
        notification: "#8064FF",
    },
};

/* -------------------------------------------------------------------------- */
/* Shared stack options                                                       */
/* -------------------------------------------------------------------------- */

const SHARED_STACK_OPTIONS = {
    headerShown: false,
    contentStyle: {
        backgroundColor: "#050506",
    },
} as const;

/* -------------------------------------------------------------------------- */
/* Background                                                                 */
/* -------------------------------------------------------------------------- */

const AmbientBackground = memo(
    function AmbientBackground() {
        return (
            <View
                pointerEvents="none"
                style={
                    StyleSheet.absoluteFillObject
                }
            >
                <LinearGradient
                    colors={[
                        "#050609",
                        "#080A11",
                        "#0D0B19",
                        "#050506",
                    ]}
                    locations={[
                        0,
                        0.32,
                        0.72,
                        1,
                    ]}
                    style={
                        StyleSheet.absoluteFillObject
                    }
                />

                <MotiView
                    from={{
                        opacity: 0.25,
                        scale: 0.94,
                    }}
                    animate={{
                        opacity: 0.48,
                        scale: 1.07,
                    }}
                    transition={{
                        type: "timing",
                        duration: 7000,
                        loop: true,
                        repeatReverse: true,
                    }}
                    style={[
                        styles.ambientOrb,
                        styles.greenOrb,
                    ]}
                >
                    <LinearGradient
                        colors={[
                            "rgba(29,185,84,0.28)",
                            "rgba(29,185,84,0.03)",
                            "transparent",
                        ]}
                        style={
                            StyleSheet.absoluteFillObject
                        }
                    />
                </MotiView>

                <MotiView
                    from={{
                        opacity: 0.18,
                        scale: 1.05,
                    }}
                    animate={{
                        opacity: 0.4,
                        scale: 0.94,
                    }}
                    transition={{
                        type: "timing",
                        duration: 8500,
                        loop: true,
                        repeatReverse: true,
                    }}
                    style={[
                        styles.ambientOrb,
                        styles.purpleOrb,
                    ]}
                >
                    <LinearGradient
                        colors={[
                            "rgba(123,97,255,0.26)",
                            "rgba(123,97,255,0.02)",
                            "transparent",
                        ]}
                        style={
                            StyleSheet.absoluteFillObject
                        }
                    />
                </MotiView>

                <LinearGradient
                    colors={[
                        "transparent",
                        "rgba(255,255,255,0.012)",
                        "transparent",
                    ]}
                    start={{
                        x: 0,
                        y: 0,
                    }}
                    end={{
                        x: 1,
                        y: 1,
                    }}
                    style={styles.lightBeam}
                />
            </View>
        );
    },
);

/* -------------------------------------------------------------------------- */
/* Premium loader                                                             */
/* -------------------------------------------------------------------------- */

type PremiumLoaderProps = {
    label?: string;
    description?: string;
};

const PremiumLoader = memo(
    function PremiumLoader({
                               label = "Preparazione esperienza",
                               description = "Sincronizzazione ASO Music",
                           }: PremiumLoaderProps) {
        return (
            <View
                style={
                    styles.loaderContainer
                }
            >
                <AmbientBackground />

                <View
                    style={
                        styles.loaderContent
                    }
                >
                    <View
                        style={
                            styles.logoStage
                        }
                    >
                        <MotiView
                            from={{
                                rotate: "0deg",
                            }}
                            animate={{
                                rotate:
                                    "360deg",
                            }}
                            transition={{
                                type: "timing",
                                duration: 9000,
                                loop: true,
                            }}
                            style={
                                styles.outerOrbit
                            }
                        >
                            <LinearGradient
                                colors={[
                                    "#1ED760",
                                    "rgba(29,185,84,0.05)",
                                    "#8064FF",
                                    "rgba(128,100,255,0.05)",
                                    "#1ED760",
                                ]}
                                style={
                                    StyleSheet.absoluteFillObject
                                }
                            />
                        </MotiView>

                        <MotiView
                            from={{
                                rotate:
                                    "360deg",
                            }}
                            animate={{
                                rotate: "0deg",
                            }}
                            transition={{
                                type: "timing",
                                duration: 6200,
                                loop: true,
                            }}
                            style={
                                styles.innerOrbit
                            }
                        />

                        <LinearGradient
                            colors={[
                                "#68FFA0",
                                "#1ED760",
                                "#7761FF",
                            ]}
                            start={{
                                x: 0,
                                y: 0,
                            }}
                            end={{
                                x: 1,
                                y: 1,
                            }}
                            style={
                                styles.logoBorder
                            }
                        >
                            <BlurView
                                intensity={45}
                                tint="dark"
                                style={
                                    styles.logoBlur
                                }
                            >
                                <LinearGradient
                                    colors={[
                                        "rgba(12,18,15,0.96)",
                                        "rgba(16,13,28,0.96)",
                                    ]}
                                    style={
                                        styles.logoSurface
                                    }
                                >
                                    <Ionicons
                                        name="musical-notes"
                                        size={30}
                                        color="#69F69A"
                                    />
                                </LinearGradient>
                            </BlurView>
                        </LinearGradient>

                        <MotiView
                            from={{
                                opacity: 0.2,
                                scale: 0.75,
                            }}
                            animate={{
                                opacity: 0.9,
                                scale: 1.15,
                            }}
                            transition={{
                                type: "timing",
                                duration: 1300,
                                loop: true,
                                repeatReverse: true,
                            }}
                            style={
                                styles.logoPulse
                            }
                        />
                    </View>

                    <Text
                        style={
                            styles.loaderEyebrow
                        }
                    >
                        ASO MUSIC
                    </Text>

                    <Text
                        style={
                            styles.loaderTitle
                        }
                    >
                        {label}
                    </Text>

                    <Text
                        style={
                            styles.loaderDescription
                        }
                    >
                        {description}
                    </Text>

                    <View
                        style={
                            styles.loadingIndicator
                        }
                    >
                        <LinearGradient
                            colors={[
                                "rgba(255,255,255,0.12)",
                                "rgba(255,255,255,0.025)",
                            ]}
                            style={
                                styles.loadingIndicatorBorder
                            }
                        >
                            <View
                                style={
                                    styles.loadingIndicatorSurface
                                }
                            >
                                <ActivityIndicator
                                    size="small"
                                    color="#1ED760"
                                />

                                <Text
                                    style={
                                        styles.loadingText
                                    }
                                >
                                    Caricamento
                                </Text>
                            </View>
                        </LinearGradient>
                    </View>

                    <View
                        style={
                            styles.loadingDots
                        }
                    >
                        {[0, 1, 2].map(
                            (dotIndex) => (
                                <MotiView
                                    key={
                                        dotIndex
                                    }
                                    from={{
                                        opacity:
                                            0.25,
                                        scale: 0.7,
                                    }}
                                    animate={{
                                        opacity: 1,
                                        scale: 1,
                                    }}
                                    transition={{
                                        type: "timing",
                                        duration:
                                            700,
                                        delay:
                                            dotIndex *
                                            180,
                                        loop: true,
                                        repeatReverse:
                                            true,
                                    }}
                                    style={
                                        styles.loadingDot
                                    }
                                />
                            ),
                        )}
                    </View>
                </View>
            </View>
        );
    },
);

/* -------------------------------------------------------------------------- */
/* Authenticated app                                                          */
/* -------------------------------------------------------------------------- */

function AuthenticatedAppLayout() {
    const {
        data: albumPreviews,
    } = useAlbums();

    /*
     * Il prefetch parte soltanto dopo che
     * l'utente è stato autenticato.
     */
    usePrefetchAllSongs(
        albumPreviews,
    );

    return (
        <Stack
            screenOptions={{
                ...SHARED_STACK_OPTIONS,
                animation: "fade",
                gestureEnabled: true,
            }}
        >
            <Stack.Screen
                name="(tabs)"
                options={{
                    animation: "fade",
                }}
            />

            <Stack.Screen
                name="fullplayer"
                options={{
                    presentation:
                        "fullScreenModal",
                    animation:
                        "slide_from_bottom",

                    /*
                     * Il full player gestisce già
                     * la propria gesture verticale.
                     */
                    gestureEnabled: false,
                }}
            />
        </Stack>
    );
}

/* -------------------------------------------------------------------------- */
/* Auth gate                                                                  */
/* -------------------------------------------------------------------------- */

function AuthGateLayout() {
    const {
        firebaseUser,
        loadingAuth,
        logout,
    } = useAuth();

    const maintenanceLogoutStarted =
        useRef(false);

    const normalizedEmail =
        firebaseUser?.email
            ?.trim()
            .toLowerCase();

    const isAdmin =
        normalizedEmail ===
        MAINTENANCE_ADMIN_EMAIL;

    const shouldForceLogout =
        MAINTENANCE_MODE &&
        Boolean(firebaseUser) &&
        !isAdmin;

    /*
     * Non bisogna chiamare logout durante
     * il render. Lo eseguiamo come effetto.
     */
    useEffect(() => {
        if (!shouldForceLogout) {
            maintenanceLogoutStarted.current =
                false;
            return;
        }

        if (
            maintenanceLogoutStarted.current
        ) {
            return;
        }

        maintenanceLogoutStarted.current =
            true;

        void logout().catch(
            (error: unknown) => {
                maintenanceLogoutStarted.current =
                    false;

                console.error(
                    "Errore durante il logout per manutenzione:",
                    error,
                );
            },
        );
    }, [
        logout,
        shouldForceLogout,
    ]);

    if (
        loadingAuth ||
        shouldForceLogout
    ) {
        return (
            <PremiumLoader
                label={
                    shouldForceLogout
                        ? "Manutenzione in corso"
                        : "Avvio applicazione"
                }
                description={
                    shouldForceLogout
                        ? "Chiusura sicura della sessione"
                        : "Preparazione della tua musica"
                }
            />
        );
    }

    if (
        MAINTENANCE_MODE &&
        !firebaseUser
    ) {
        return (
            <Stack
                screenOptions={{
                    ...SHARED_STACK_OPTIONS,
                    animation: "fade",
                }}
            >
                <Stack.Screen
                    name="maintenance"
                />
            </Stack>
        );
    }

    if (firebaseUser) {
        return (
            <AuthenticatedAppLayout />
        );
    }

    return (
        <Stack
            screenOptions={{
                ...SHARED_STACK_OPTIONS,
                animation:
                    "fade_from_bottom",
                gestureEnabled: false,
            }}
        >
            <Stack.Screen
                name="(auth)"
            />
        </Stack>
    );
}

/* -------------------------------------------------------------------------- */
/* Root layout                                                                */
/* -------------------------------------------------------------------------- */

export default function RootLayout() {
    useEffect(() => {
        void Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            staysActiveInBackground: true,
            playsInSilentModeIOS: true,
            interruptionModeIOS:
            InterruptionModeIOS.DoNotMix,
            interruptionModeAndroid:
            InterruptionModeAndroid.DoNotMix,
            shouldDuckAndroid: false,
            playThroughEarpieceAndroid:
                false,
        }).catch((error: unknown) => {
            console.error(
                "Impossibile configurare la modalità audio:",
                error,
            );
        });
    }, []);

    return (
        <GestureHandlerRootView
            style={styles.root}
        >
            <QueryClientProvider
                client={queryClient}
            >
                <ThemeProvider
                    value={
                        ASO_DARK_THEME
                    }
                >
                    <AuthProvider>
                        <PlayerProvider>
                            <View
                                style={
                                    styles.appShell
                                }
                            >
                                <AmbientBackground />

                                <AuthGateLayout />

                                {Platform.OS !==
                                    "web" && (
                                        <StatusBar
                                            style="light"
                                            translucent
                                        />
                                    )}
                            </View>
                        </PlayerProvider>
                    </AuthProvider>
                </ThemeProvider>
            </QueryClientProvider>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: "#050506",
    },

    appShell: {
        flex: 1,
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#050506",
    },

    ambientOrb: {
        position: "absolute",
        overflow: "hidden",
        borderRadius: 999,
    },

    greenOrb: {
        width: 470,
        height: 470,
        top: -250,
        right: -220,
    },

    purpleOrb: {
        width: 440,
        height: 440,
        bottom: -230,
        left: -240,
    },

    lightBeam: {
        position: "absolute",
        top: "-15%",
        left: "42%",
        width: 90,
        height: "135%",
        opacity: 0.3,
        transform: [
            {
                rotate: "24deg",
            },
        ],
    },

    loaderContainer: {
        flex: 1,
        position: "relative",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        backgroundColor: "#050506",
    },

    loaderContent: {
        width: "100%",
        maxWidth: 440,
        alignItems: "center",
        paddingHorizontal: 24,
    },

    logoStage: {
        width: 150,
        height: 150,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 22,
    },

    outerOrbit: {
        position: "absolute",
        width: 144,
        height: 144,
        overflow: "hidden",
        borderRadius: 72,
        opacity: 0.78,
        padding: 1,
    },

    innerOrbit: {
        position: "absolute",
        width: 116,
        height: 116,
        borderRadius: 58,
        borderWidth: 1,
        borderStyle: "dashed",
        borderColor:
            "rgba(174,151,255,0.36)",
    },

    logoBorder: {
        width: 82,
        height: 82,
        padding: 2,
        borderRadius: 26,
        shadowColor: "#1ED760",
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.3,
        shadowRadius: 18,
        elevation: 10,
    },

    logoBlur: {
        flex: 1,
        overflow: "hidden",
        borderRadius: 24,
    },

    logoSurface: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 24,
        borderWidth: 1,
        borderColor:
            "rgba(255,255,255,0.08)",
    },

    logoPulse: {
        position: "absolute",
        width: 94,
        height: 94,
        borderRadius: 47,
        borderWidth: 1,
        borderColor:
            "rgba(29,185,84,0.30)",
    },

    loaderEyebrow: {
        color: "#62EA93",
        fontSize: 8,
        lineHeight: 11,
        fontWeight: "900",
        letterSpacing: 2,
        marginBottom: 5,
    },

    loaderTitle: {
        color: "#F7F8FC",
        fontSize: 23,
        lineHeight: 28,
        fontWeight: "900",
        textAlign: "center",
        letterSpacing: -0.65,
    },

    loaderDescription: {
        color: "#7D8598",
        fontSize: 11,
        lineHeight: 16,
        fontWeight: "600",
        textAlign: "center",
        marginTop: 5,
    },

    loadingIndicator: {
        overflow: "hidden",
        borderRadius: 999,
        marginTop: 20,
    },

    loadingIndicatorBorder: {
        padding: 1,
        borderRadius: 999,
    },

    loadingIndicatorSurface: {
        minWidth: 126,
        height: 36,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingHorizontal: 14,
        borderRadius: 999,
        backgroundColor:
            "rgba(10,12,18,0.94)",
    },

    loadingText: {
        color: "#B3B9C8",
        fontSize: 10,
        fontWeight: "700",
    },

    loadingDots: {
        flexDirection: "row",
        gap: 5,
        marginTop: 13,
    },

    loadingDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: "#7E66FF",
    },
});