import fs from "node:fs";
import path from "node:path";

const versionPath =
    path.resolve(
        __dirname,
        "..",
        "VERSION",
    );

const appVersion =
    fs.readFileSync(
        versionPath,
        "utf8",
    ).trim();

const versionParts =
    appVersion.match(
        /^(\d+)\.(\d+)\.(\d+)$/,
    );

if (!versionParts) {
    throw new Error(
        `Versione non valida in ${versionPath}: ${appVersion}`,
    );
}

const nativeBuildNumber =
    Number(versionParts[1]) * 1_000_000 +
    Number(versionParts[2]) * 1_000 +
    Number(versionParts[3]);

export default {
    expo: {
        name: "ASO Music",
        slug: "aso-music",
        version: appVersion,
        orientation: "portrait",
        icon: "./assets/images/newicon.png",
        scheme: "asomusic",
        userInterfaceStyle: "automatic",
        newArchEnabled: true,

        ios: {
            supportsTablet: true,
            bundleIdentifier: "com.antoniomarroffino.asomusic",
            buildNumber:
                String(nativeBuildNumber),
            infoPlist: {
                UIBackgroundModes: ["audio"],
                AVAudioSessionCategory: "Playback",
                AVAudioSessionCategoryMode: "Default",
                AVAudioSessionCategoryOptions: [
                    "MixWithOthers",
                    "AllowBluetooth",
                ],
            },
        },

        android: {
            package: "com.asomusic.app",
            adaptiveIcon: {
                foregroundImage: "./assets/images/android-icon-foreground.png",
                backgroundImage: "./assets/images/android-icon-background.png",
            },
            versionCode:
                nativeBuildNumber,
            edgeToEdgeEnabled: true,
            predictiveBackGestureEnabled: false,
            permissions: ["android.permission.FOREGROUND_SERVICE"],
        },

        web: {
            favicon: "./assets/images/favicon.png",
            bundler: "metro",
            output: "static",
            pwa: {
                name: "ASO Music",
                shortName: "ASO",
                themeColor: "#000000",
                backgroundColor: "#000000",
                startUrl: ".",
                scope: ".",
                display: "standalone",
                orientation: "portrait",
                icons: [
                    {
                        src: "./assets/images/icon-192x192.png",
                        sizes: "192x192",
                        type: "image/png",
                        purpose: "any"
                    },
                    {
                        src: "./assets/images/icon-512x512.png",
                        sizes: "512x512",
                        type: "image/png",
                        purpose: "any"
                    },
                    {
                        src: "./assets/images/maskable-icon-512x512.png",
                        sizes: "512x512",
                        type: "image/png",
                        purpose: "maskable"
                    }
                ]
            },
            meta: {
                apple: {
                    title: "ASO Music",
                    statusBarStyle: "black-translucent"
                },
            },
            staticOutputDir: "dist",
            copy: [
                { src: "./assets/apple-touch-icon.png", dest: "apple-touch-icon.png" }
            ]
        },
        plugins: [
            "expo-router",
            "expo-asset",
            [
                "expo-splash-screen",
                {
                    image: "./assets/images/splash-icon.png",
                    imageWidth: 200,
                    resizeMode: "contain",
                    backgroundColor: "#000000",
                    dark: { backgroundColor: "#000000" },
                },
            ],
        ],

        experiments: {
            typedRoutes: true,
            reactCompiler: true,
        },

        updates: {
            url: "https://u.expo.dev/b47492e5-b933-48b8-83d1-553e8d5c4a0e",
        },

        runtimeVersion: { policy: "appVersion" },

        extra: {
            appVersion,
            EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
            EXPO_PUBLIC_FIREBASE_API_KEY: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
            EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
            EXPO_PUBLIC_FIREBASE_PROJECT_ID: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
            EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
            EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
            EXPO_PUBLIC_FIREBASE_APP_ID: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
            eas: {
                projectId: "b47492e5-b933-48b8-83d1-553e8d5c4a0e",
            },
        },
    },
};
