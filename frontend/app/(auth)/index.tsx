import React, {
    memo,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { MotiView } from "moti";
import { Ionicons } from "@expo/vector-icons";
import {
    Stack,
    useRouter,
} from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";

type IoniconName =
    keyof typeof Ionicons.glyphMap;

type LoginFieldProps = {
    label: string;
    placeholder: string;
    icon: IoniconName;
    value: string;
    onChangeText: (
        value: string,
    ) => void;
    keyboardType?:
        | "default"
        | "email-address";
    secureTextEntry?: boolean;
    passwordVisible?: boolean;
    showPasswordToggle?: boolean;
    onTogglePasswordVisibility?: () => void;
    editable?: boolean;
    returnKeyType?:
        | "done"
        | "next"
        | "go";
    onSubmitEditing?: () => void;
};

const LoginField = memo(
    function LoginField({
                            label,
                            placeholder,
                            icon,
                            value,
                            onChangeText,
                            keyboardType = "default",
                            secureTextEntry = false,
                            passwordVisible = false,
                            showPasswordToggle = false,
                            onTogglePasswordVisibility,
                            editable = true,
                            returnKeyType = "next",
                            onSubmitEditing,
                        }: LoginFieldProps) {
        const [
            focused,
            setFocused,
        ] = useState(false);

        return (
            <View style={styles.fieldWrapper}>
                <Text style={styles.fieldLabel}>
                    {label}
                </Text>

                <LinearGradient
                    colors={
                        focused
                            ? [
                                "rgba(29,185,84,0.62)",
                                "rgba(119,89,255,0.40)",
                                "rgba(255,255,255,0.08)",
                            ]
                            : [
                                "rgba(255,255,255,0.13)",
                                "rgba(255,255,255,0.025)",
                            ]
                    }
                    start={{
                        x: 0,
                        y: 0,
                    }}
                    end={{
                        x: 1,
                        y: 1,
                    }}
                    style={styles.inputBorder}
                >
                    <View
                        style={[
                            styles.inputSurface,
                            focused &&
                            styles.inputSurfaceFocused,
                        ]}
                    >
                        <LinearGradient
                            colors={
                                focused
                                    ? [
                                        "rgba(29,185,84,0.18)",
                                        "rgba(119,89,255,0.10)",
                                    ]
                                    : [
                                        "rgba(255,255,255,0.06)",
                                        "rgba(255,255,255,0.025)",
                                    ]
                            }
                            style={styles.inputIcon}
                        >
                            <Ionicons
                                name={icon}
                                size={17}
                                color={
                                    focused
                                        ? "#5CEA90"
                                        : "#7E8698"
                                }
                            />
                        </LinearGradient>

                        <TextInput
                            accessibilityLabel={label}
                            value={value}
                            onChangeText={
                                onChangeText
                            }
                            placeholder={
                                placeholder
                            }
                            placeholderTextColor="#5F6779"
                            keyboardType={
                                keyboardType
                            }
                            autoCapitalize="none"
                            autoCorrect={false}
                            editable={editable}
                            secureTextEntry={
                                secureTextEntry &&
                                !passwordVisible
                            }
                            cursorColor="#1ED760"
                            selectionColor="rgba(29,185,84,0.32)"
                            returnKeyType={
                                returnKeyType
                            }
                            onSubmitEditing={
                                onSubmitEditing
                            }
                            onFocus={() =>
                                setFocused(true)
                            }
                            onBlur={() =>
                                setFocused(false)
                            }
                            style={styles.input}
                        />

                        {showPasswordToggle && (
                            <TouchableOpacity
                                accessibilityRole="button"
                                accessibilityLabel={
                                    passwordVisible
                                        ? "Nascondi password"
                                        : "Mostra password"
                                }
                                activeOpacity={0.68}
                                onPress={
                                    onTogglePasswordVisibility
                                }
                                style={
                                    styles.passwordToggle
                                }
                            >
                                <Ionicons
                                    name={
                                        passwordVisible
                                            ? "eye-off-outline"
                                            : "eye-outline"
                                    }
                                    size={17}
                                    color="#9299A9"
                                />
                            </TouchableOpacity>
                        )}
                    </View>
                </LinearGradient>
            </View>
        );
    },
);

const AmbientBackground = memo(
    function AmbientBackground() {
        return (
            <>
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
                        StyleSheet.absoluteFill
                    }
                />

                <MotiView
                    pointerEvents="none"
                    from={{
                        opacity: 0.2,
                        scale: 0.94,
                    }}
                    animate={{
                        opacity: 0.43,
                        scale: 1.06,
                    }}
                    transition={{
                        type: "timing",
                        duration: 7600,
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
                            "rgba(29,185,84,0.27)",
                            "rgba(29,185,84,0.02)",
                            "transparent",
                        ]}
                        style={
                            StyleSheet.absoluteFill
                        }
                    />
                </MotiView>

                <MotiView
                    pointerEvents="none"
                    from={{
                        opacity: 0.17,
                        scale: 1.05,
                    }}
                    animate={{
                        opacity: 0.37,
                        scale: 0.95,
                    }}
                    transition={{
                        type: "timing",
                        duration: 9000,
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
                            "rgba(119,89,255,0.24)",
                            "rgba(119,89,255,0.02)",
                            "transparent",
                        ]}
                        style={
                            StyleSheet.absoluteFill
                        }
                    />
                </MotiView>
            </>
        );
    },
);

function getLoginErrorMessage(
    error: unknown,
): string {
    let code = "";
    let message = "";

    if (error instanceof Error) {
        message = error.message;
    }

    if (
        typeof error === "object" &&
        error !== null &&
        "code" in error
    ) {
        const errorCode = (
            error as {
                code?: unknown;
            }
        ).code;

        if (
            typeof errorCode ===
            "string"
        ) {
            code = errorCode;
        }
    }

    const normalizedError =
        `${code} ${message}`.toLowerCase();

    if (
        normalizedError.includes(
            "auth/invalid-credential",
        ) ||
        normalizedError.includes(
            "invalid credential",
        )
    ) {
        return "Email o password non corretti.";
    }

    if (
        normalizedError.includes(
            "auth/user-not-found",
        ) ||
        normalizedError.includes(
            "user not found",
        )
    ) {
        return "Non esiste un account associato a questa email.";
    }

    if (
        normalizedError.includes(
            "auth/wrong-password",
        ) ||
        normalizedError.includes(
            "wrong password",
        )
    ) {
        return "La password inserita non è corretta.";
    }

    if (
        normalizedError.includes(
            "auth/too-many-requests",
        ) ||
        normalizedError.includes(
            "too many requests",
        )
    ) {
        return "Sono stati effettuati troppi tentativi. Riprova più tardi.";
    }

    if (
        normalizedError.includes(
            "auth/network-request-failed",
        ) ||
        normalizedError.includes(
            "network",
        ) ||
        normalizedError.includes(
            "connessione",
        )
    ) {
        return "Impossibile contattare il servizio. Controlla la connessione.";
    }

    if (
        normalizedError.includes(
            "autenticazione backend fallita",
        )
    ) {
        return "Firebase ha autenticato l'utente, ma il server non ha completato l'accesso.";
    }

    return "Non è stato possibile completare l'accesso.";
}

type AuthLoadingStateProps = {
    topInset: number;
};

const AuthLoadingState = memo(
    function AuthLoadingState({
                                  topInset,
                              }: AuthLoadingStateProps) {
        return (
            <View style={styles.container}>
                <AmbientBackground />
                <StatusBar style="light" />

                <View
                    style={[
                        styles.authLoadingContainer,
                        {
                            paddingTop:
                            topInset,
                        },
                    ]}
                >
                    <MotiView
                        from={{
                            opacity: 0,
                            scale: 0.9,
                        }}
                        animate={{
                            opacity: 1,
                            scale: 1,
                        }}
                        transition={{
                            type: "spring",
                            damping: 17,
                        }}
                        style={
                            styles.authLoadingContent
                        }
                    >
                        <MotiView
                            from={{
                                rotate: "0deg",
                            }}
                            animate={{
                                rotate: "360deg",
                            }}
                            transition={{
                                type: "timing",
                                duration: 2200,
                                loop: true,
                            }}
                            style={
                                styles.authLoadingOrbit
                            }
                        />

                        <LinearGradient
                            colors={[
                                "#62F197",
                                "#1DB954",
                                "#7560FF",
                            ]}
                            style={
                                styles.authLoadingLogoBorder
                            }
                        >
                            <Image
                                source={require(
                                    "@/assets/images/icon.png",
                                )}
                                style={
                                    styles.authLoadingLogo
                                }
                                contentFit="cover"
                            />
                        </LinearGradient>

                        <Text
                            style={
                                styles.authLoadingTitle
                            }
                        >
                            ASO Music
                        </Text>

                        <View
                            style={
                                styles.authLoadingBadge
                            }
                        >
                            <ActivityIndicator
                                size="small"
                                color="#1ED760"
                            />

                            <Text
                                style={
                                    styles.authLoadingText
                                }
                            >
                                Verifica della sessione
                            </Text>
                        </View>
                    </MotiView>
                </View>
            </View>
        );
    },
);

export default function LoginScreen() {
    const {
        login,
        firebaseUser,
        loadingAuth,
    } = useAuth();

    const router = useRouter();
    const insets =
        useSafeAreaInsets();

    const {
        width: windowWidth,
    } = useWindowDimensions();

    const [
        email,
        setEmail,
    ] = useState("");

    const [
        password,
        setPassword,
    ] = useState("");

    const [
        passwordVisible,
        setPasswordVisible,
    ] = useState(false);

    const [
        loading,
        setLoading,
    ] = useState(false);

    useEffect(() => {
        if (
            !loadingAuth &&
            firebaseUser
        ) {
            router.replace("/(tabs)");
        }
    }, [
        firebaseUser,
        loadingAuth,
        router,
    ]);

    const logoSize = useMemo(
        () =>
            Math.min(
                104,
                Math.max(
                    80,
                    windowWidth * 0.22,
                ),
            ),
        [windowWidth],
    );

    const logoStyle = useMemo(
        () => ({
            width: logoSize,
            height: logoSize,
            borderRadius:
                logoSize * 0.28,
        }),
        [logoSize],
    );

    const submitting =
        loading || loadingAuth;

    const handleTogglePassword =
        useCallback(() => {
            setPasswordVisible(
                (currentValue) =>
                    !currentValue,
            );
        }, []);

    const handleOpenSignup =
        useCallback(() => {
            if (submitting) {
                return;
            }

            router.push(
                "/(auth)/signup",
            );
        }, [
            router,
            submitting,
        ]);

    const handleLogin =
        useCallback(async () => {
            if (submitting) {
                return;
            }

            const normalizedEmail =
                email
                    .trim()
                    .toLowerCase();

            if (!normalizedEmail) {
                Alert.alert(
                    "Email mancante",
                    "Inserisci il tuo indirizzo email.",
                );

                return;
            }

            const emailRegex =
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (
                !emailRegex.test(
                    normalizedEmail,
                )
            ) {
                Alert.alert(
                    "Email non valida",
                    "Controlla l'indirizzo email inserito.",
                );

                return;
            }

            if (!password) {
                Alert.alert(
                    "Password mancante",
                    "Inserisci la password del tuo account.",
                );

                return;
            }

            try {
                setLoading(true);

                await login(
                    normalizedEmail,
                    password,
                );
            } catch (error: unknown) {
                console.error(
                    "Errore durante il login:",
                    error,
                );

                Alert.alert(
                    "Accesso non riuscito",
                    getLoginErrorMessage(
                        error,
                    ),
                );
            } finally {
                setLoading(false);
            }
        }, [
            email,
            login,
            password,
            submitting,
        ]);

    if (loadingAuth) {
        return (
            <AuthLoadingState
                topInset={insets.top}
            />
        );
    }

    return (
        <View style={styles.container}>
            <Stack.Screen
                options={{
                    headerShown: false,
                }}
            />

            <StatusBar style="light" />

            <AmbientBackground />

            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={
                    Platform.OS === "ios"
                        ? "padding"
                        : undefined
                }
            >
                <ScrollView
                    showsVerticalScrollIndicator={
                        false
                    }
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={[
                        styles.scrollContent,
                        {
                            paddingTop:
                                insets.top + 24,
                            paddingBottom:
                                Math.max(
                                    insets.bottom,
                                    20,
                                ) + 24,
                        },
                    ]}
                >
                    <View
                        style={
                            styles.contentShell
                        }
                    >
                        <MotiView
                            from={{
                                opacity: 0,
                                scale: 0.94,
                                translateY: -12,
                            }}
                            animate={{
                                opacity: 1,
                                scale: 1,
                                translateY: 0,
                            }}
                            transition={{
                                type: "spring",
                                damping: 17,
                            }}
                            style={styles.hero}
                        >
                            <View
                                style={
                                    styles.logoStage
                                }
                            >
                                <MotiView
                                    from={{
                                        rotate:
                                            "0deg",
                                    }}
                                    animate={{
                                        rotate:
                                            "360deg",
                                    }}
                                    transition={{
                                        type: "timing",
                                        duration:
                                            18000,
                                        loop: true,
                                    }}
                                    style={[
                                        styles.logoOrbit,
                                        {
                                            width:
                                                logoSize +
                                                18,
                                            height:
                                                logoSize +
                                                18,
                                            borderRadius:
                                                (logoSize +
                                                    18) /
                                                2,
                                        },
                                    ]}
                                />

                                <LinearGradient
                                    colors={[
                                        "#62F197",
                                        "#1DB954",
                                        "#7560FF",
                                    ]}
                                    style={[
                                        styles.logoBorder,
                                        logoStyle,
                                    ]}
                                >
                                    <Image
                                        source={require(
                                            "@/assets/images/icon.png",
                                        )}
                                        style={[
                                            styles.logoImage,
                                            logoStyle,
                                        ]}
                                        contentFit="cover"
                                    />
                                </LinearGradient>
                            </View>

                            <View
                                style={
                                    styles.brandBadge
                                }
                            >
                                <Ionicons
                                    name="musical-notes"
                                    size={10}
                                    color="#64EA94"
                                />

                                <Text
                                    style={
                                        styles.brandBadgeText
                                    }
                                >
                                    ASO MUSIC
                                </Text>
                            </View>

                            <Text
                                style={
                                    styles.title
                                }
                            >
                                Bentornato
                            </Text>

                            <Text
                                style={
                                    styles.subtitle
                                }
                            >
                                Accedi al tuo account e
                                continua ad ascoltare la
                                tua musica.
                            </Text>
                        </MotiView>

                        <MotiView
                            from={{
                                opacity: 0,
                                translateY: 16,
                            }}
                            animate={{
                                opacity: 1,
                                translateY: 0,
                            }}
                            transition={{
                                type: "spring",
                                damping: 17,
                                delay: 90,
                            }}
                        >
                            <LinearGradient
                                colors={[
                                    "rgba(29,185,84,0.32)",
                                    "rgba(119,89,255,0.25)",
                                    "rgba(255,255,255,0.07)",
                                ]}
                                style={
                                    styles.formBorder
                                }
                            >
                                <BlurView
                                    intensity={52}
                                    tint="dark"
                                    style={
                                        styles.formBlur
                                    }
                                >
                                    <View
                                        style={
                                            styles.form
                                        }
                                    >
                                        <View
                                            style={
                                                styles.formHeader
                                            }
                                        >
                                            <View
                                                style={
                                                    styles.formHeaderIcon
                                                }
                                            >
                                                <Ionicons
                                                    name="log-in-outline"
                                                    size={
                                                        18
                                                    }
                                                    color="#62EA92"
                                                />
                                            </View>

                                            <View
                                                style={
                                                    styles.formHeaderText
                                                }
                                            >
                                                <Text
                                                    style={
                                                        styles.formEyebrow
                                                    }
                                                >
                                                    AREA PERSONALE
                                                </Text>

                                                <Text
                                                    style={
                                                        styles.formTitle
                                                    }
                                                >
                                                    Accedi
                                                </Text>
                                            </View>
                                        </View>

                                        <View
                                            style={
                                                styles.formDivider
                                            }
                                        />

                                        <LoginField
                                            label="Email"
                                            placeholder="nome@esempio.com"
                                            icon="mail-outline"
                                            value={email}
                                            onChangeText={
                                                setEmail
                                            }
                                            keyboardType="email-address"
                                            returnKeyType="next"
                                            editable={
                                                !submitting
                                            }
                                        />

                                        <LoginField
                                            label="Password"
                                            placeholder="Inserisci la password"
                                            icon="lock-closed-outline"
                                            value={
                                                password
                                            }
                                            onChangeText={
                                                setPassword
                                            }
                                            secureTextEntry
                                            showPasswordToggle
                                            passwordVisible={
                                                passwordVisible
                                            }
                                            onTogglePasswordVisibility={
                                                handleTogglePassword
                                            }
                                            returnKeyType="go"
                                            onSubmitEditing={() => {
                                                void handleLogin();
                                            }}
                                            editable={
                                                !submitting
                                            }
                                        />

                                        <TouchableOpacity
                                            accessibilityRole="button"
                                            accessibilityLabel="Accedi"
                                            activeOpacity={
                                                0.82
                                            }
                                            disabled={
                                                submitting
                                            }
                                            onPress={() => {
                                                void handleLogin();
                                            }}
                                            style={[
                                                styles.loginButton,
                                                submitting &&
                                                styles.loginButtonDisabled,
                                            ]}
                                        >
                                            <LinearGradient
                                                colors={[
                                                    "#68F99D",
                                                    "#1DB954",
                                                    "#7560FF",
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
                                                    styles.loginButtonGradient
                                                }
                                            >
                                                <View
                                                    style={
                                                        styles.buttonHighlight
                                                    }
                                                />

                                                {submitting ? (
                                                    <>
                                                        <ActivityIndicator
                                                            size="small"
                                                            color="#041009"
                                                        />

                                                        <Text
                                                            style={
                                                                styles.loginButtonText
                                                            }
                                                        >
                                                            Accesso in
                                                            corso...
                                                        </Text>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Ionicons
                                                            name="log-in"
                                                            size={
                                                                17
                                                            }
                                                            color="#041009"
                                                        />

                                                        <Text
                                                            style={
                                                                styles.loginButtonText
                                                            }
                                                        >
                                                            Accedi
                                                        </Text>
                                                    </>
                                                )}
                                            </LinearGradient>
                                        </TouchableOpacity>
                                    </View>
                                </BlurView>
                            </LinearGradient>
                        </MotiView>

                        <MotiView
                            from={{
                                opacity: 0,
                                translateY: 8,
                            }}
                            animate={{
                                opacity: 1,
                                translateY: 0,
                            }}
                            transition={{
                                type: "timing",
                                duration: 300,
                                delay: 180,
                            }}
                            style={
                                styles.signupHint
                            }
                        >
                            <Text
                                style={
                                    styles.signupHintText
                                }
                            >
                                Non hai ancora un
                                account?
                            </Text>

                            <TouchableOpacity
                                accessibilityRole="button"
                                accessibilityLabel="Apri la registrazione"
                                activeOpacity={0.7}
                                disabled={
                                    submitting
                                }
                                onPress={
                                    handleOpenSignup
                                }
                                style={
                                    styles.signupLinkButton
                                }
                            >
                                <Text
                                    style={
                                        styles.signupLink
                                    }
                                >
                                    Registrati
                                </Text>

                                <Ionicons
                                    name="arrow-forward"
                                    size={12}
                                    color="#64E993"
                                />
                            </TouchableOpacity>
                        </MotiView>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#050506",
    },

    keyboardView: {
        flex: 1,
    },

    ambientOrb: {
        position: "absolute",
        overflow: "hidden",
        borderRadius: 999,
    },

    greenOrb: {
        width: 440,
        height: 440,
        top: -230,
        right: -210,
    },

    purpleOrb: {
        width: 420,
        height: 420,
        bottom: -220,
        left: -230,
    },

    scrollContent: {
        flexGrow: 1,
        justifyContent: "center",
        paddingHorizontal: 15,
    },

    contentShell: {
        width: "100%",
        maxWidth: 440,
        alignSelf: "center",
    },

    hero: {
        alignItems: "center",
        marginBottom: 24,
    },

    logoStage: {
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 14,
    },

    logoOrbit: {
        position: "absolute",
        borderWidth: 1,
        borderStyle: "dashed",
        borderColor:
            "rgba(119,89,255,0.36)",
    },

    logoBorder: {
        padding: 2,
        shadowColor: "#1DB954",
        shadowOffset: {
            width: 0,
            height: 7,
        },
        shadowOpacity: 0.27,
        shadowRadius: 14,
        elevation: 9,
    },

    logoImage: {
        backgroundColor: "#0B0E13",
    },

    brandBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        marginBottom: 6,
        borderRadius: 999,
        backgroundColor:
            "rgba(29,185,84,0.08)",
        borderWidth: 1,
        borderColor:
            "rgba(29,185,84,0.13)",
    },

    brandBadgeText: {
        color: "#77ECA0",
        fontSize: 7,
        lineHeight: 9,
        fontWeight: "900",
        letterSpacing: 1,
    },

    title: {
        color: "#F7F8FC",
        fontSize: 27,
        lineHeight: 32,
        fontWeight: "900",
        textAlign: "center",
        letterSpacing: -0.8,
    },

    subtitle: {
        maxWidth: 300,
        color: "#7C8496",
        fontSize: 11,
        lineHeight: 16,
        fontWeight: "500",
        textAlign: "center",
        marginTop: 5,
    },

    formBorder: {
        padding: 1,
        borderRadius: 22,
    },

    formBlur: {
        overflow: "hidden",
        borderRadius: 21,
    },

    form: {
        padding: 15,
        borderRadius: 21,
        backgroundColor:
            "rgba(9,11,16,0.93)",
        borderWidth: 1,
        borderColor:
            "rgba(255,255,255,0.025)",
    },

    formHeader: {
        flexDirection: "row",
        alignItems: "center",
    },

    formHeaderIcon: {
        width: 38,
        height: 38,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 9,
        borderRadius: 13,
        backgroundColor:
            "rgba(29,185,84,0.09)",
        borderWidth: 1,
        borderColor:
            "rgba(29,185,84,0.12)",
    },

    formHeaderText: {
        flex: 1,
        minWidth: 0,
    },

    formEyebrow: {
        color: "#626A7D",
        fontSize: 6,
        lineHeight: 8,
        fontWeight: "900",
        letterSpacing: 1.1,
    },

    formTitle: {
        color: "#F1F3F8",
        fontSize: 15,
        lineHeight: 19,
        fontWeight: "900",
    },

    formDivider: {
        height: 1,
        marginTop: 11,
        marginBottom: 14,
        backgroundColor:
            "rgba(255,255,255,0.055)",
    },

    fieldWrapper: {
        marginBottom: 12,
    },

    fieldLabel: {
        color: "#858D9E",
        fontSize: 8,
        lineHeight: 11,
        fontWeight: "800",
        textTransform: "uppercase",
        letterSpacing: 0.65,
        marginBottom: 5,
        marginLeft: 2,
    },

    inputBorder: {
        padding: 1,
        borderRadius: 15,
    },

    inputSurface: {
        minHeight: 50,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 7,
        borderRadius: 14,
        backgroundColor:
            "rgba(12,14,20,0.96)",
        borderWidth: 1,
        borderColor:
            "rgba(255,255,255,0.025)",
    },

    inputSurfaceFocused: {
        backgroundColor:
            "rgba(9,15,15,0.97)",
    },

    inputIcon: {
        width: 35,
        height: 35,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 8,
        borderRadius: 11,
        borderWidth: 1,
        borderColor:
            "rgba(255,255,255,0.04)",
    },

    input: {
        flex: 1,
        minWidth: 0,
        height: 48,
        paddingVertical: 0,
        color: "#F4F6FB",
        fontSize: 13,
        fontWeight: "600",
    },

    passwordToggle: {
        width: 34,
        height: 34,
        alignItems: "center",
        justifyContent: "center",
        marginLeft: 5,
        borderRadius: 11,
        backgroundColor:
            "rgba(255,255,255,0.035)",
    },

    loginButton: {
        width: "100%",
        minHeight: 50,
        overflow: "hidden",
        marginTop: 5,
        borderRadius: 15,
        shadowColor: "#1DB954",
        shadowOffset: {
            width: 0,
            height: 6,
        },
        shadowOpacity: 0.23,
        shadowRadius: 12,
        elevation: 7,
    },

    loginButtonDisabled: {
        opacity: 0.72,
    },

    loginButtonGradient: {
        position: "relative",
        flex: 1,
        minHeight: 50,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
        overflow: "hidden",
        borderRadius: 15,
    },

    buttonHighlight: {
        position: "absolute",
        top: 2,
        left: 28,
        right: 28,
        height: 12,
        borderRadius: 999,
        backgroundColor:
            "rgba(255,255,255,0.16)",
    },

    loginButtonText: {
        color: "#041009",
        fontSize: 12,
        lineHeight: 15,
        fontWeight: "900",
    },

    signupHint: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        flexWrap: "wrap",
        marginTop: 18,
    },

    signupHintText: {
        color: "#7D8597",
        fontSize: 10,
        lineHeight: 14,
        fontWeight: "600",
    },

    signupLinkButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 3,
        paddingHorizontal: 5,
        paddingVertical: 4,
        marginLeft: 2,
    },

    signupLink: {
        color: "#64E993",
        fontSize: 10,
        lineHeight: 14,
        fontWeight: "900",
    },

    authLoadingContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 24,
    },

    authLoadingContent: {
        alignItems: "center",
    },

    authLoadingOrbit: {
        position: "absolute",
        top: -9,
        width: 110,
        height: 110,
        borderRadius: 55,
        borderWidth: 1,
        borderStyle: "dashed",
        borderColor:
            "rgba(119,89,255,0.38)",
    },

    authLoadingLogoBorder: {
        width: 92,
        height: 92,
        padding: 2,
        borderRadius: 26,
        shadowColor: "#1DB954",
        shadowOffset: {
            width: 0,
            height: 7,
        },
        shadowOpacity: 0.25,
        shadowRadius: 14,
        elevation: 8,
    },

    authLoadingLogo: {
        width: "100%",
        height: "100%",
        borderRadius: 24,
        backgroundColor: "#0B0E13",
    },

    authLoadingTitle: {
        color: "#F5F7FC",
        fontSize: 21,
        lineHeight: 25,
        fontWeight: "900",
        letterSpacing: -0.5,
        marginTop: 16,
    },

    authLoadingBadge: {
        minHeight: 34,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 13,
        marginTop: 12,
        borderRadius: 999,
        backgroundColor:
            "rgba(255,255,255,0.045)",
        borderWidth: 1,
        borderColor:
            "rgba(255,255,255,0.055)",
    },

    authLoadingText: {
        color: "#8C94A6",
        fontSize: 9,
        fontWeight: "700",
    },
});