# ---- Stage 1: Build the React Frontend ----
FROM node:22-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install --legacy-peer-deps
COPY frontend/ ./
RUN npm run build

# ---- Stage 2: Setup the Laravel Backend + Serve React ----
FROM php:8.2-apache

# Install system dependencies
RUN apt-get update && apt-get install -y \
    zip unzip git libpng-dev libonig-dev libxml2-dev \
    sqlite3 libsqlite3-dev libpq-dev \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-install pdo_mysql pdo_sqlite pdo_pgsql pgsql mbstring exif pcntl bcmath gd

# Get Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Set Apache Document Root to Laravel's public folder
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# Enable Apache mod_rewrite
RUN a2enmod rewrite

# Copy backend files
COPY backend/ /var/www/html

# Install Composer dependencies
RUN composer install --no-dev --optimize-autoloader

# Copy the built React frontend into Laravel's public folder
COPY --from=frontend-build /app/frontend/dist /var/www/html/public/app

# Create SQLite database
RUN touch database/database.sqlite

# Setup initial .env from template (this only runs during build)
RUN cp .env.example .env && php artisan key:generate

# Set permissions
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache /var/www/html/database

# Expose port (Documentation)
EXPOSE 80

# Start: dynamically bind Apache to Render's $PORT, safely migrate DB, then run Apache
# Note: We do NOT overwrite .env at runtime anymore so that Render dashboard variables are preserved.
CMD sed -i "s/80/${PORT}/g" /etc/apache2/sites-available/000-default.conf /etc/apache2/ports.conf \
    && php artisan migrate --force \
    && apache2-foreground