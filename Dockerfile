FROM composer:2 AS composer

WORKDIR /app
COPY . .
RUN composer install \
    --no-dev \
    --no-interaction \
    --optimize-autoloader \
    --ignore-platform-reqs


FROM node:18 AS node

WORKDIR /app
COPY . .
RUN npm install && npm run build && npm prune --production


FROM php:8.2-cli

RUN apt-get update && apt-get install -y libzip-dev zip sqlite3 libsqlite3-dev sudo && \
    docker-php-ext-install zip pdo pdo_sqlite && \
    apt-get remove -y libzip-dev libsqlite3-dev && \
    rm -rf /var/lib/apt/lists/*

ARG USER_ID=1000
ARG GROUP_ID=1000

ENV DB_CONNECTION=sqlite \
    DB_DATABASE=/data/data.db \
    PORT=8000 \
    USER_ID=${USER_ID} \
    GROUP_ID=${GROUP_ID}

RUN mkdir /app && \
    groupadd -g ${GROUP_ID} app && \
    useradd -u ${USER_ID} -g app -d /app app && \
    usermod -a -G root app && \
    chown -R app:app /app

WORKDIR /app

COPY --from=composer /app .
COPY --from=node /app/public/build public/build

COPY --chown=app:app docker/entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--no-interaction"]
