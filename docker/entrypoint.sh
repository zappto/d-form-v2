#!/bin/sh
set -e

# Change to app directory
cd /app

echo "Checking dependencies..."

# Fix dubious ownership for git
git config --global --add safe.directory /app || true

# Check if composer dependencies are installed
if [ ! -f "vendor/autoload.php" ]; then
    echo "Composer dependencies not found. Installing..."
    composer install --no-interaction --prefer-dist --optimize-autoloader
fi

# Ensure node_modules/vite is actually working
if [ "$APP_ENV" = "local" ]; then
    if [ ! -x "node_modules/.bin/vite" ]; then
        echo "Vite not found or not executable. Running npm install..."
        npm install --no-interaction
    fi
fi

# Ensure permissions
echo "Setting permissions..."
chmod -R 775 storage bootstrap/cache public 2>/dev/null || true

# Public disk: symlink public/storage -> storage/app/public (banner URLs /storage/...)
echo "Ensuring storage link..."
php artisan storage:link 2>/dev/null || true

# Generate APP_KEY if not set
if [ -z "$(grep '^APP_KEY=' .env | cut -d '=' -f2)" ]; then
    echo "Generating APP_KEY..."
    php artisan key:generate --force
fi

if [ "$APP_ENV" = "local" ]; then
    echo "Starting Vite..."
    # Run vite directly from node_modules
    ./node_modules/.bin/vite --host 0.0.0.0 &
    sleep 2
else
    echo "Building assets..."
    npm run build
fi

echo "Starting Octane..."
exec php artisan octane:frankenphp "$@"
