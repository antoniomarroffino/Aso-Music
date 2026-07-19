import React, {
    memo,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import {
    AnimatePresence,
    MotiView,
} from "moti";
import { Ionicons } from "@expo/vector-icons";

import { NewsDTO } from "@/types/news";

type NewsDropdownProps = {
    newsList?: NewsDTO[];
    visible: boolean;
};

const DEFAULT_VISIBLE_NEWS = 4;

const EMPTY_NEWS_LIST: NewsDTO[] = [];

const NewsDropdown = memo(
    function NewsDropdown({
                              newsList = EMPTY_NEWS_LIST,
                              visible,
                          }: NewsDropdownProps) {
        const [
            expanded,
            setExpanded,
        ] = useState(false);

        useEffect(() => {
            if (!visible) {
                setExpanded(false);
            }
        }, [visible]);

        const unreadCount =
            useMemo(
                () =>
                    newsList.filter(
                        (news) =>
                            !news.seen,
                    ).length,
                [newsList],
            );

        const visibleNews =
            useMemo(
                () =>
                    expanded
                        ? newsList
                        : newsList.slice(
                            0,
                            DEFAULT_VISIBLE_NEWS,
                        ),
                [
                    expanded,
                    newsList,
                ],
            );

        const hiddenNewsCount =
            Math.max(
                newsList.length -
                DEFAULT_VISIBLE_NEWS,
                0,
            );

        const hasOlderNews =
            hiddenNewsCount > 0;

        const subtitle =
            unreadCount > 0
                ? unreadCount === 1
                    ? "1 aggiornamento non letto"
                    : `${unreadCount} aggiornamenti non letti`
                : `${newsList.length} aggiornamenti`;

        const handleToggleExpanded =
            useCallback(() => {
                setExpanded(
                    (previousValue) =>
                        !previousValue,
                );
            }, []);

        return (
            <AnimatePresence>
                {visible && (
                    <MotiView
                        from={{
                            opacity: 0,
                            translateY: -6,
                            scale: 0.98,
                        }}
                        animate={{
                            opacity: 1,
                            translateY: 0,
                            scale: 1,
                        }}
                        exit={{
                            opacity: 0,
                            translateY: -6,
                            scale: 0.98,
                        }}
                        transition={{
                            type: "timing",
                            duration: 160,
                        }}
                        style={
                            styles.container
                        }
                    >
                        <LinearGradient
                            colors={[
                                "rgba(29,185,84,0.32)",
                                "rgba(119,89,255,0.22)",
                                "rgba(255,255,255,0.06)",
                            ]}
                            style={
                                styles.border
                            }
                        >
                            <BlurView
                                intensity={70}
                                tint="dark"
                                style={
                                    styles.blur
                                }
                            >
                                <View
                                    style={
                                        styles.surface
                                    }
                                >
                                    <View
                                        style={
                                            styles.header
                                        }
                                    >
                                        <View
                                            style={
                                                styles.headerIcon
                                            }
                                        >
                                            <Ionicons
                                                name="notifications-outline"
                                                size={13}
                                                color="#62EA92"
                                            />
                                        </View>

                                        <View
                                            style={
                                                styles.headerContent
                                            }
                                        >
                                            <Text
                                                style={
                                                    styles.title
                                                }
                                            >
                                                Novità
                                            </Text>

                                            <Text
                                                numberOfLines={1}
                                                style={
                                                    styles.subtitle
                                                }
                                            >
                                                {subtitle}
                                            </Text>
                                        </View>

                                        {unreadCount >
                                            0 && (
                                                <View
                                                    style={
                                                        styles.unreadBadge
                                                    }
                                                >
                                                    <Text
                                                        style={
                                                            styles.unreadBadgeText
                                                        }
                                                    >
                                                        {formatBadgeCount(
                                                            unreadCount,
                                                        )}
                                                    </Text>
                                                </View>
                                            )}
                                    </View>

                                    <View
                                        style={
                                            styles.divider
                                        }
                                    />

                                    {visibleNews.length >
                                    0 ? (
                                        <>
                                            <ScrollView
                                                nestedScrollEnabled
                                                showsVerticalScrollIndicator={
                                                    expanded
                                                }
                                                style={[
                                                    styles.newsScroll,

                                                    expanded &&
                                                    styles.newsScrollExpanded,
                                                ]}
                                                contentContainerStyle={
                                                    styles.newsScrollContent
                                                }
                                            >
                                                {visibleNews.map(
                                                    (
                                                        news,
                                                        index,
                                                    ) => (
                                                        <NewsItem
                                                            key={
                                                                news.id
                                                            }
                                                            news={
                                                                news
                                                            }
                                                            showDivider={
                                                                index <
                                                                visibleNews.length -
                                                                1
                                                            }
                                                        />
                                                    ),
                                                )}
                                            </ScrollView>

                                            {hasOlderNews && (
                                                <>
                                                    <View
                                                        style={
                                                            styles.footerDivider
                                                        }
                                                    />

                                                    <Pressable
                                                        accessibilityRole="button"
                                                        accessibilityLabel={
                                                            expanded
                                                                ? "Mostra meno notifiche"
                                                                : "Mostra tutte le notifiche"
                                                        }
                                                        onPress={
                                                            handleToggleExpanded
                                                        }
                                                        style={({
                                                                    pressed,
                                                                }) => [
                                                            styles.toggleButton,

                                                            pressed &&
                                                            styles.toggleButtonPressed,
                                                        ]}
                                                    >
                                                        <Text
                                                            style={
                                                                styles.toggleButtonText
                                                            }
                                                        >
                                                            {expanded
                                                                ? "Mostra meno"
                                                                : `Mostra altre ${hiddenNewsCount}`}
                                                        </Text>

                                                        <Ionicons
                                                            name={
                                                                expanded
                                                                    ? "chevron-up"
                                                                    : "chevron-down"
                                                            }
                                                            size={12}
                                                            color="#75ECA0"
                                                        />
                                                    </Pressable>
                                                </>
                                            )}
                                        </>
                                    ) : (
                                        <View
                                            style={
                                                styles.emptyState
                                            }
                                        >
                                            <Ionicons
                                                name="notifications-off-outline"
                                                size={16}
                                                color="#697185"
                                            />

                                            <Text
                                                style={
                                                    styles.emptyText
                                                }
                                            >
                                                Nessuna notifica
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </BlurView>
                        </LinearGradient>
                    </MotiView>
                )}
            </AnimatePresence>
        );
    },
);

type NewsItemProps = {
    news: NewsDTO;
    showDivider: boolean;
};

const NewsItem = memo(
    function NewsItem({
                          news,
                          showDivider,
                      }: NewsItemProps) {
        const isUnread =
            !news.seen;

        const formattedDate =
            news.createdAt
                ? formatNewsDate(
                    news.createdAt,
                )
                : null;

        return (
            <View
                style={[
                    styles.newsItem,

                    isUnread &&
                    styles.unreadNewsItem,

                    showDivider &&
                    styles.newsItemBorder,
                ]}
            >
                <View
                    style={[
                        styles.newsDot,

                        isUnread
                            ? styles.unreadNewsDot
                            : styles.seenNewsDot,
                    ]}
                />

                <View
                    style={
                        styles.newsContent
                    }
                >
                    <Text
                        numberOfLines={2}
                        style={[
                            styles.newsText,

                            isUnread &&
                            styles.unreadNewsText,
                        ]}
                    >
                        {news.message}
                    </Text>

                    {formattedDate && (
                        <Text
                            numberOfLines={1}
                            style={
                                styles.newsDate
                            }
                        >
                            {formattedDate}
                        </Text>
                    )}
                </View>

                {isUnread && (
                    <View
                        style={
                            styles.newLabel
                        }
                    >
                        <Text
                            style={
                                styles.newLabelText
                            }
                        >
                            NUOVA
                        </Text>
                    </View>
                )}
            </View>
        );
    },
);

function formatBadgeCount(
    count: number,
): string {
    return count > 99
        ? "99+"
        : String(count);
}

function formatNewsDate(
    createdAt: string,
): string | null {
    const date =
        new Date(createdAt);

    if (
        Number.isNaN(
            date.getTime(),
        )
    ) {
        return null;
    }

    const currentDate =
        new Date();

    return date.toLocaleString(
        "it-IT",
        {
            day: "2-digit",
            month: "short",

            year:
                date.getFullYear() !==
                currentDate.getFullYear()
                    ? "numeric"
                    : undefined,

            hour: "2-digit",
            minute: "2-digit",
        },
    );
}

export default NewsDropdown;

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        top: 44,
        right: 0,

        /*
         * Il parent deve comunque avere uno zIndex
         * elevato nella Home.
         */
        zIndex: 99999,
        elevation: 100,

        width: 288,
        maxWidth: "96%",

        borderRadius: 17,

        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.48,
        shadowRadius: 20,
    },

    border: {
        padding: 1,
        borderRadius: 17,
    },

    blur: {
        overflow: "hidden",
        borderRadius: 16,
    },

    surface: {
        paddingHorizontal: 9,
        paddingTop: 9,
        paddingBottom: 7,

        borderRadius: 16,

        backgroundColor:
            "rgba(7,9,14,0.97)",
    },

    header: {
        flexDirection: "row",
        alignItems: "center",
    },

    headerIcon: {
        width: 28,
        height: 28,

        alignItems: "center",
        justifyContent: "center",

        marginRight: 7,

        borderRadius: 9,

        backgroundColor:
            "rgba(29,185,84,0.09)",
    },

    headerContent: {
        flex: 1,
        minWidth: 0,
    },

    title: {
        color: "#F3F5FA",

        fontSize: 11,
        lineHeight: 14,
        fontWeight: "800",
    },

    subtitle: {
        marginTop: 1,

        color: "#697185",

        fontSize: 7.5,
        lineHeight: 10,
        fontWeight: "600",
    },

    unreadBadge: {
        minWidth: 20,
        height: 20,

        alignItems: "center",
        justifyContent: "center",

        marginLeft: 7,
        paddingHorizontal: 5,

        borderRadius: 10,

        backgroundColor:
            "rgba(29,215,96,0.13)",

        borderWidth: 1,
        borderColor:
            "rgba(29,215,96,0.22)",
    },

    unreadBadgeText: {
        color: "#65EE97",

        fontSize: 7.5,
        lineHeight: 9,
        fontWeight: "900",
    },

    divider: {
        height: 1,

        marginTop: 7,
        marginBottom: 3,

        backgroundColor:
            "rgba(255,255,255,0.055)",
    },

    newsScroll: {
        flexGrow: 0,
    },

    newsScrollExpanded: {
        maxHeight: 310,
    },

    newsScrollContent: {
        paddingVertical: 1,
    },

    newsItem: {
        minHeight: 40,

        flexDirection: "row",
        alignItems: "flex-start",

        paddingHorizontal: 5,
        paddingVertical: 6,

        borderRadius: 8,
    },

    unreadNewsItem: {
        backgroundColor:
            "rgba(29,185,84,0.04)",
    },

    newsItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor:
            "rgba(255,255,255,0.04)",
    },

    newsDot: {
        width: 5,
        height: 5,

        marginTop: 5,
        marginRight: 7,

        borderRadius: 2.5,
    },

    unreadNewsDot: {
        backgroundColor: "#1ED760",
    },

    seenNewsDot: {
        backgroundColor:
            "rgba(116,124,142,0.38)",
    },

    newsContent: {
        flex: 1,
        minWidth: 0,
    },

    newsText: {
        color: "#929AAA",

        fontSize: 9.5,
        lineHeight: 13,
        fontWeight: "500",
    },

    unreadNewsText: {
        color: "#D5DAE4",
        fontWeight: "700",
    },

    newsDate: {
        marginTop: 2,

        color: "#626A7B",

        fontSize: 6.5,
        lineHeight: 9,
        fontWeight: "600",
    },

    newLabel: {
        marginTop: 1,
        marginLeft: 6,

        paddingHorizontal: 4,
        paddingVertical: 1.5,

        borderRadius: 4,

        backgroundColor:
            "rgba(29,215,96,0.09)",
    },

    newLabelText: {
        color: "#63EA94",

        fontSize: 5.5,
        lineHeight: 7,
        fontWeight: "900",
        letterSpacing: 0.35,
    },

    footerDivider: {
        height: 1,

        marginTop: 3,

        backgroundColor:
            "rgba(255,255,255,0.05)",
    },

    toggleButton: {
        minHeight: 30,

        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",

        gap: 5,

        marginTop: 4,

        borderRadius: 8,

        backgroundColor:
            "rgba(255,255,255,0.025)",
    },

    toggleButtonPressed: {
        opacity: 0.72,

        backgroundColor:
            "rgba(29,185,84,0.07)",
    },

    toggleButtonText: {
        color: "#75ECA0",

        fontSize: 8,
        lineHeight: 11,
        fontWeight: "800",
    },

    emptyState: {
        minHeight: 42,

        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",

        gap: 6,
    },

    emptyText: {
        color: "#747C8E",

        fontSize: 9,
        fontWeight: "600",
    },
});