#!/bin/bash

if [ ! -d "/data" ]; then
    mkdir -p "/data"
    chown ${USER_ID}:${GROUP_ID} "/data"
fi

if [ ! -f "/data/.env" ]; then
    cp "/app/.env.example" "/data/.env"
    chown ${USER_ID}:${GROUP_ID} "/data/.env"
fi

ln -sf /data/.env /app/.env

if grep -q '^APP_KEY=$' "/app/.env"; then
    php artisan key:generate
fi

if [ "${DB_CONNECTION}" = "sqlite" ] && [ ! -f "${DB_DATABASE}" ]; then
    touch "${DB_DATABASE}"
    chown ${USER_ID}:${GROUP_ID} "${DB_DATABASE}"
fi

php artisan migrate --force
php artisan optimize

exec sudo -Hiu app "$@"