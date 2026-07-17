import React, {
    memo,
    PropsWithChildren,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    Alert,
    Platform,
    ScrollView,
    StyleProp,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewStyle,
} from "react-native";
import {
    LinearGradient,
    type LinearGradientProps,
} from "expo-linear-gradient";
import * as Clipboard from "expo-clipboard";
import {
    AnimatePresence,
    MotiView,
} from "moti";
import { Ionicons } from "@expo/vector-icons";
import {
    Stack,
    useRouter,
} from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
    useSafeAreaInsets,
} from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import {BlurView} from "expo-blur";

const APP_VERSION = "1.5.0";
const IBAN = "LT413250025268467321";

type IoniconName =
    keyof typeof Ionicons.glyphMap;

type PatchNote = {
    version: string;
    date: string;
    title: string;
    items: string[];
};

const PATCH_NOTES: PatchNote[] = [
    {
        version: "1.5.0",
        date: "Luglio 2026",
        title: "Bug fix",
        items: [],
    },
];

/* -------------------------------------------------------------------------- */
/* Glass surface                                                              */
/* -------------------------------------------------------------------------- */

type GlassCardProps = PropsWithChildren<{
    colors?: LinearGradientProps["colors"];
    intensity?: number;
    style?: StyleProp<ViewStyle>;
    contentStyle?: StyleProp<ViewStyle>;
}>;

const GlassCard = memo(function GlassCard({
                                              children,
                                              colors = [
                                                  "rgba(255,255,255,0.14)",
                                                  "rgba(255,255,255,0.025)",
                                              ],
                                              intensity = 42,
                                              style,
                                              contentStyle,
                                          }: GlassCardProps) {
    return (
        <LinearGradient
            colors={colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
                styles.glassBorder,
                style,
            ]}
        >
            <BlurView
                intensity={intensity}
                tint="dark"
                style={styles.glassBlur}
            >
                <View
                    style={[
                        styles.glassSurface,
                        contentStyle,
                    ]}
                >
                    {children}
                </View>
            </BlurView>
        </LinearGradient>
    );
});

/* -------------------------------------------------------------------------- */
/* Section header                                                             */
/* -------------------------------------------------------------------------- */

type SectionHeaderProps = {
    icon: IoniconName;
    title: string;
    accentColor?: string;
};

const SectionHeader = memo(
    function SectionHeader({
                               icon,
                               title,
                               accentColor = "#53E58A",
                           }: SectionHeaderProps) {
        return (
            <View style={styles.sectionHeader}>
                <LinearGradient
                    colors={[
                        `${accentColor}33`,
                        `${accentColor}0D`,
                    ]}
                    style={
                        styles.sectionIconContainer
                    }
                >
                    <Ionicons
                        name={icon}
                        size={15}
                        color={accentColor}
                    />
                </LinearGradient>

                <Text
                    style={
                        styles.sectionTitle
                    }
                >
                    {title}
                </Text>

                <View
                    style={
                        styles.sectionLine
                    }
                />
            </View>
        );
    },
);

/* -------------------------------------------------------------------------- */
/* Information row                                                           */
/* -------------------------------------------------------------------------- */

type InfoRowProps = {
    icon: IoniconName;
    label: string;
    value: string;
    accentColor?: string;
    isLast?: boolean;
};

const InfoRow = memo(
    function InfoRow({
                         icon,
                         label,
                         value,
                         accentColor = "#53E58A",
                         isLast = false,
                     }: InfoRowProps) {
        return (
            <>
                <View style={styles.infoRow}>
                    <LinearGradient
                        colors={[
                            `${accentColor}2E`,
                            `${accentColor}0A`,
                        ]}
                        style={
                            styles.infoIconContainer
                        }
                    >
                        <Ionicons
                            name={icon}
                            size={17}
                            color={
                                accentColor
                            }
                        />
                    </LinearGradient>

                    <View
                        style={
                            styles.infoContent
                        }
                    >
                        <Text
                            style={
                                styles.infoLabel
                            }
                        >
                            {label}
                        </Text>

                        <Text
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={
                                0.72
                            }
                            style={
                                styles.infoValue
                            }
                        >
                            {value}
                        </Text>
                    </View>
                </View>

                {!isLast && (
                    <View
                        style={
                            styles.divider
                        }
                    />
                )}
            </>
        );
    },
);

/* -------------------------------------------------------------------------- */
/* Main screen                                                                */
/* -------------------------------------------------------------------------- */

export default function SettingsScreen() {
    const {
        appUser,
        logout,
    } = useAuth();

    const router = useRouter();
    const insets =
        useSafeAreaInsets();

    const [
        copiedIban,
        setCopiedIban,
    ] = useState(false);

    const copiedTimerRef =
        useRef<
            ReturnType<
                typeof setTimeout
            > | null
        >(null);

    const displayName = useMemo(() => {
        const completeName = [
            appUser?.firstName,
            appUser?.lastName,
        ]
            .filter(Boolean)
            .join(" ")
            .trim();

        return (
            completeName ||
            appUser?.username ||
            "Utente"
        );
    }, [
        appUser?.firstName,
        appUser?.lastName,
        appUser?.username,
    ]);

    const initials = useMemo(() => {
        const parts = [
            appUser?.firstName,
            appUser?.lastName,
        ].filter(
            (part): part is string =>
                Boolean(part),
        );

        if (parts.length > 0) {
            return parts
                .slice(0, 2)
                .map((part) =>
                    part
                        .charAt(0)
                        .toUpperCase(),
                )
                .join("");
        }

        return appUser?.username
            ?.slice(0, 2)
            .toUpperCase() ?? "";
    }, [
        appUser?.firstName,
        appUser?.lastName,
        appUser?.username,
    ]);

    const subscriptionLabel =
        useMemo(() => {
            const subscription =
                appUser?.subscriptionType;

            if (!subscription) {
                return "Free";
            }

            return (
                subscription
                    .charAt(0)
                    .toUpperCase() +
                subscription
                    .slice(1)
                    .toLowerCase()
            );
        }, [
            appUser?.subscriptionType,
        ]);

    const formattedIban =
        useMemo(
            () =>
                IBAN.match(/.{1,4}/g)
                    ?.join(" ") ??
                IBAN,
            [],
        );

    useEffect(() => {
        return () => {
            if (
                copiedTimerRef.current
            ) {
                clearTimeout(
                    copiedTimerRef.current,
                );
            }
        };
    }, []);

    const performLogout =
        useCallback(async () => {
            await logout();
            router.replace("/(auth)");
        }, [
            logout,
            router,
        ]);

    const handleLogout =
        useCallback(() => {
            if (
                Platform.OS ===
                "web"
            ) {
                const confirmed =
                    typeof window !==
                    "undefined" &&
                    window.confirm(
                        "Vuoi davvero uscire?",
                    );

                if (confirmed) {
                    void performLogout();
                }

                return;
            }

            Alert.alert(
                "Logout",
                "Vuoi davvero uscire dal tuo account?",
                [
                    {
                        text: "Annulla",
                        style: "cancel",
                    },
                    {
                        text: "Esci",
                        style:
                            "destructive",
                        onPress: () => {
                            void performLogout();
                        },
                    },
                ],
            );
        }, [performLogout]);

    const copyToClipboard =
        useCallback(async () => {
            await Clipboard.setStringAsync(
                IBAN,
            );

            setCopiedIban(true);

            if (
                copiedTimerRef.current
            ) {
                clearTimeout(
                    copiedTimerRef.current,
                );
            }

            copiedTimerRef.current =
                setTimeout(() => {
                    setCopiedIban(
                        false,
                    );
                }, 2200);
        }, []);

    const handleBack =
        useCallback(() => {
            router.back();
        }, [router]);

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
                    0.33,
                    0.72,
                    1,
                ]}
                style={
                    StyleSheet.absoluteFillObject
                }
            />

            <View
                pointerEvents="none"
                style={[
                    styles.ambientOrb,
                    styles.greenOrb,
                ]}
            >
                <LinearGradient
                    colors={[
                        "rgba(29,185,84,0.25)",
                        "rgba(29,185,84,0.02)",
                        "transparent",
                    ]}
                    style={
                        StyleSheet.absoluteFillObject
                    }
                />
            </View>

            <View
                pointerEvents="none"
                style={[
                    styles.ambientOrb,
                    styles.purpleOrb,
                ]}
            >
                <LinearGradient
                    colors={[
                        "rgba(119,86,255,0.22)",
                        "rgba(119,86,255,0.02)",
                        "transparent",
                    ]}
                    style={
                        StyleSheet.absoluteFillObject
                    }
                />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={
                    false
                }
                contentContainerStyle={[
                    styles.scrollContent,
                    {
                        paddingTop:
                            insets.top +
                            16,
                        paddingBottom:
                            Math.max(
                                insets.bottom,
                                20,
                            ) + 120,
                    },
                ]}
            >
                <View
                    style={
                        styles.contentShell
                    }
                >
                    {/* Header */}

                    <MotiView
                        from={{
                            opacity: 0,
                            translateY: -18,
                        }}
                        animate={{
                            opacity: 1,
                            translateY: 0,
                        }}
                        transition={{
                            type: "spring",
                            damping: 17,
                        }}
                        style={styles.header}
                    >
                        <TouchableOpacity
                            onPress={
                                handleBack
                            }
                            style={
                                styles.headerButton
                            }
                            activeOpacity={
                                0.72
                            }
                            accessibilityRole="button"
                            accessibilityLabel="Torna indietro"
                        >
                            <LinearGradient
                                colors={[
                                    "rgba(255,255,255,0.13)",
                                    "rgba(255,255,255,0.035)",
                                ]}
                                style={
                                    styles.headerButtonGradient
                                }
                            >
                                <Ionicons
                                    name="chevron-back"
                                    size={20}
                                    color="#F7F9FF"
                                />
                            </LinearGradient>
                        </TouchableOpacity>

                        <View
                            style={
                                styles.headerTextContainer
                            }
                        >
                            <Text
                                style={
                                    styles.headerEyebrow
                                }
                            >
                                ASO MUSIC
                            </Text>

                            <Text
                                style={
                                    styles.title
                                }
                            >
                                Impostazioni
                            </Text>
                        </View>

                        <View
                            style={
                                styles.headerVersion
                            }
                        >
                            <Text
                                style={
                                    styles.headerVersionText
                                }
                            >
                                v
                                {
                                    APP_VERSION
                                }
                            </Text>
                        </View>
                    </MotiView>

                    {/* Profile */}

                    <MotiView
                        from={{
                            opacity: 0,
                            scale: 0.96,
                            translateY: 14,
                        }}
                        animate={{
                            opacity: 1,
                            scale: 1,
                            translateY: 0,
                        }}
                        transition={{
                            type: "spring",
                            damping: 17,
                            delay: 80,
                        }}
                        style={
                            styles.profileWrapper
                        }
                    >
                        <GlassCard
                            colors={[
                                "rgba(54,239,130,0.42)",
                                "rgba(122,91,255,0.30)",
                                "rgba(255,255,255,0.07)",
                            ]}
                            intensity={54}
                            contentStyle={
                                styles.profileCard
                            }
                        >
                            <View
                                style={
                                    styles.profileGlow
                                }
                            />

                            <LinearGradient
                                colors={[
                                    "#60F69A",
                                    "#1DB954",
                                    "#7662FF",
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
                                    styles.avatarBorder
                                }
                            >
                                <View
                                    style={
                                        styles.avatarInner
                                    }
                                >
                                    {initials ? (
                                        <Text
                                            style={
                                                styles.avatarInitials
                                            }
                                        >
                                            {
                                                initials
                                            }
                                        </Text>
                                    ) : (
                                        <Ionicons
                                            name="person"
                                            size={
                                                30
                                            }
                                            color="#5CEB91"
                                        />
                                    )}
                                </View>
                            </LinearGradient>

                            <View
                                style={
                                    styles.profileInfo
                                }
                            >
                                <Text
                                    numberOfLines={
                                        1
                                    }
                                    style={
                                        styles.displayName
                                    }
                                >
                                    {displayName}
                                </Text>

                                <Text
                                    numberOfLines={
                                        1
                                    }
                                    style={
                                        styles.username
                                    }
                                >
                                    @
                                    {appUser?.username ??
                                        "utente"}
                                </Text>

                                {appUser?.email && (
                                    <Text
                                        numberOfLines={
                                            1
                                        }
                                        style={
                                            styles.email
                                        }
                                    >
                                        {
                                            appUser.email
                                        }
                                    </Text>
                                )}
                            </View>

                            <LinearGradient
                                colors={[
                                    "rgba(29,185,84,0.24)",
                                    "rgba(29,185,84,0.07)",
                                ]}
                                style={
                                    styles.subscriptionBadge
                                }
                            >
                                <Ionicons
                                    name="sparkles"
                                    size={11}
                                    color="#6AF19A"
                                />

                                <Text
                                    style={
                                        styles.subscriptionText
                                    }
                                >
                                    {
                                        subscriptionLabel
                                    }
                                </Text>
                            </LinearGradient>
                        </GlassCard>
                    </MotiView>

                    {/* Account details */}

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
                            delay: 140,
                        }}
                        style={styles.section}
                    >
                        <SectionHeader
                            icon="person-outline"
                            title="Account"
                        />

                        <GlassCard
                            contentStyle={
                                styles.infoCard
                            }
                        >
                            <InfoRow
                                icon="id-card-outline"
                                label="Nome completo"
                                value={
                                    displayName
                                }
                            />

                            <InfoRow
                                icon="mail-outline"
                                label="Email"
                                value={
                                    appUser?.email ??
                                    "Non disponibile"
                                }
                                accentColor="#9D83FF"
                            />

                            <InfoRow
                                icon="diamond-outline"
                                label="Abbonamento"
                                value={
                                    subscriptionLabel
                                }
                                accentColor="#FFCA62"
                                isLast
                            />
                        </GlassCard>
                    </MotiView>

                    {/* App information */}

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
                            delay: 200,
                        }}
                        style={styles.section}
                    >
                        <SectionHeader
                            icon="information-circle-outline"
                            title="Informazioni app"
                            accentColor="#9D83FF"
                        />

                        <GlassCard
                            colors={[
                                "rgba(157,131,255,0.32)",
                                "rgba(255,255,255,0.03)",
                            ]}
                            contentStyle={
                                styles.appInfoCard
                            }
                        >
                            <View
                                style={
                                    styles.appIcon
                                }
                            >
                                <LinearGradient
                                    colors={[
                                        "#55EE90",
                                        "#745EFF",
                                    ]}
                                    style={
                                        styles.appIconGradient
                                    }
                                >
                                    <Ionicons
                                        name="musical-notes"
                                        size={21}
                                        color="#07100A"
                                    />
                                </LinearGradient>
                            </View>

                            <View
                                style={
                                    styles.appInfoContent
                                }
                            >
                                <Text
                                    style={
                                        styles.appName
                                    }
                                >
                                    ASO Music
                                </Text>

                                <Text
                                    style={
                                        styles.appPlatform
                                    }
                                >
                                    {Platform.OS ===
                                    "web"
                                        ? "Web application"
                                        : `${Platform.OS
                                            .charAt(
                                                0,
                                            )
                                            .toUpperCase()}${Platform.OS.slice(
                                            1,
                                        )} application`}
                                </Text>
                            </View>

                            <View
                                style={
                                    styles.versionBadge
                                }
                            >
                                <Text
                                    style={
                                        styles.versionText
                                    }
                                >
                                    v
                                    {
                                        APP_VERSION
                                    }
                                </Text>
                            </View>
                        </GlassCard>
                    </MotiView>

                    {/* Patch notes */}

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
                            delay: 260,
                        }}
                        style={styles.section}
                    >
                        <SectionHeader
                            icon="newspaper-outline"
                            title="Novità"
                            accentColor="#6EDEFF"
                        />

                        {PATCH_NOTES.map(
                            (
                                patch,
                                patchIndex,
                            ) => (
                                <GlassCard
                                    key={`${patch.version}-${patchIndex}`}
                                    colors={[
                                        "rgba(87,218,255,0.26)",
                                        "rgba(121,89,255,0.24)",
                                        "rgba(29,185,84,0.08)",
                                    ]}
                                    style={
                                        patchIndex >
                                        0
                                            ? styles.patchSpacing
                                            : undefined
                                    }
                                    contentStyle={
                                        styles.patchCard
                                    }
                                >
                                    <View
                                        style={
                                            styles.patchHeader
                                        }
                                    >
                                        <View
                                            style={
                                                styles.patchIcon
                                            }
                                        >
                                            <Ionicons
                                                name="rocket-outline"
                                                size={
                                                    17
                                                }
                                                color="#70E5FF"
                                            />
                                        </View>

                                        <View
                                            style={
                                                styles.patchHeaderText
                                            }
                                        >
                                            <Text
                                                style={
                                                    styles.patchTitle
                                                }
                                            >
                                                {
                                                    patch.title
                                                }
                                            </Text>

                                            <View
                                                style={
                                                    styles.patchMeta
                                                }
                                            >
                                                <Text
                                                    style={
                                                        styles.patchVersion
                                                    }
                                                >
                                                    v
                                                    {
                                                        patch.version
                                                    }
                                                </Text>

                                                <View
                                                    style={
                                                        styles.metaDot
                                                    }
                                                />

                                                <Text
                                                    style={
                                                        styles.patchDate
                                                    }
                                                >
                                                    {
                                                        patch.date
                                                    }
                                                </Text>
                                            </View>
                                        </View>
                                    </View>

                                    {patch.items
                                        .length >
                                    0 ? (
                                        <View
                                            style={
                                                styles.patchItems
                                            }
                                        >
                                            {patch.items.map(
                                                (
                                                    item,
                                                    itemIndex,
                                                ) => (
                                                    <View
                                                        key={`${item}-${itemIndex}`}
                                                        style={
                                                            styles.patchItem
                                                        }
                                                    >
                                                        <LinearGradient
                                                            colors={[
                                                                "#57DEFF",
                                                                "#61F091",
                                                            ]}
                                                            style={
                                                                styles.patchBullet
                                                            }
                                                        />

                                                        <Text
                                                            style={
                                                                styles.patchItemText
                                                            }
                                                        >
                                                            {
                                                                item
                                                            }
                                                        </Text>
                                                    </View>
                                                ),
                                            )}
                                        </View>
                                    ) : (
                                        <Text
                                            style={
                                                styles.patchDescription
                                            }
                                        >
                                            La nuova
                                            release è
                                            disponibile
                                            nell&#39;app.
                                        </Text>
                                    )}
                                </GlassCard>
                            ),
                        )}
                    </MotiView>

                    {/* Support developer */}

                    <MotiView
                        from={{
                            opacity: 0,
                            translateY: 16,
                            scale: 0.98,
                        }}
                        animate={{
                            opacity: 1,
                            translateY: 0,
                            scale: 1,
                        }}
                        transition={{
                            type: "spring",
                            damping: 17,
                            delay: 320,
                        }}
                        style={styles.section}
                    >
                        <SectionHeader
                            icon="heart-outline"
                            title="Supporta lo sviluppo"
                            accentColor="#FF826F"
                        />

                        <GlassCard
                            colors={[
                                "rgba(255,126,105,0.36)",
                                "rgba(255,176,76,0.22)",
                                "rgba(255,255,255,0.06)",
                            ]}
                            intensity={48}
                            contentStyle={
                                styles.supportCard
                            }
                        >
                            <View
                                style={
                                    styles.supportHeader
                                }
                            >
                                <LinearGradient
                                    colors={[
                                        "#FF9B73",
                                        "#FF647C",
                                    ]}
                                    style={
                                        styles.supportIcon
                                    }
                                >
                                    <Ionicons
                                        name="cafe"
                                        size={23}
                                        color="#240907"
                                    />
                                </LinearGradient>

                                <View
                                    style={
                                        styles.supportHeaderText
                                    }
                                >
                                    <Text
                                        style={
                                            styles.supportTitle
                                        }
                                    >
                                        Sostieni ASO
                                        Music
                                    </Text>

                                    <Text
                                        style={
                                            styles.supportSubtitle
                                        }
                                    >
                                        Ogni
                                        contributo
                                        aiuta a
                                        mantenere e
                                        migliorare
                                        l&#39;app.
                                    </Text>
                                </View>
                            </View>

                            <View
                                style={
                                    styles.supportDivider
                                }
                            />

                            <Text
                                style={
                                    styles.supportText
                                }
                            >
                                Puoi effettuare
                                un bonifico di
                                qualsiasi importo
                                utilizzando questo
                                IBAN.
                            </Text>

                            <TouchableOpacity
                                activeOpacity={
                                    0.76
                                }
                                onPress={() => {
                                    void copyToClipboard();
                                }}
                                style={
                                    styles.ibanTouchable
                                }
                                accessibilityRole="button"
                                accessibilityLabel="Copia IBAN"
                            >
                                <LinearGradient
                                    colors={[
                                        "rgba(255,255,255,0.11)",
                                        "rgba(255,255,255,0.035)",
                                    ]}
                                    style={
                                        styles.ibanContainer
                                    }
                                >
                                    <View
                                        style={
                                            styles.ibanIcon
                                        }
                                    >
                                        <Ionicons
                                            name="card-outline"
                                            size={
                                                17
                                            }
                                            color="#FF9B82"
                                        />
                                    </View>

                                    <View
                                        style={
                                            styles.ibanContent
                                        }
                                    >
                                        <Text
                                            style={
                                                styles.ibanLabel
                                            }
                                        >
                                            IBAN
                                        </Text>

                                        <Text
                                            numberOfLines={
                                                1
                                            }
                                            adjustsFontSizeToFit
                                            minimumFontScale={
                                                0.66
                                            }
                                            style={
                                                styles.ibanText
                                            }
                                        >
                                            {
                                                formattedIban
                                            }
                                        </Text>
                                    </View>

                                    <LinearGradient
                                        colors={
                                            copiedIban
                                                ? [
                                                    "#5EF095",
                                                    "#1DB954",
                                                ]
                                                : [
                                                    "rgba(255,255,255,0.14)",
                                                    "rgba(255,255,255,0.04)",
                                                ]
                                        }
                                        style={
                                            styles.copyButton
                                        }
                                    >
                                        <Ionicons
                                            name={
                                                copiedIban
                                                    ? "checkmark"
                                                    : "copy-outline"
                                            }
                                            size={
                                                17
                                            }
                                            color={
                                                copiedIban
                                                    ? "#041009"
                                                    : "#F7F8FC"
                                            }
                                        />
                                    </LinearGradient>
                                </LinearGradient>
                            </TouchableOpacity>

                            <AnimatePresence>
                                {copiedIban && (
                                    <MotiView
                                        from={{
                                            opacity: 0,
                                            translateY:
                                                -4,
                                            scale: 0.96,
                                        }}
                                        animate={{
                                            opacity: 1,
                                            translateY:
                                                0,
                                            scale: 1,
                                        }}
                                        exit={{
                                            opacity: 0,
                                            translateY:
                                                -4,
                                            scale: 0.96,
                                        }}
                                        transition={{
                                            type: "timing",
                                            duration:
                                                180,
                                        }}
                                        style={
                                            styles.copiedBadge
                                        }
                                    >
                                        <Ionicons
                                            name="checkmark-circle"
                                            size={
                                                14
                                            }
                                            color="#68F29C"
                                        />

                                        <Text
                                            style={
                                                styles.copiedText
                                            }
                                        >
                                            IBAN
                                            copiato
                                        </Text>
                                    </MotiView>
                                )}
                            </AnimatePresence>
                        </GlassCard>
                    </MotiView>

                    {/* Logout */}

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
                            delay: 380,
                        }}
                    >
                        <TouchableOpacity
                            onPress={
                                handleLogout
                            }
                            activeOpacity={
                                0.8
                            }
                            accessibilityRole="button"
                            accessibilityLabel="Esci dall'account"
                            style={
                                styles.logoutButton
                            }
                        >
                            <LinearGradient
                                colors={[
                                    "rgba(255,91,91,0.90)",
                                    "rgba(218,55,76,0.94)",
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
                                    styles.logoutGradient
                                }
                            >
                                <View
                                    style={
                                        styles.logoutHighlight
                                    }
                                />

                                <Ionicons
                                    name="log-out-outline"
                                    size={19}
                                    color="#260508"
                                />

                                <Text
                                    style={
                                        styles.logoutText
                                    }
                                >
                                    Esci
                                    dall&#39;account
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </MotiView>

                    <Text
                        style={
                            styles.footerText
                        }
                    >
                        ASO Music · v
                        {APP_VERSION}
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#050506",
    },

    ambientOrb: {
        position: "absolute",
        overflow: "hidden",
        borderRadius: 999,
    },

    greenOrb: {
        width: 430,
        height: 430,
        top: -220,
        right: -210,
    },

    purpleOrb: {
        width: 410,
        height: 410,
        bottom: -210,
        left: -220,
    },

    scrollContent: {
        paddingHorizontal: 14,
    },

    contentShell: {
        width: "100%",
        maxWidth: 680,
        alignSelf: "center",
    },

    header: {
        height: 58,
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 18,
    },

    headerButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        overflow: "hidden",
    },

    headerButtonGradient: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 19,
        borderWidth: 1,
        borderColor:
            "rgba(255,255,255,0.07)",
    },

    headerTextContainer: {
        flex: 1,
        minWidth: 0,
        marginHorizontal: 12,
    },

    headerEyebrow: {
        color: "#626A7D",
        fontSize: 7,
        lineHeight: 9,
        fontWeight: "900",
        letterSpacing: 1.35,
        marginBottom: 1,
    },

    title: {
        color: "#F7F8FD",
        fontSize: 24,
        lineHeight: 28,
        fontWeight: "900",
        letterSpacing: -0.7,
    },

    headerVersion: {
        minWidth: 38,
        height: 25,
        paddingHorizontal: 8,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 999,
        backgroundColor:
            "rgba(255,255,255,0.045)",
        borderWidth: 1,
        borderColor:
            "rgba(255,255,255,0.06)",
    },

    headerVersionText: {
        color: "#8C94A6",
        fontSize: 9,
        fontWeight: "800",
    },

    glassBorder: {
        padding: 1,
        borderRadius: 21,
    },

    glassBlur: {
        overflow: "hidden",
        borderRadius: 20,
    },

    glassSurface: {
        borderRadius: 20,
        backgroundColor:
            "rgba(10,12,18,0.88)",
        borderWidth: 1,
        borderColor:
            "rgba(255,255,255,0.025)",
    },

    profileWrapper: {
        marginBottom: 22,
    },

    profileCard: {
        position: "relative",
        minHeight: 112,
        flexDirection: "row",
        alignItems: "center",
        padding: 15,
        overflow: "hidden",
    },

    profileGlow: {
        position: "absolute",
        width: 180,
        height: 180,
        top: -95,
        right: -75,
        borderRadius: 90,
        backgroundColor:
            "rgba(115,86,255,0.10)",
    },

    avatarBorder: {
        width: 72,
        height: 72,
        padding: 2,
        borderRadius: 36,
        marginRight: 13,
        shadowColor: "#37E77D",
        shadowOffset: {
            width: 0,
            height: 5,
        },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 8,
    },

    avatarInner: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 34,
        backgroundColor: "#0B0E13",
    },

    avatarInitials: {
        color: "#E9FFF0",
        fontSize: 22,
        fontWeight: "900",
        letterSpacing: -0.5,
    },

    profileInfo: {
        flex: 1,
        minWidth: 0,
    },

    displayName: {
        color: "#F7F8FD",
        fontSize: 18,
        lineHeight: 22,
        fontWeight: "900",
        letterSpacing: -0.45,
    },

    username: {
        color: "#63E894",
        fontSize: 11,
        lineHeight: 15,
        fontWeight: "700",
        marginTop: 1,
    },

    email: {
        color: "#81899B",
        fontSize: 10,
        lineHeight: 14,
        fontWeight: "500",
        marginTop: 2,
    },

    subscriptionBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 5,
        marginLeft: 8,
        borderRadius: 999,
        borderWidth: 1,
        borderColor:
            "rgba(29,185,84,0.16)",
    },

    subscriptionText: {
        color: "#78EDA1",
        fontSize: 8,
        fontWeight: "900",
        letterSpacing: 0.4,
        textTransform: "uppercase",
    },

    section: {
        marginBottom: 20,
    },

    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 9,
        paddingHorizontal: 2,
    },

    sectionIconContainer: {
        width: 29,
        height: 29,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 10,
        borderWidth: 1,
        borderColor:
            "rgba(255,255,255,0.045)",
    },

    sectionTitle: {
        color: "#E9EBF2",
        fontSize: 14,
        lineHeight: 18,
        fontWeight: "800",
        letterSpacing: -0.25,
    },

    sectionLine: {
        flex: 1,
        height: 1,
        marginLeft: 3,
        backgroundColor:
            "rgba(255,255,255,0.045)",
    },

    infoCard: {
        paddingHorizontal: 14,
    },

    infoRow: {
        minHeight: 66,
        flexDirection: "row",
        alignItems: "center",
    },

    infoIconContainer: {
        width: 34,
        height: 34,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 11,
        marginRight: 11,
        borderWidth: 1,
        borderColor:
            "rgba(255,255,255,0.04)",
    },

    infoContent: {
        flex: 1,
        minWidth: 0,
    },

    infoLabel: {
        color: "#737B8E",
        fontSize: 9,
        lineHeight: 12,
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: 0.65,
        marginBottom: 2,
    },

    infoValue: {
        width: "100%",
        color: "#F1F3F8",
        fontSize: 13,
        lineHeight: 17,
        fontWeight: "700",
    },

    divider: {
        height: 1,
        marginLeft: 45,
        backgroundColor:
            "rgba(255,255,255,0.045)",
    },

    appInfoCard: {
        minHeight: 76,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 13,
        paddingVertical: 11,
    },

    appIcon: {
        width: 45,
        height: 45,
        borderRadius: 14,
        overflow: "hidden",
        marginRight: 11,
    },

    appIconGradient: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },

    appInfoContent: {
        flex: 1,
        minWidth: 0,
    },

    appName: {
        color: "#F6F7FC",
        fontSize: 14,
        lineHeight: 18,
        fontWeight: "800",
    },

    appPlatform: {
        color: "#737B8D",
        fontSize: 9,
        lineHeight: 12,
        fontWeight: "600",
        marginTop: 2,
    },

    versionBadge: {
        paddingHorizontal: 9,
        paddingVertical: 6,
        marginLeft: 8,
        borderRadius: 999,
        backgroundColor:
            "rgba(157,131,255,0.13)",
        borderWidth: 1,
        borderColor:
            "rgba(157,131,255,0.18)",
    },

    versionText: {
        color: "#B7A6FF",
        fontSize: 10,
        fontWeight: "900",
    },

    patchSpacing: {
        marginTop: 9,
    },

    patchCard: {
        padding: 14,
    },

    patchHeader: {
        flexDirection: "row",
        alignItems: "center",
    },

    patchIcon: {
        width: 39,
        height: 39,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 10,
        borderRadius: 13,
        backgroundColor:
            "rgba(87,218,255,0.10)",
        borderWidth: 1,
        borderColor:
            "rgba(87,218,255,0.12)",
    },

    patchHeaderText: {
        flex: 1,
        minWidth: 0,
    },

    patchTitle: {
        color: "#F6F7FC",
        fontSize: 14,
        lineHeight: 18,
        fontWeight: "800",
    },

    patchMeta: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginTop: 3,
    },

    patchVersion: {
        color: "#69E996",
        fontSize: 9,
        lineHeight: 12,
        fontWeight: "800",
    },

    patchDate: {
        color: "#6F778A",
        fontSize: 9,
        lineHeight: 12,
        fontWeight: "600",
    },

    metaDot: {
        width: 2,
        height: 2,
        borderRadius: 1,
        backgroundColor: "#596174",
    },

    patchItems: {
        gap: 7,
        marginTop: 12,
    },

    patchItem: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 8,
    },

    patchBullet: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
        marginTop: 5,
    },

    patchItemText: {
        flex: 1,
        color: "#A8AFBE",
        fontSize: 11,
        lineHeight: 16,
        fontWeight: "500",
    },

    patchDescription: {
        color: "#9299AA",
        fontSize: 11,
        lineHeight: 16,
        fontWeight: "500",
        marginTop: 11,
    },

    supportCard: {
        padding: 15,
    },

    supportHeader: {
        flexDirection: "row",
        alignItems: "center",
    },

    supportIcon: {
        width: 49,
        height: 49,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 11,
        borderRadius: 16,
        shadowColor: "#FF746E",
        shadowOffset: {
            width: 0,
            height: 5,
        },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 6,
    },

    supportHeaderText: {
        flex: 1,
        minWidth: 0,
    },

    supportTitle: {
        color: "#FFF5F1",
        fontSize: 15,
        lineHeight: 19,
        fontWeight: "900",
        letterSpacing: -0.25,
    },

    supportSubtitle: {
        color: "#AD8D89",
        fontSize: 10,
        lineHeight: 14,
        fontWeight: "600",
        marginTop: 2,
    },

    supportDivider: {
        height: 1,
        marginVertical: 13,
        backgroundColor:
            "rgba(255,255,255,0.055)",
    },

    supportText: {
        color: "#A3A9B7",
        fontSize: 11,
        lineHeight: 16,
        fontWeight: "500",
        marginBottom: 12,
    },

    ibanTouchable: {
        width: "100%",
        borderRadius: 15,
        overflow: "hidden",
    },

    ibanContainer: {
        minHeight: 60,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 15,
        borderWidth: 1,
        borderColor:
            "rgba(255,255,255,0.06)",
    },

    ibanIcon: {
        width: 34,
        height: 34,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 9,
        borderRadius: 11,
        backgroundColor:
            "rgba(255,130,111,0.09)",
    },

    ibanContent: {
        flex: 1,
        minWidth: 0,
    },

    ibanLabel: {
        color: "#87716F",
        fontSize: 8,
        lineHeight: 10,
        fontWeight: "900",
        letterSpacing: 0.8,
        marginBottom: 2,
    },

    ibanText: {
        width: "100%",
        color: "#F7F0EE",
        fontSize: 12,
        lineHeight: 15,
        fontWeight: "800",
        letterSpacing: 0.35,
    },

    copyButton: {
        width: 34,
        height: 34,
        alignItems: "center",
        justifyContent: "center",
        marginLeft: 8,
        borderRadius: 17,
        borderWidth: 1,
        borderColor:
            "rgba(255,255,255,0.06)",
    },

    copiedBadge: {
        alignSelf: "flex-start",
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        paddingHorizontal: 9,
        paddingVertical: 5,
        marginTop: 9,
        borderRadius: 999,
        backgroundColor:
            "rgba(29,185,84,0.11)",
        borderWidth: 1,
        borderColor:
            "rgba(29,185,84,0.14)",
    },

    copiedText: {
        color: "#6BEF9C",
        fontSize: 9,
        fontWeight: "800",
    },

    logoutButton: {
        overflow: "hidden",
        borderRadius: 16,
        shadowColor: "#FF4F63",
        shadowOffset: {
            width: 0,
            height: 6,
        },
        shadowOpacity: 0.22,
        shadowRadius: 12,
        elevation: 7,
    },

    logoutGradient: {
        position: "relative",
        minHeight: 52,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        overflow: "hidden",
        borderRadius: 16,
    },

    logoutHighlight: {
        position: "absolute",
        top: 2,
        left: 24,
        right: 24,
        height: 13,
        borderRadius: 999,
        backgroundColor:
            "rgba(255,255,255,0.15)",
    },

    logoutText: {
        color: "#260508",
        fontSize: 13,
        fontWeight: "900",
        letterSpacing: -0.15,
    },

    footerText: {
        color: "#4D5464",
        fontSize: 9,
        fontWeight: "600",
        textAlign: "center",
        marginTop: 18,
        letterSpacing: 0.35,
    },
});