#!/bin/bash
# This script runs after PostgreSQL is installed to initialize the database
# and run migrations

set -e

echo "Setting up PostgreSQL..."
sudo -u postgres psql -c "CREATE USER codespace WITH PASSWORD 'codespace';" 2>/dev/null || true
sudo -u postgres psql -c "CREATE DATABASE saas OWNER codespace;" 2>/dev/null || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE saas TO codespace;" 2>/dev/null || true

echo "PostgreSQL initialized!"
