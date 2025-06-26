#!/bin/bash

set -e
echo "[entrypoint.sh] Entorno: $DEPLOY_ENV"
echo "[entrypoint.sh] Buscando secreto: $SECRET_NAME en región: ${AWS_REGION}"

# Intenta obtener el secreto
set +e
SECRETS_JSON=$(aws secretsmanager get-secret-value \
  --secret-id "$SECRET_NAME" \
  --region "${AWS_REGION}" \
  --query SecretString \
  --output text 2>/dev/null)
EXIT_CODE=$?
set -e

if [ $EXIT_CODE -ne 0 ]; then
  echo "[entrypoint.sh] ⚠️ No se encontró el secreto '$SECRET_NAME'."
  echo "[entrypoint.sh] Continuando sin sobrescribir variables de entorno..."
else
  echo "[entrypoint.sh] ✅ Secreto recuperado, exportando variables..."
  export $(echo "$SECRETS_JSON" | jq -r 'to_entries[] | "\(.key)=\(.value)"')
fi

echo "[entrypoint.sh] 🚀 Running migrations..."
yarn db:migrate

# Ejecutar el proceso original
exec "$@"
