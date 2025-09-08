# Hotel Feedback SaaS - API Documentation

## Base URL
```
Production: https://your-domain.com/api
Development: http://localhost:3000/api
```

## Authentication
Most endpoints require authentication via NextAuth.js session cookies.

## Response Format
All API responses follow this format:
```json
{
  "message": "Success message",
  "data": { ... },
  "error": "Error message (if applicable)"
}
```

---

## Authentication Endpoints

### POST /api/auth/[...nextauth]
NextAuth.js authentication endpoints.

**Login:**
```bash
POST /api/auth/signin
Content-Type: application/json

{
  "email": "admin@hotel.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": {
    "id": "user_id",
    "email": "admin@hotel.com",
    "name": "John Doe",
    "role": "HOTEL_ADMIN",
    "hotelId": "hotel_id",
    "hotel": {
      "id": "hotel_id",
      "name": "Grand Hotel",
      "slug": "grand-hotel"
    }
  }
}
```

---

## Hotel Management

### POST /api/hotels/register
Register a new hotel and admin user.

**Request:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "admin@hotel.com",
  "password": "password123",
  "confirmPassword": "password123",
  "hotelName": "Grand Hotel",
  "hotelEmail": "info@grandhotel.com",
  "hotelPhone": "+1234567890",
  "hotelAddress": "123 Main Street",
  "hotelCity": "New York",
  "hotelState": "NY",
  "hotelCountry": "USA",
  "hotelZipCode": "10001",
  "subscriptionPlan": "premium"
}
```

**Response:**
```json
{
  "message": "Registration successful",
  "hotel": {
    "id": "hotel_id",
    "name": "Grand Hotel",
    "slug": "grand-hotel"
  },
  "user": {
    "id": "user_id",
    "email": "admin@hotel.com",
    "role": "HOTEL_ADMIN"
  }
}
```

---

## Guest Feedback

### GET /api/guest-feedback/[hotelSlug]
Get hotel's active feedback form.

**Response:**
```json
{
  "hotel": {
    "id": "hotel_id",
    "name": "Grand Hotel",
    "primaryColor": "#3B82F6",
    "secondaryColor": "#1E40AF",
    "logo": "https://example.com/logo.png"
  },
  "form": {
    "id": "form_id",
    "name": "Guest Feedback Form",
    "description": "Please share your experience",
    "fields": [
      {
        "id": "field_id",
        "label": "Overall Rating",
        "type": "RATING",
        "required": true,
        "order": 1
      },
      {
        "id": "field_id_2",
        "label": "Comments",
        "type": "TEXTAREA",
        "required": true,
        "placeholder": "Tell us about your stay...",
        "order": 2
      }
    ]
  }
}
```

### POST /api/guest-feedback/[hotelSlug]/submit
Submit guest feedback.

**Request:**
```json
{
  "formId": "form_id",
  "responses": {
    "field_id": 5,
    "field_id_2": "Great stay, excellent service!"
  }
}
```

**Response:**
```json
{
  "message": "Feedback submitted successfully",
  "reviewId": "review_id",
  "status": "APPROVED",
  "overallRating": 5
}
```

---

## QR Code Management

### POST /api/qr-codes/generate
Generate a new QR code for hotel.

**Request:**
```json
{
  "name": "Front Desk QR Code",
  "description": "QR code for front desk feedback collection"
}
```

**Response:**
```json
{
  "message": "QR code generated successfully",
  "qrCode": {
    "id": "qr_code_id",
    "name": "Front Desk QR Code",
    "url": "https://your-domain.com/feedback/grand-hotel",
    "imageUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
  }
}
```

---

## Review Management

### PUT /api/hotels/reviews/[id]/status
Update review status.

**Request:**
```json
{
  "status": "APPROVED"
}
```

**Response:**
```json
{
  "message": "Review status updated successfully",
  "review": {
    "id": "review_id",
    "status": "APPROVED",
    "guestName": "John Smith"
  }
}
```

### PUT /api/hotels/reviews/[id]/notes
Update admin notes for review.

**Request:**
```json
{
  "adminNotes": "Great feedback, will follow up with guest"
}
```

**Response:**
```json
{
  "message": "Admin notes updated successfully",
  "review": {
    "id": "review_id",
    "adminNotes": "Great feedback, will follow up with guest"
  }
}
```

---

## Form Management

### POST /api/forms/create
Create a new feedback form.

**Request:**
```json
{
  "name": "Restaurant Feedback",
  "description": "Feedback form for restaurant service",
  "fields": [
    {
      "label": "Food Quality",
      "type": "RATING",
      "required": true,
      "order": 1
    },
    {
      "label": "Service Rating",
      "type": "RATING",
      "required": true,
      "order": 2
    },
    {
      "label": "Comments",
      "type": "TEXTAREA",
      "required": false,
      "placeholder": "Any additional comments?",
      "order": 3
    }
  ]
}
```

**Response:**
```json
{
  "message": "Form created successfully",
  "form": {
    "id": "form_id",
    "name": "Restaurant Feedback",
    "description": "Feedback form for restaurant service",
    "fields": [...]
  }
}
```

### PUT /api/forms/[id]/toggle-active
Toggle form active status.

**Request:**
```json
{
  "isActive": true
}
```

**Response:**
```json
{
  "message": "Form activated successfully",
  "form": {
    "id": "form_id",
    "name": "Restaurant Feedback",
    "isActive": true
  }
}
```

---

## Payment Integration

### POST /api/payments/create-checkout-session
Create Stripe checkout session for subscription.

**Request:**
```json
{
  "plan": "premium"
}
```

**Response:**
```json
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/pay/cs_test_..."
}
```

### POST /api/payments/customer-portal
Create Stripe customer portal session.

**Response:**
```json
{
  "url": "https://billing.stripe.com/p/session_..."
}
```

### POST /api/webhooks/stripe
Stripe webhook endpoint for payment events.

**Events Handled:**
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

---

## Analytics

### GET /api/analytics/hotel/[hotelId]
Get hotel analytics data.

**Query Parameters:**
- `period`: Number of days (default: 30)

**Response:**
```json
{
  "overview": {
    "totalReviews": 150,
    "reviewsInPeriod": 25,
    "averageRating": 4.2,
    "responseRate": 78
  },
  "ratingDistribution": [
    { "rating": 1, "count": 5 },
    { "rating": 2, "count": 8 },
    { "rating": 3, "count": 15 },
    { "rating": 4, "count": 45 },
    { "rating": 5, "count": 77 }
  ],
  "reviewsByStatus": [
    { "status": "PENDING", "count": 10 },
    { "status": "APPROVED", "count": 120 },
    { "status": "REJECTED", "count": 5 },
    { "status": "SHARED_EXTERNALLY", "count": 15 }
  ],
  "monthlyTrends": [
    {
      "month": "2024-01",
      "count": 12,
      "avgRating": 4.1
    },
    {
      "month": "2024-02",
      "count": 18,
      "avgRating": 4.3
    }
  ],
  "topForms": [
    {
      "id": "form_id",
      "name": "Default Feedback Form",
      "reviewCount": 120
    }
  ]
}
```

---

## Notifications

### POST /api/notifications/send
Send notification email.

**Request:**
```json
{
  "type": "newReview",
  "hotelId": "hotel_id",
  "data": {
    "guestName": "John Smith",
    "rating": 5
  }
}
```

**Response:**
```json
{
  "message": "Notification sent successfully",
  "messageId": "email_message_id"
}
```

---

## Super Admin Endpoints

### PUT /api/super-admin/hotels/[id]/toggle-active
Toggle hotel active status (Super Admin only).

**Request:**
```json
{
  "isActive": true
}
```

**Response:**
```json
{
  "message": "Hotel activated successfully",
  "hotel": {
    "id": "hotel_id",
    "name": "Grand Hotel",
    "isActive": true
  }
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input data |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists |
| 422 | Unprocessable Entity - Validation error |
| 500 | Internal Server Error - Server error |

## Rate Limiting

API endpoints are rate limited to prevent abuse:
- Authentication endpoints: 5 requests per minute
- General endpoints: 100 requests per minute
- Webhook endpoints: 1000 requests per minute

## Webhooks

### Stripe Webhooks
Configure webhook endpoint: `https://your-domain.com/api/webhooks/stripe`

**Required Events:**
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

## SDK Examples

### JavaScript/TypeScript
```typescript
// Submit guest feedback
const response = await fetch('/api/guest-feedback/grand-hotel/submit', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    formId: 'form_id',
    responses: {
      rating: 5,
      comments: 'Great stay!'
    }
  })
});

const data = await response.json();
```

### cURL Examples
```bash
# Get hotel feedback form
curl -X GET "https://your-domain.com/api/guest-feedback/grand-hotel"

# Submit feedback
curl -X POST "https://your-domain.com/api/guest-feedback/grand-hotel/submit" \
  -H "Content-Type: application/json" \
  -d '{
    "formId": "form_id",
    "responses": {
      "rating": 5,
      "comments": "Excellent service!"
    }
  }'

# Generate QR code (authenticated)
curl -X POST "https://your-domain.com/api/qr-codes/generate" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{
    "name": "Front Desk QR",
    "description": "QR code for front desk"
  }'
```

---

## Support

For API support and questions:
- Email: api-support@your-domain.com
- Documentation: https://your-domain.com/docs
- Status Page: https://status.your-domain.com
