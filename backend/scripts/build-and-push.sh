#!/usr/bin/env bash

set -Eeuo pipefail

readonly SCRIPT_DIR="$(
    cd "$(dirname "${BASH_SOURCE[0]}")" && pwd
)"
readonly BACKEND_DIR="$(
    cd "${SCRIPT_DIR}/.." && pwd
)"
readonly PROJECT_DIR="$(
    cd "${BACKEND_DIR}/.." && pwd
)"

readonly GCP_PROJECT="asomusic-d39c4"
readonly GCP_REGION="us-central1"
readonly ARTIFACT_REPOSITORY="app-repo"
readonly IMAGE_NAME="backend"
readonly CLOUD_RUN_SERVICE="backend-prod"
readonly VERSION_FILE="${PROJECT_DIR}/VERSION"

ASSUME_YES=false
DRY_RUN=false

usage() {
    cat <<'EOF'
Uso: ./backend/scripts/build-and-push.sh [--yes] [--dry-run]

Costruisce e testa il backend in Docker, pubblica l'immagine versionata su
Artifact Registry e aggiorna manualmente il servizio Cloud Run.

Opzioni:
  --yes      salta la conferma interattiva
  --dry-run  mostra versione e comandi senza eseguire il deploy
  --help     mostra questo messaggio
EOF
}

fail() {
    echo "Errore: $*" >&2
    exit 1
}

print_command() {
    printf '  '
    printf '%q ' "$@"
    printf '\n'
}

while (($# > 0)); do
    case "$1" in
        --yes)
            ASSUME_YES=true
            ;;
        --dry-run)
            DRY_RUN=true
            ;;
        --help|-h)
            usage
            exit 0
            ;;
        *)
            usage >&2
            fail "opzione non riconosciuta: $1"
            ;;
    esac

    shift
done

[[ -f "${VERSION_FILE}" ]] ||
    fail "file VERSION non trovato in ${VERSION_FILE}"

VERSION="$(tr -d '[:space:]' < "${VERSION_FILE}")"

[[ "${VERSION}" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] ||
    fail "VERSION deve essere una versione valida, ad esempio 1.5.0"

readonly VERSION
readonly IMAGE_REPOSITORY="${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT}/${ARTIFACT_REPOSITORY}/${IMAGE_NAME}"
readonly IMAGE_URI="${IMAGE_REPOSITORY}:${VERSION}"
readonly GIT_REVISION="$(
    git -C "${PROJECT_DIR}" rev-parse --short=12 HEAD 2>/dev/null ||
        printf 'unknown'
)"
readonly WORKTREE_STATUS="$(
    git -C "${PROJECT_DIR}" status --porcelain 2>/dev/null ||
        printf 'git-unavailable'
)"

REGISTRY_AUTH_COMMAND=(
    gcloud auth configure-docker
    "${GCP_REGION}-docker.pkg.dev"
    --quiet
)

BUILD_COMMAND=(
    docker build
    --platform linux/amd64
    --build-arg "APP_VERSION=${VERSION}"
    --build-arg "GIT_REVISION=${GIT_REVISION}"
    --tag "${IMAGE_URI}"
    "${BACKEND_DIR}"
)

PUSH_COMMAND=(
    docker push "${IMAGE_URI}"
)

DEPLOY_COMMAND=(
    gcloud run deploy "${CLOUD_RUN_SERVICE}"
    --image "${IMAGE_URI}"
    --region "${GCP_REGION}"
    --project "${GCP_PROJECT}"
    --platform managed
    --quiet
)

echo "ASO Music backend ${VERSION}"
echo "Immagine: ${IMAGE_URI}"
echo "Commit: ${GIT_REVISION}"

if [[ -n "${WORKTREE_STATUS}" ]]; then
    echo "Stato sorgenti: modifiche non committate (il deploy reale verrà bloccato)"
else
    echo "Stato sorgenti: pulito"
fi

if [[ "${DRY_RUN}" == true ]]; then
    echo ""
    echo "Autenticazione Artifact Registry:"
    print_command "${REGISTRY_AUTH_COMMAND[@]}"
    echo "Build locale:"
    print_command "${BUILD_COMMAND[@]}"
    echo "Push:"
    print_command "${PUSH_COMMAND[@]}"
    echo "Cloud Run:"
    print_command "${DEPLOY_COMMAND[@]}"
    exit 0
fi

if [[ -n "${WORKTREE_STATUS}" ]]; then
    fail "il repository contiene modifiche non committate; crea il commit di release prima del deploy"
fi

command -v gcloud >/dev/null 2>&1 ||
    fail "gcloud CLI non è installata"

command -v docker >/dev/null 2>&1 ||
    fail "Docker non è installato"

docker info >/dev/null 2>&1 ||
    fail "Docker non è avviato o non è accessibile"

ACTIVE_ACCOUNT="$(
    gcloud auth list \
        --filter=status:ACTIVE \
        --format='value(account)' \
        | sed -n '1p'
)"

[[ -n "${ACTIVE_ACCOUNT}" ]] ||
    fail "nessun account gcloud attivo; esegui gcloud auth login"

gcloud projects describe "${GCP_PROJECT}" \
    --format='value(projectId)' >/dev/null ||
    fail "l'account attivo non può accedere al progetto ${GCP_PROJECT}"

echo "Account GCP: ${ACTIVE_ACCOUNT}"

if gcloud artifacts docker images describe "${IMAGE_URI}" \
    --project "${GCP_PROJECT}" >/dev/null 2>&1; then
    fail "il tag ${VERSION} esiste già: incrementa VERSION prima di pubblicare"
fi

if [[ "${ASSUME_YES}" != true ]]; then
    echo ""
    echo "Il comando creerà una nuova revisione di ${CLOUD_RUN_SERVICE}."
    read -r -p "Scrivi DEPLOY per continuare: " CONFIRMATION

    [[ "${CONFIRMATION}" == "DEPLOY" ]] || {
        echo "Deploy annullato."
        exit 0
    }
fi

echo ""
echo "1/3 Configurazione di Artifact Registry..."
"${REGISTRY_AUTH_COMMAND[@]}"

echo ""
echo "2/3 Build e test dell'immagine..."
"${BUILD_COMMAND[@]}"

echo ""
echo "Push dell'immagine..."
"${PUSH_COMMAND[@]}"

echo ""
echo "3/3 Deploy su Cloud Run..."
"${DEPLOY_COMMAND[@]}"

SERVICE_URL="$(
    gcloud run services describe "${CLOUD_RUN_SERVICE}" \
        --region "${GCP_REGION}" \
        --project "${GCP_PROJECT}" \
        --format='value(status.url)'
)"

REVISION="$(
    gcloud run services describe "${CLOUD_RUN_SERVICE}" \
        --region "${GCP_REGION}" \
        --project "${GCP_PROJECT}" \
        --format='value(status.latestReadyRevisionName)'
)"

echo ""
echo "Deploy completato."
echo "Versione: ${VERSION}"
echo "Revisione: ${REVISION}"
echo "URL: ${SERVICE_URL}"
