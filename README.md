# Hotel Feedback SaaS Platform

A comprehensive SaaS platform for hotels to collect, manage, and leverage guest feedback through QR codes, customizable forms, and automated review filtering.

## Features

### 🏨 Hotel Management
- Multi-tenant architecture with hotel-specific portals
- Custom branding and theming per hotel
- Subscription-based billing with Stripe integration
- Role-based access control (Super Admin, Hotel Admin)

### 📱 Guest Feedback Collection
- QR code generation for easy guest access
- Mobile-friendly feedback forms
- Customizable form builder with multiple field types
- No app download required for guests

### ⭐ Smart Review Management
- Automatic review filtering (1-3 stars stay private, 4-5 stars for external sharing)
- Integration with Google Reviews and TripAdvisor
- Internal dashboard for review management
- Real-time notifications and alerts

### 📊 Analytics & Reporting
- Comprehensive analytics dashboard
- Review trends and satisfaction scores
- Response rate tracking
- Custom reports and insights

### 🔧 Super Admin Panel
- System-wide oversight and management
- Hotel onboarding and subscription management
- Analytics and reporting across all hotels
- System settings and configuration

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, PrimeReact
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: MongoDB
- **Authentication**: NextAuth.js
- **Payments**: Stripe
- **QR Codes**: qrcode library
- **Styling**: PrimeFlex, SCSS
- **Deployment**: Digital Ocean (recommended)

## Getting Started

### Prerequisites

- Node.js 18+ 
- MongoDB database
- Stripe account (for payments)
- Email service (SMTP)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd hotel-feedback-saas
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Fill in your environment variables:
   ```env
   DATABASE_URL="mongodb://localhost:27017/hotel-feedback-saas"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key"
   STRIPE_PUBLISHABLE_KEY="pk_test_..."
   STRIPE_SECRET_KEY="sk_test_..."
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT="587"
   SMTP_USER="your-email@gmail.com"
   SMTP_PASS="your-app-password"
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Create a super admin user**
   ```bash
   # You'll need to manually create a super admin user in the database
   # or use the API endpoint to create one
   ```

6. **Run the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   Navigate to `http://localhost:3000`

## Project Structure

```
hotel-feedback-saas/
├── app/
│   ├── api/                    # API routes
│   │   ├── auth/              # Authentication endpoints
│   │   ├── hotels/            # Hotel management
│   │   ├── guest-feedback/    # Guest feedback forms
│   │   ├── qr-codes/          # QR code generation
│   │   └── super-admin/        # Super admin endpoints
│   ├── (full-page)/           # Full-page layouts
│   │   ├── auth/              # Authentication pages
│   │   ├── hotel-dashboard/   # Hotel admin dashboard
│   │   ├── super-admin/       # Super admin panel
│   │   └── guest-feedback/    # Guest feedback forms
│   ├── components/            # Reusable components
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utility libraries
│   └── types/                 # TypeScript type definitions
├── prisma/
│   └── schema.prisma          # Database schema
├── public/                     # Static assets
└── styles/                     # Global styles
```

## Key Components

### Authentication System
- NextAuth.js with credentials provider
- Role-based access control
- Session management with JWT

### Database Schema
- Multi-tenant design with hotel isolation
- Comprehensive review and form management
- Subscription and billing tracking

### Guest Feedback Flow
1. Hotel generates QR code
2. Guest scans QR code → mobile-friendly form
3. Form submission → automatic filtering
4. High ratings → external sharing prompts
5. Low ratings → internal dashboard only

### Hotel Dashboard
- Real-time statistics and metrics
- Review management and approval
- Form customization and QR code generation
- Analytics and reporting

### Super Admin Panel
- System-wide hotel management
- Subscription oversight
- Analytics across all hotels
- System configuration

## API Endpoints

### Authentication
- `POST /api/auth/[...nextauth]` - NextAuth endpoints
- `POST /api/hotels/register` - Hotel registration

### Guest Feedback
- `GET /api/guest-feedback/[hotelSlug]` - Get hotel's feedback form
- `POST /api/guest-feedback/[hotelSlug]/submit` - Submit feedback

### QR Codes
- `POST /api/qr-codes/generate` - Generate QR code

### Hotel Management
- `GET /api/hotels` - List hotels (Super Admin)
- `PUT /api/hotels/[id]` - Update hotel
- `DELETE /api/hotels/[id]` - Delete hotel

## Deployment

### Digital Ocean Setup

1. **Create Droplet**
   - Ubuntu 22.04 LTS
   - Minimum 2GB RAM, 1 CPU
   - 25GB SSD storage

2. **Install Dependencies**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install PM2
   sudo npm install -g pm2
   
   # Install MongoDB
   wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
   echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
   sudo apt-get update
   sudo apt-get install -y mongodb-org
   sudo systemctl start mongod
   sudo systemctl enable mongod
   ```

3. **Deploy Application**
   ```bash
   # Clone repository
   git clone <repository-url>
   cd hotel-feedback-saas
   
   # Install dependencies
   npm install
   
   # Build application
   npm run build
   
   # Start with PM2
   pm2 start npm --name "hotel-feedback-saas" -- start
   pm2 save
   pm2 startup
   ```

4. **Configure Nginx**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | MongoDB connection string | Yes |
| `NEXTAUTH_URL` | Application URL | Yes |
| `NEXTAUTH_SECRET` | NextAuth secret key | Yes |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | Yes |
| `STRIPE_SECRET_KEY` | Stripe secret key | Yes |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | Yes |
| `SMTP_HOST` | SMTP server host | Yes |
| `SMTP_PORT` | SMTP server port | Yes |
| `SMTP_USER` | SMTP username | Yes |
| `SMTP_PASS` | SMTP password | Yes |
| `APP_URL` | Application base URL | Yes |
| `QR_CODE_BASE_URL` | QR code base URL | Yes |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team or create an issue in the repository.
# HotelManagement
