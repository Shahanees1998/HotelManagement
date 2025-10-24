# Plan Storage and Form Restrictions Flow

## Overview
This document explains how the system stores and retrieves subscription plan information to control form layout access.

## Database Schema
```prisma
model Hotels {
  // ... other fields
  currentPlan       String? // Current subscription plan: basic, professional, enterprise
  subscriptionStatus SubscriptionStatus @default(TRIAL)
  // ... other fields
}
```

## Plan Storage Flow

### 1. User Purchases Package
When a user purchases a package through the subscription page:

```typescript
// POST /api/hotel/subscription
{
  "planId": "professional", // or "basic", "enterprise"
  "action": "upgrade"
}
```

### 2. API Updates Database
The subscription API updates the hotel record:

```typescript
const updatedHotel = await prisma.hotels.update({
  where: { id: hotel.id },
  data: {
    subscriptionStatus: 'ACTIVE',
    currentPlan: planId, // Stores the purchased plan
    subscriptionEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    subscriptionId: `sub_${Date.now()}`,
  },
});
```

### 3. Plan Information Retrieval
The system retrieves plan information via:

```typescript
// GET /api/hotel/subscription
const hotel = await prisma.hotels.findUnique({
  where: { ownerId: user.userId },
  select: {
    currentPlan: true,
    subscriptionStatus: true,
    // ... other fields
  },
});
```

## Form Layout Restrictions

### Plan-Based Layout Access

| Plan | Available Layouts | Restrictions |
|------|------------------|--------------|
| **Basic** | Basic only | Cannot access Good or Excellent layouts |
| **Professional** | Basic + Good | Cannot access Excellent layout |
| **Enterprise** | All layouts | No restrictions |

### Implementation in FeedbackFormBuilder

```typescript
const getAvailableLayouts = () => {
  switch (currentPlan) {
    case 'basic':
      return [{ label: "Basic", value: "basic" }];
    case 'professional':
      return [
        { label: "Basic", value: "basic" },
        { label: "Good", value: "good" }
      ];
    case 'enterprise':
      return [
        { label: "Basic", value: "basic" },
        { label: "Good", value: "good" },
        { label: "Excellent", value: "excellent" }
      ];
    default:
      return [{ label: "Basic", value: "basic" }];
  }
};
```

## User Experience

### 1. Plan Information Display
- Shows current plan with color-coded status
- Displays upgrade options for restricted features
- Provides direct links to subscription management

### 2. Layout Dropdown Behavior
- **Basic Plan**: Only "Basic" option available
- **Professional Plan**: "Basic" and "Good" options available, "Excellent" disabled with tooltip
- **Enterprise Plan**: All options available

### 3. Tooltips for Disabled Options
- "Upgrade to Professional plan to use this layout" (for Good layout)
- "Upgrade to Enterprise plan to use this layout" (for Excellent layout)

## Testing the Flow

### 1. Test Basic Plan
```bash
# User starts with Basic plan
# Can only access Basic layout
# Other layouts show upgrade tooltips
```

### 2. Test Professional Plan
```bash
# User upgrades to Professional plan
# Can access Basic and Good layouts
# Excellent layout shows upgrade tooltip
```

### 3. Test Enterprise Plan
```bash
# User upgrades to Enterprise plan
# Can access all layouts
# No restrictions
```

## API Endpoints

### Get Current Plan
```http
GET /api/hotel/subscription
```
Returns:
```json
{
  "data": {
    "hotel": {
      "currentPlan": "professional",
      "subscriptionStatus": "ACTIVE"
    }
  }
}
```

### Update Plan
```http
POST /api/hotel/subscription
Content-Type: application/json

{
  "planId": "enterprise",
  "action": "upgrade"
}
```

## Frontend Integration

### useCurrentPlan Hook
```typescript
const { currentPlan, loading, error } = useCurrentPlan();
```

### Component Usage
```typescript
// In FeedbackFormBuilder
const { currentPlan } = useCurrentPlan();
const availableLayouts = getAvailableLayouts();
const isLayoutDisabled = (layout) => !availableLayouts.includes(layout);
```

## Security Considerations

1. **Server-side Validation**: All plan checks are validated on the server
2. **Database Constraints**: Plan information is stored securely in the database
3. **API Protection**: Subscription endpoints are protected with authentication
4. **Client-side UX**: Frontend restrictions are for UX only, not security

## Future Enhancements

1. **Payment Integration**: Connect with Stripe/PayPal for real payments
2. **Plan Expiration**: Handle plan expiration and downgrades
3. **Usage Limits**: Implement usage-based restrictions
4. **Analytics**: Track plan usage and upgrade patterns
