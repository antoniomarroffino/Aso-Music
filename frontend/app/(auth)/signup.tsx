import React, {
    memo,
    useCallback,
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

type ValidationResult = {
    valid: boolean;
    message?: string;
};

type SignupFieldProps = {
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
    autoCapitalize?:
        | "none"
        | "sentences"
        | "words";
    secureTextEntry?: boolean;
    showPasswordToggle?: boolean;
    passwordVisible?: boolean;
    onTogglePasswordVisibility?: () => void;
    editable?: boolean;
};

const SignupField = memo(
    function SignupField({
                             label,
                             placeholder,
                             icon,
                             value,
                             onChangeText,
                             keyboardType = "default",
                             autoCapitalize = "none",
                             secureTextEntry = false,
                             showPasswordToggle = false,
                             passwordVisible = false,
                             onTogglePasswordVisibility,
                             editable = true,
                         }: SignupFieldProps) {
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
                            autoCapitalize={
                                autoCapitalize
                            }
                            autoCorrect={false}
                            editable={editable}
                            secureTextEntry={
                                secureTextEntry &&
                                !passwordVisible
                            }
                            cursorColor="#1ED760"
                            selectionColor="rgba(29,185,84,0.32)"
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

function validateSignupForm({
                                firstName,
                                lastName,
                                username,
                                email,
                                password,
                                confirmPassword,
                            }: {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
}): ValidationResult {
    if (!firstName.trim()) {
        return {
            valid: false,
            message:
                "Inserisci il tuo nome.",
        };
    }

    if (!lastName.trim()) {
        return {
            valid: false,
            message:
                "Inserisci il tuo cognome.",
        };
    }

    const normalizedUsername =
        username.trim();

    if (
        normalizedUsername.length < 3
    ) {
        return {
            valid: false,
            message:
                "Lo username deve contenere almeno 3 caratteri.",
        };
    }

    if (
        /\s/.test(
            normalizedUsername,
        )
    ) {
        return {
            valid: false,
            message:
                "Lo username non può contenere spazi.",
        };
    }

    const normalizedEmail =
        email.trim();

    const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
        !emailRegex.test(
            normalizedEmail,
        )
    ) {
        return {
            valid: false,
            message:
                "Inserisci un indirizzo email valido.",
        };
    }

    if (password.length < 6) {
        return {
            valid: false,
            message:
                "La password deve contenere almeno 6 caratteri.",
        };
    }

    if (
        password !==
        confirmPassword
    ) {
        return {
            valid: false,
            message:
                "Le password inserite non coincidono.",
        };
    }

    return {
        valid: true,
    };
}

function getSignupErrorMessage(
    error: unknown,
): string {
    const fallbackMessage =
        "Si è verificato un errore durante la registrazione.";

    if (!(error instanceof Error)) {
        return fallbackMessage;
    }

    const normalizedMessage =
        error.message.toLowerCase();

    if (
        normalizedMessage.includes(
            "username già in uso",
        ) ||
        normalizedMessage.includes(
            "username-already-in-use",
        ) ||
        normalizedMessage.includes(
            "username already",
        )
    ) {
        return "Questo username è già stato utilizzato. Scegline un altro.";
    }

    if (
        normalizedMessage.includes(
            "email-already-in-use",
        ) ||
        normalizedMessage.includes(
            "email already",
        ) ||
        normalizedMessage.includes(
            "email già",
        )
    ) {
        return "Questa email è già associata a un account.";
    }

    if (
        normalizedMessage.includes(
            "weak-password",
        ) ||
        normalizedMessage.includes(
            "password debole",
        )
    ) {
        return "La password scelta è troppo debole.";
    }

    if (
        normalizedMessage.includes(
            "network",
        ) ||
        normalizedMessage.includes(
            "connessione",
        )
    ) {
        return "Impossibile completare la registrazione. Controlla la connessione.";
    }

    return fallbackMessage;
}

export default function SignupScreen() {
    const router = useRouter();
    const insets =
        useSafeAreaInsets();

    const {
        width: windowWidth,
    } = useWindowDimensions();

    const { signup } = useAuth();

    const [
        firstName,
        setFirstName,
    ] = useState("");

    const [
        lastName,
        setLastName,
    ] = useState("");

    const [
        username,
        setUsername,
    ] = useState("");

    const [
        email,
        setEmail,
    ] = useState("");

    const [
        password,
        setPassword,
    ] = useState("");

    const [
        confirmPassword,
        setConfirmPassword,
    ] = useState("");

    const [
        passwordVisible,
        setPasswordVisible,
    ] = useState(false);

    const [
        loading,
        setLoading,
    ] = useState(false);

    const logoSize = useMemo(
        () =>
            Math.min(
                92,
                Math.max(
                    72,
                    windowWidth * 0.2,
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

    const handleGoToLogin =
        useCallback(() => {
            if (loading) {
                return;
            }

            router.replace("/(auth)");
        }, [
            loading,
            router,
        ]);

    const handleTogglePassword =
        useCallback(() => {
            setPasswordVisible(
                (currentValue) =>
                    !currentValue,
            );
        }, []);

    const handleSignup =
        useCallback(async () => {
            if (loading) {
                return;
            }

            const validation =
                validateSignupForm({
                    firstName,
                    lastName,
                    username,
                    email,
                    password,
                    confirmPassword,
                });

            if (
                !validation.valid
            ) {
                Alert.alert(
                    "Controlla i dati",
                    validation.message,
                );

                return;
            }

            try {
                setLoading(true);

                await signup({
                    email: email
                        .trim()
                        .toLowerCase(),
                    password,
                    firstName:
                        firstName.trim(),
                    lastName:
                        lastName.trim(),
                    username:
                        username.trim(),
                });

                Alert.alert(
                    "Account creato",
                    "La registrazione è stata completata con successo.",
                );

                router.replace(
                    "/(auth)",
                );
            } catch (error: unknown) {
                console.error(
                    "Errore durante la registrazione:",
                    error,
                );

                Alert.alert(
                    "Registrazione non riuscita",
                    getSignupErrorMessage(
                        error,
                    ),
                );
            } finally {
                setLoading(false);
            }
        }, [
            confirmPassword,
            email,
            firstName,
            lastName,
            loading,
            password,
            router,
            signup,
            username,
        ]);

    return (
        <View style={styles.container}>
            <Stack.Screen
                options={{
                    headerShown: false,
                }}
            />

            <StatusBar style="light" />

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
                                insets.top + 16,
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
                                translateY: -12,
                            }}
                            animate={{
                                opacity: 1,
                                translateY: 0,
                            }}
                            transition={{
                                type: "spring",
                                damping: 17,
                            }}
                            style={styles.topBar}
                        >
                            <TouchableOpacity
                                accessibilityRole="button"
                                accessibilityLabel="Torna al login"
                                activeOpacity={0.7}
                                onPress={
                                    handleGoToLogin
                                }
                                disabled={loading}
                                style={
                                    styles.backButton
                                }
                            >
                                <LinearGradient
                                    colors={[
                                        "rgba(255,255,255,0.13)",
                                        "rgba(255,255,255,0.035)",
                                    ]}
                                    style={
                                        styles.backButtonGradient
                                    }
                                >
                                    <Ionicons
                                        name="chevron-back"
                                        size={20}
                                        color="#F5F7FC"
                                    />
                                </LinearGradient>
                            </TouchableOpacity>

                            <View
                                style={
                                    styles.topBarText
                                }
                            >
                                <Text
                                    style={
                                        styles.topBarEyebrow
                                    }
                                >
                                    ASO MUSIC
                                </Text>

                                <Text
                                    style={
                                        styles.topBarTitle
                                    }
                                >
                                    Registrazione
                                </Text>
                            </View>
                        </MotiView>

                        <MotiView
                            from={{
                                opacity: 0,
                                scale: 0.94,
                                translateY: 12,
                            }}
                            animate={{
                                opacity: 1,
                                scale: 1,
                                translateY: 0,
                            }}
                            transition={{
                                type: "spring",
                                damping: 17,
                                delay: 70,
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
                                                16,
                                            height:
                                                logoSize +
                                                16,
                                            borderRadius:
                                                (logoSize +
                                                    16) /
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

                            <Text
                                style={
                                    styles.appName
                                }
                            >
                                Crea il tuo account
                            </Text>

                            <Text
                                style={
                                    styles.subtitle
                                }
                            >
                                Inserisci i tuoi dati
                                per entrare in ASO
                                Music.
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
                                delay: 130,
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
                                                    name="person-add-outline"
                                                    size={
                                                        17
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
                                                    NUOVO PROFILO
                                                </Text>

                                                <Text
                                                    style={
                                                        styles.formTitle
                                                    }
                                                >
                                                    I tuoi dati
                                                </Text>
                                            </View>
                                        </View>

                                        <View
                                            style={
                                                styles.formDivider
                                            }
                                        />

                                        <SignupField
                                            label="Nome"
                                            placeholder="Inserisci il nome"
                                            icon="person-outline"
                                            value={
                                                firstName
                                            }
                                            onChangeText={
                                                setFirstName
                                            }
                                            autoCapitalize="words"
                                            editable={
                                                !loading
                                            }
                                        />

                                        <SignupField
                                            label="Cognome"
                                            placeholder="Inserisci il cognome"
                                            icon="person-outline"
                                            value={
                                                lastName
                                            }
                                            onChangeText={
                                                setLastName
                                            }
                                            autoCapitalize="words"
                                            editable={
                                                !loading
                                            }
                                        />

                                        <SignupField
                                            label="Username"
                                            placeholder="Scegli uno username"
                                            icon="at-outline"
                                            value={
                                                username
                                            }
                                            onChangeText={
                                                setUsername
                                            }
                                            editable={
                                                !loading
                                            }
                                        />

                                        <SignupField
                                            label="Email"
                                            placeholder="nome@esempio.com"
                                            icon="mail-outline"
                                            value={
                                                email
                                            }
                                            onChangeText={
                                                setEmail
                                            }
                                            keyboardType="email-address"
                                            editable={
                                                !loading
                                            }
                                        />

                                        <SignupField
                                            label="Password"
                                            placeholder="Almeno 6 caratteri"
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
                                            editable={
                                                !loading
                                            }
                                        />

                                        <SignupField
                                            label="Conferma password"
                                            placeholder="Ripeti la password"
                                            icon="shield-checkmark-outline"
                                            value={
                                                confirmPassword
                                            }
                                            onChangeText={
                                                setConfirmPassword
                                            }
                                            secureTextEntry
                                            showPasswordToggle
                                            passwordVisible={
                                                passwordVisible
                                            }
                                            onTogglePasswordVisibility={
                                                handleTogglePassword
                                            }
                                            editable={
                                                !loading
                                            }
                                        />

                                        <TouchableOpacity
                                            accessibilityRole="button"
                                            accessibilityLabel="Crea account"
                                            activeOpacity={
                                                0.82
                                            }
                                            disabled={
                                                loading
                                            }
                                            onPress={() => {
                                                void handleSignup();
                                            }}
                                            style={[
                                                styles.signupButton,
                                                loading &&
                                                styles.signupButtonDisabled,
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
                                                    styles.signupButtonGradient
                                                }
                                            >
                                                <View
                                                    style={
                                                        styles.buttonHighlight
                                                    }
                                                />

                                                {loading ? (
                                                    <>
                                                        <ActivityIndicator
                                                            size="small"
                                                            color="#041009"
                                                        />

                                                        <Text
                                                            style={
                                                                styles.signupButtonText
                                                            }
                                                        >
                                                            Creazione
                                                            account...
                                                        </Text>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Ionicons
                                                            name="person-add"
                                                            size={
                                                                17
                                                            }
                                                            color="#041009"
                                                        />

                                                        <Text
                                                            style={
                                                                styles.signupButtonText
                                                            }
                                                        >
                                                            Registrati
                                                        </Text>
                                                    </>
                                                )}
                                            </LinearGradient>
                                        </TouchableOpacity>

                                        <Text
                                            style={
                                                styles.passwordHint
                                            }
                                        >
                                            La password deve
                                            contenere almeno
                                            6 caratteri.
                                        </Text>
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
                                delay: 210,
                            }}
                            style={
                                styles.loginHint
                            }
                        >
                            <Text
                                style={
                                    styles.loginHintText
                                }
                            >
                                Hai già un account?
                            </Text>

                            <TouchableOpacity
                                accessibilityRole="button"
                                activeOpacity={0.7}
                                disabled={loading}
                                onPress={
                                    handleGoToLogin
                                }
                                style={
                                    styles.loginLinkButton
                                }
                            >
                                <Text
                                    style={
                                        styles.loginLink
                                    }
                                >
                                    Accedi
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
        maxWidth: 480,
        alignSelf: "center",
    },

    topBar: {
        minHeight: 45,
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 15,
    },

    backButton: {
        width: 39,
        height: 39,
        overflow: "hidden",
        marginRight: 11,
        borderRadius: 14,
    },

    backButtonGradient: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 14,
        borderWidth: 1,
        borderColor:
            "rgba(255,255,255,0.075)",
    },

    topBarText: {
        flex: 1,
        minWidth: 0,
    },

    topBarEyebrow: {
        color: "#646C7E",
        fontSize: 7,
        lineHeight: 9,
        fontWeight: "900",
        letterSpacing: 1.25,
    },

    topBarTitle: {
        color: "#F4F6FB",
        fontSize: 20,
        lineHeight: 24,
        fontWeight: "900",
        letterSpacing: -0.5,
    },

    hero: {
        alignItems: "center",
        marginBottom: 21,
    },

    logoStage: {
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
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

    appName: {
        color: "#F7F8FC",
        fontSize: 24,
        lineHeight: 29,
        fontWeight: "900",
        textAlign: "center",
        letterSpacing: -0.7,
    },

    subtitle: {
        maxWidth: 290,
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
        marginBottom: 11,
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

    signupButton: {
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

    signupButtonDisabled: {
        opacity: 0.72,
    },

    signupButtonGradient: {
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

    signupButtonText: {
        color: "#041009",
        fontSize: 12,
        lineHeight: 15,
        fontWeight: "900",
    },

    passwordHint: {
        color: "#646C7E",
        fontSize: 8,
        lineHeight: 12,
        fontWeight: "500",
        textAlign: "center",
        marginTop: 9,
    },

    loginHint: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 17,
    },

    loginHintText: {
        color: "#7D8597",
        fontSize: 10,
        lineHeight: 14,
        fontWeight: "600",
    },

    loginLinkButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 3,
        paddingHorizontal: 5,
        paddingVertical: 4,
        marginLeft: 2,
    },

    loginLink: {
        color: "#64E993",
        fontSize: 10,
        lineHeight: 14,
        fontWeight: "900",
    },
});