FROM php:8.2-apache

# Install dependencies for Laravel
RUN apt-get update && apt-get install -y \
    zip \
    unzip \
    git \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    sqlite3 \
    libsqlite3-dev \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install PHP Extensions
RUN docker-php-ext-install pdo_mysql pdo_sqlite mbstring exif pcntl bcmath gd

# Get latest Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Define the Document Root as Laravel's public folder
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# Enable Apache mod_rewrite for Laravel routing
RUN a2enmod rewrite

# Copy the rest of the backend files
COPY . /var/www/html

# Run composer installation
RUN composer install --no-dev --optimize-autoloader

# Create the SQLite Database file inside the container
RUN touch database/database.sqlite

# Copy .env.example to .env
RUN cp .env.example .env

# Generate Application Key
RUN php artisan key:generate

# Set the correct permissions for Laravel
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# Expose Port 80 for Render HTTP
EXPOSE 80

# When the container starts, migrate the fake data into SQLite and run Apache
CMD php artisan migrate:fresh --seed && apache2-foreground
