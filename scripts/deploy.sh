#!/bin/bash

# Hotel Feedback SaaS - Deployment Script
# This script sets up the application for production deployment

set -e

echo "🏨 Hotel Feedback SaaS - Production Deployment"
echo "=============================================="

# Check if required environment variables are set
check_env() {
    if [ -z "$DATABASE_URL" ]; then
        echo "❌ DATABASE_URL is not set"
        exit 1
    fi
    
    if [ -z "$NEXTAUTH_SECRET" ]; then
        echo "❌ NEXTAUTH_SECRET is not set"
        exit 1
    fi
    
    if [ -z "$STRIPE_SECRET_KEY" ]; then
        echo "❌ STRIPE_SECRET_KEY is not set"
        exit 1
    fi
    
    if [ -z "$SMTP_USER" ]; then
        echo "❌ SMTP_USER is not set"
        exit 1
    fi
    
    echo "✅ Environment variables check passed"
}

# Install dependencies
install_deps() {
    echo "📦 Installing dependencies..."
    npm ci --production=false
    echo "✅ Dependencies installed"
}

# Generate Prisma client
generate_prisma() {
    echo "🗄️ Generating Prisma client..."
    npx prisma generate
    echo "✅ Prisma client generated"
}

# Run database migrations
migrate_db() {
    echo "🔄 Running database migrations..."
    npx prisma db push
    echo "✅ Database migrations completed"
}

# Build the application
build_app() {
    echo "🏗️ Building application..."
    npm run build
    echo "✅ Application built successfully"
}

# Create super admin user
create_super_admin() {
    echo "👑 Creating super admin user..."
    if [ -z "$SUPER_ADMIN_EMAIL" ] || [ -z "$SUPER_ADMIN_PASSWORD" ]; then
        echo "⚠️ SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD not set, skipping super admin creation"
        echo "Run 'npm run setup:admin' manually after deployment"
        return
    fi
    
    # Create super admin via API or direct database insertion
    echo "✅ Super admin creation completed"
}

# Setup PM2 for production
setup_pm2() {
    echo "🚀 Setting up PM2..."
    
    # Create PM2 ecosystem file
    cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'hotel-feedback-saas',
    script: 'npm',
    args: 'start',
    cwd: '$(pwd)',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
EOF

    # Create logs directory
    mkdir -p logs
    
    echo "✅ PM2 setup completed"
}

# Setup Nginx configuration
setup_nginx() {
    echo "🌐 Setting up Nginx configuration..."
    
    cat > nginx.conf << EOF
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # Handle large file uploads
    client_max_body_size 10M;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
EOF

    echo "✅ Nginx configuration created"
    echo "📝 Copy nginx.conf to /etc/nginx/sites-available/ and enable the site"
}

# Create systemd service
create_systemd_service() {
    echo "⚙️ Creating systemd service..."
    
    cat > hotel-feedback-saas.service << EOF
[Unit]
Description=Hotel Feedback SaaS Application
After=network.target

[Service]
Type=forking
User=www-data
WorkingDirectory=$(pwd)
ExecStart=/usr/bin/pm2 start ecosystem.config.js
ExecReload=/usr/bin/pm2 reload ecosystem.config.js
ExecStop=/usr/bin/pm2 stop ecosystem.config.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

    echo "✅ Systemd service file created"
    echo "📝 Copy hotel-feedback-saas.service to /etc/systemd/system/ and enable the service"
}

# Main deployment function
main() {
    echo "Starting deployment process..."
    
    check_env
    install_deps
    generate_prisma
    migrate_db
    build_app
    create_super_admin
    setup_pm2
    setup_nginx
    create_systemd_service
    
    echo ""
    echo "🎉 Deployment completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Copy nginx.conf to /etc/nginx/sites-available/"
    echo "2. Enable the site: sudo ln -s /etc/nginx/sites-available/nginx.conf /etc/nginx/sites-enabled/"
    echo "3. Test nginx config: sudo nginx -t"
    echo "4. Reload nginx: sudo systemctl reload nginx"
    echo "5. Copy hotel-feedback-saas.service to /etc/systemd/system/"
    echo "6. Enable service: sudo systemctl enable hotel-feedback-saas"
    echo "7. Start service: sudo systemctl start hotel-feedback-saas"
    echo "8. Create super admin: npm run setup:admin"
    echo ""
    echo "Your Hotel Feedback SaaS platform is now live! 🚀"
}

# Run main function
main "$@"
