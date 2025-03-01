#!/bin/bash

if [ ! -d "/data" ]; then
    sudo mkdir -p "/data"
    sudo chown app:app "/data"
    sudo chmod 755 "/data"
fi

if [ ! -f "/data/.env" ]; then
    cp "/app/.env.example" "/data/.env"
fi

ln -sf /data/.env /app/.env

if grep -q '^APP_KEY=$' "/app/.env"; then
    php artisan key:generate
fi

if [ ! -f "/data/data.db" ]; then
    touch "/data/data.db"
    chmod 664 "/data/data.db"
fi

php artisan migrate --force
php artisan optimize

exec php artisan serve \
    --host=0.0.0.0 \
    --port=${PORT} \
    --no-interaction