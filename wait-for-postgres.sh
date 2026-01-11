#!/bin/sh
set -e

host=${DB_HOST:-db}
port=${DB_PORT:-5432}

echo "Waiting for Postgres at $host:$port ..."
# use pg_isready (postgres-client installed in Dockerfile)
until pg_isready -h "$host" -p "$port" >/dev/null 2>&1; do
  echo "$(date +%T) - waiting for postgres..."
  sleep 1
done

echo "Postgres is up — continuing."
# script exits; the CMD will continue to start the Node app
