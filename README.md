# 🎵 Aso Music

## 📱 Project Description

**Aso Music** is a modern React Native application inspired by Spotify, built with [Expo](https://expo.dev) for cross-platform support (Android & iOS).  
It enables users to explore, stream, and interact with music through an intuitive and responsive interface.

This project was created to have fun building, and to bring joy to those who use it.  
It's designed with scalability and clean architecture.

---

## 🔍 Features

- 🎧 **Music Streaming** – Browse and play tracks on-demand
- 📝 **Playlists** – Create, edit, and manage custom playlists
- 🔎 **Search** – Find songs, albums, and artists
- 🌓 **Dark/Light Mode** – Seamless theme switching
- 📲 **Cross-Platform** – Run on iOS, Android and Web with a single codebase

## ⚙️ Technologies

- **React Native** via [Expo](https://expo.dev/)
- **TypeScript** for static typing
- **React Navigation** for screen transitions
- **Context API** / **Redux** for state management (if used)
- **Styled Components** or **Tailwind RN** (if styled with one)

## 🚀 Getting Started

### 🧱 Prerequisites

- Node.js >= 18
- npm or yarn
- Expo CLI (install with `npm install -g expo-cli`)

### 🛠️ Installation

1. Install dependencies

```bash
npm install
```

2. Start the app

```bash
npx expo start
```

Then choose to run on:

- 📱 Android emulator
- 🍏 iOS simulator
- 📦 [Expo Go](https://expo.dev/go)
- 🌍 Web browser

## 🧪 Development

Start editing the files inside the `app/` directory.  
This project uses [File-Based Routing](https://docs.expo.dev/router/introduction/) for navigation and structure.

To reset the starter template and begin from scratch:

```bash
npm run reset-project
```

This will archive the current app into `app-example/` and prepare a clean slate in `app/`.

## 🚀 Versione e deploy

La versione di rilascio è definita una sola volta nel file
[`VERSION`](./VERSION). Il formato previsto è SemVer, per esempio `1.5.0`.

Questa versione viene usata automaticamente per:

- la versione Expo dell'app;
- `versionCode` Android e `buildNumber` iOS;
- il tag dell'immagine Docker del backend;
- i metadati OCI e la variabile `APP_VERSION` del container.

Il frontend non richiede comandi di deploy: il push su `main` avvia il deploy
automatico su Vercel.

### Deploy manuale del backend

Prerequisiti:

- Google Cloud CLI installata;
- accesso al progetto `asomusic-d39c4`;
- autenticazione eseguita almeno una volta con `gcloud auth login`;
- Docker installato e avviato.

Per pubblicare una nuova versione:

1. Modificare soltanto il file `VERSION`, usando un tag mai pubblicato prima.
2. Creare il commit di release e inviarlo su `main`. Lo script rifiuta una
   working tree con modifiche non committate, così l'immagine resta associata
   esattamente al commit mostrato nei suoi metadati.
3. Eseguire dalla root del repository:

```bash
./backend/scripts/build-and-push.sh
```

4. Controllare il riepilogo e scrivere `DEPLOY` quando richiesto.

Lo script esegue in ordine:

1. validazione della versione;
2. build Linux/AMD64 e test Maven dentro Docker;
3. push di `us-central1-docker.pkg.dev/asomusic-d39c4/app-repo/backend:<VERSION>`;
4. deploy dell'immagine sul servizio Cloud Run `backend-prod`;
5. stampa di versione, revisione Cloud Run e URL del servizio.

Per vedere i comandi senza modificare Google Cloud:

```bash
./backend/scripts/build-and-push.sh --dry-run
```

Il tag di una versione già pubblicata non viene sovrascritto. In quel caso è
necessario incrementare `VERSION`. Questo mantiene ogni release identificabile
e rende possibile tornare a una versione precedente con:

```bash
gcloud run deploy backend-prod \
  --image us-central1-docker.pkg.dev/asomusic-d39c4/app-repo/backend:<VERSIONE-PRECEDENTE> \
  --region us-central1 \
  --project asomusic-d39c4
```

## 📚 Learn More

- [Expo Docs](https://docs.expo.dev/)
- [React Native Docs](https://reactnative.dev/)
- [Expo Router Guide](https://expo.github.io/router/docs)

## 👤 Author

**Antonio Marroffino**

- [GitHub](https://github.com/antoniomarroffino)
- [LinkedIn](https://www.linkedin.com/in/antoniomarroffino)

**Luca Frigerio**

- [GitHub](https://github.com/lucaroft)
- [LinkedIn](https://www.linkedin.com/in/luca-frigerio-2b7331349)

## 📜 License

This project is open-source.
