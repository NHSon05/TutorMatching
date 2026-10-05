#!/usr/bin/env bash
#
# Photonix — License Setup
# Activate your license and configure .npmrc in one command.
#
# Usage:
#   curl -fsSL https://photonix.dev/install.sh | bash
#

set -euo pipefail

REGISTRY_URL="https://npm.photonix.dev"
REGISTRY_HOST="${REGISTRY_URL#https://}"

# ── Colors ───────────────────────────────────────────────
BOLD='\033[1m'
CYAN='\033[36m'
GREEN='\033[32m'
RED='\033[31m'
YELLOW='\033[33m'
DIM='\033[2m'
RESET='\033[0m'

echo ""
echo -e "${BOLD}${CYAN}🛡️  Photonix License Setup${RESET}"
echo -e "${DIM}Activate your license and configure .npmrc for private package access.${RESET}"
echo ""

# ── 1. License Key ───────────────────────────────────────
printf "Enter your License Key: "
read -rs LICENSE_KEY
echo ""

if [ -z "$LICENSE_KEY" ]; then
  echo -e "${RED}❌ License key is required.${RESET}"
  exit 1
fi

# ── 2. Device Label ──────────────────────────────────────
DEFAULT_LABEL="$(hostname) ($(whoami))"
printf "Device label ${DIM}[${DEFAULT_LABEL}]${RESET}: "
read -r LABEL
LABEL="${LABEL:-$DEFAULT_LABEL}"

echo ""
echo -e "${YELLOW}⏳ Activating device...${RESET}"

# ── 3. Call API ──────────────────────────────────────────
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${REGISTRY_URL}/license/activate-cli" \
  -H "Content-Type: application/json" \
  -d "{\"licenseKey\":\"${LICENSE_KEY}\",\"label\":\"${LABEL}\"}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

# ── 4. Parse response ───────────────────────────────────
# Check for curl failure
if [ -z "$BODY" ]; then
  echo -e "${RED}❌ Could not reach the Photonix server. Check your internet connection.${RESET}"
  exit 1
fi

# Extract success field
SUCCESS=$(echo "$BODY" | grep -o '"success":true' || true)

if [ -z "$SUCCESS" ]; then
  ERROR=$(echo "$BODY" | sed -n 's/.*"error":"\([^"]*\)".*/\1/p')
  echo -e "${RED}❌ Activation failed: ${ERROR:-Unknown error (HTTP ${HTTP_CODE})}${RESET}"
  exit 1
fi

# Extract token
TOKEN=$(echo "$BODY" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')

if [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ Server returned success but no token was found in the response.${RESET}"
  exit 1
fi

# ── 5. Write .npmrc ──────────────────────────────────────
NPMRC_PATH=".npmrc"

cat > "$NPMRC_PATH" <<EOF
@photonix:registry=${REGISTRY_URL}
//${REGISTRY_HOST}/:_authToken=${TOKEN}
always-auth=true
EOF

echo ""
echo -e "${GREEN}✅ Success! Device activated and .npmrc created.${RESET}"
echo ""
echo -e "   ${DIM}Token:${RESET}  ...${TOKEN: -6}"
echo -e "   ${DIM}Label:${RESET}  ${LABEL}"
echo -e "   ${DIM}File:${RESET}   $(pwd)/${NPMRC_PATH}"
echo ""
echo -e "${CYAN}📦 You can now run ${BOLD}pnpm install${RESET}${CYAN} to get Photonix packages.${RESET}"
echo ""
