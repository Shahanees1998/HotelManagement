# Hotel Feedback SaaS - Production Deployment Checklist

## ✅ Pre-Deployment Checklist

### Environment Setup
- [ ] MongoDB database configured and accessible
- [ ] Stripe account created with API keys
- [ ] SMTP email service configured (Gmail, SendGrid, etc.)
- [ ] Domain name registered and DNS configured
- [ ] SSL certificate obtained (Let's Encrypt recommended)

### Environment Variables
- [ ] `DATABASE_URL` - MongoDB connection string
- [ ] `NEXTAUTH_URL` - Production domain URL
- [ ] `NEXTAUTH_SECRET` - Strong secret key (32+ characters)
- [ ] `STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- [ ] `STRIPE_SECRET_KEY` - Stripe secret key
- [ ] `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
- [ ] `SMTP_HOST` - SMTP server hostname
- [ ] `SMTP_PORT` - SMTP server port (587 for TLS)
- [ ] `SMTP_USER` - SMTP username
- [ ] `SMTP_PASS` - SMTP password/app password
- [ ] `APP_URL` - Production application URL
- [ ] `QR_CODE_BASE_URL` - QR code base URL

### Security Configuration
- [ ] Strong passwords for all accounts
- [ ] Database access restricted to application server
- [ ] Firewall configured (ports 22, 80, 443 only)
- [ ] SSH key authentication enabled
- [ ] Regular security updates scheduled

## 🚀 Deployment Steps

### 1. Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install MongoDB (if self-hosting)
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

# Install Nginx
sudo apt install -y nginx
```

### 2. Application Deployment
```bash
# Clone repository
git clone <repository-url>
cd hotel-feedback-saas

# Set environment variables
cp env.example .env.local
# Edit .env.local with production values

# Run deployment script
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

### 3. Database Setup
```bash
# Generate Prisma client
npx prisma generate

# Push database schema
npx prisma db push

# Create super admin user
npm run setup:admin
```

### 4. Web Server Configuration
```bash
# Copy Nginx configuration
sudo cp nginx.conf /etc/nginx/sites-available/hotel-feedback-saas
sudo ln -s /etc/nginx/sites-available/hotel-feedback-saas /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### 5. SSL Certificate (Let's Encrypt)
```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com

# Test automatic renewal
sudo certbot renew --dry-run
```

### 6. Service Management
```bash
# Copy systemd service file
sudo cp hotel-feedback-saas.service /etc/systemd/system/

# Enable and start service
sudo systemctl enable hotel-feedback-saas
sudo systemctl start hotel-feedback-saas

# Check service status
sudo systemctl status hotel-feedback-saas
```

## 🔧 Post-Deployment Configuration

### Stripe Webhook Setup
1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://your-domain.com/api/webhooks/stripe`
3. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy webhook secret to environment variables

### Email Service Configuration
1. Configure SMTP settings in environment variables
2. Test email sending with welcome email
3. Set up email templates for notifications
4. Configure email delivery monitoring

### Monitoring Setup
```bash
# Install monitoring tools
sudo apt install -y htop iotop nethogs

# Set up log rotation
sudo nano /etc/logrotate.d/hotel-feedback-saas
```

### Backup Configuration
```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --uri="$DATABASE_URL" --out="/backups/mongodb_$DATE"
tar -czf "/backups/app_$DATE.tar.gz" /path/to/hotel-feedback-saas
find /backups -name "*.tar.gz" -mtime +7 -delete
EOF

chmod +x backup.sh

# Add to crontab for daily backups
echo "0 2 * * * /path/to/backup.sh" | crontab -
```

## 🧪 Testing Checklist

### Functional Testing
- [ ] Hotel registration flow works
- [ ] Guest feedback form submission works
- [ ] QR code generation works
- [ ] Review filtering (high/low ratings) works
- [ ] External sharing prompts work
- [ ] Hotel dashboard loads correctly
- [ ] Super admin panel functions
- [ ] Payment integration works
- [ ] Email notifications sent
- [ ] Analytics data displays

### Performance Testing
- [ ] Page load times < 3 seconds
- [ ] Database queries optimized
- [ ] Image optimization working
- [ ] CDN configured (if applicable)
- [ ] Caching implemented

### Security Testing
- [ ] Authentication required for protected routes
- [ ] Input validation working
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] CSRF protection
- [ ] Rate limiting implemented

## 📊 Monitoring & Maintenance

### Daily Monitoring
- [ ] Check application logs for errors
- [ ] Monitor server resources (CPU, memory, disk)
- [ ] Verify email delivery
- [ ] Check payment processing
- [ ] Monitor user registrations

### Weekly Maintenance
- [ ] Review security logs
- [ ] Update dependencies
- [ ] Check backup integrity
- [ ] Review performance metrics
- [ ] Update documentation

### Monthly Tasks
- [ ] Security updates
- [ ] Performance optimization review
- [ ] User feedback analysis
- [ ] Feature usage analytics
- [ ] Cost optimization review

## 🚨 Troubleshooting

### Common Issues
1. **Application won't start**
   - Check environment variables
   - Verify database connection
   - Check PM2 logs: `pm2 logs`

2. **Database connection errors**
   - Verify DATABASE_URL format
   - Check MongoDB service status
   - Verify network connectivity

3. **Email not sending**
   - Check SMTP credentials
   - Verify firewall settings
   - Test SMTP connection

4. **Payment issues**
   - Verify Stripe API keys
   - Check webhook configuration
   - Review Stripe dashboard logs

5. **Performance issues**
   - Check server resources
   - Review database queries
   - Optimize images and assets

### Support Contacts
- Technical Support: [your-email]
- Stripe Support: https://support.stripe.com
- MongoDB Support: https://support.mongodb.com
- Server Provider Support: [your-provider]

## 📈 Scaling Considerations

### When to Scale
- Database queries taking > 1 second
- Server CPU usage > 80%
- Memory usage > 90%
- Response times > 3 seconds
- High error rates

### Scaling Options
1. **Vertical Scaling**: Upgrade server resources
2. **Horizontal Scaling**: Add more application servers
3. **Database Scaling**: MongoDB replica sets
4. **CDN**: CloudFlare or AWS CloudFront
5. **Load Balancing**: Nginx or HAProxy

---

## ✅ Final Verification

Before going live, ensure:
- [ ] All tests pass
- [ ] SSL certificate valid
- [ ] Domain DNS configured
- [ ] Email notifications working
- [ ] Payment processing functional
- [ ] Backup system operational
- [ ] Monitoring in place
- [ ] Documentation updated

**🎉 Your Hotel Feedback SaaS platform is ready for production!**
