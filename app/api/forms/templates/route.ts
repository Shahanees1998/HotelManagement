import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const templates = [
      {
        id: 'guest-satisfaction',
        name: 'Guest Satisfaction Survey',
        description: 'Comprehensive guest experience feedback form',
        category: 'General',
        fields: [
          {
            label: 'Overall Rating',
            type: 'RATING',
            required: true,
            order: 1
          },
          {
            label: 'How was your stay?',
            type: 'TEXTAREA',
            required: true,
            placeholder: 'Tell us about your experience...',
            order: 2
          },
          {
            label: 'What did you like most?',
            type: 'TEXT',
            required: false,
            placeholder: 'Your favorite aspects...',
            order: 3
          },
          {
            label: 'What could we improve?',
            type: 'TEXT',
            required: false,
            placeholder: 'Suggestions for improvement...',
            order: 4
          },
          {
            label: 'Would you recommend us?',
            type: 'SINGLE_CHOICE',
            required: true,
            options: ['Yes', 'No', 'Maybe'],
            order: 5
          }
        ]
      },
      {
        id: 'restaurant-feedback',
        name: 'Restaurant Experience',
        description: 'Feedback form for restaurant and dining services',
        category: 'Restaurant',
        fields: [
          {
            label: 'Food Quality Rating',
            type: 'RATING',
            required: true,
            order: 1
          },
          {
            label: 'Service Rating',
            type: 'RATING',
            required: true,
            order: 2
          },
          {
            label: 'Ambiance Rating',
            type: 'RATING',
            required: true,
            order: 3
          },
          {
            label: 'Favorite Dish',
            type: 'TEXT',
            required: false,
            placeholder: 'What was your favorite dish?',
            order: 4
          },
          {
            label: 'Dining Comments',
            type: 'TEXTAREA',
            required: false,
            placeholder: 'Any additional comments about your dining experience?',
            order: 5
          }
        ]
      },
      {
        id: 'room-service',
        name: 'Room Service Feedback',
        description: 'Feedback form for room service and housekeeping',
        category: 'Room Service',
        fields: [
          {
            label: 'Room Cleanliness',
            type: 'RATING',
            required: true,
            order: 1
          },
          {
            label: 'Room Service Speed',
            type: 'RATING',
            required: true,
            order: 2
          },
          {
            label: 'Staff Friendliness',
            type: 'RATING',
            required: true,
            order: 3
          },
          {
            label: 'Room Amenities',
            type: 'MULTIPLE_CHOICE',
            required: false,
            options: ['WiFi', 'TV', 'Air Conditioning', 'Mini Bar', 'Room Service', 'Housekeeping'],
            order: 4
          },
          {
            label: 'Additional Comments',
            type: 'TEXTAREA',
            required: false,
            placeholder: 'Any other feedback about your room?',
            order: 5
          }
        ]
      },
      {
        id: 'spa-wellness',
        name: 'Spa & Wellness',
        description: 'Feedback form for spa and wellness services',
        category: 'Spa',
        fields: [
          {
            label: 'Service Quality',
            type: 'RATING',
            required: true,
            order: 1
          },
          {
            label: 'Therapist Rating',
            type: 'RATING',
            required: true,
            order: 2
          },
          {
            label: 'Facility Cleanliness',
            type: 'RATING',
            required: true,
            order: 3
          },
          {
            label: 'Services Used',
            type: 'MULTIPLE_CHOICE',
            required: false,
            options: ['Massage', 'Facial', 'Manicure', 'Pedicure', 'Sauna', 'Steam Room'],
            order: 4
          },
          {
            label: 'Would you book again?',
            type: 'SINGLE_CHOICE',
            required: true,
            options: ['Yes', 'No', 'Maybe'],
            order: 5
          }
        ]
      },
      {
        id: 'event-feedback',
        name: 'Event Feedback',
        description: 'Feedback form for events and conferences',
        category: 'Events',
        fields: [
          {
            label: 'Event Rating',
            type: 'RATING',
            required: true,
            order: 1
          },
          {
            label: 'Venue Quality',
            type: 'RATING',
            required: true,
            order: 2
          },
          {
            label: 'Catering Quality',
            type: 'RATING',
            required: true,
            order: 3
          },
          {
            label: 'Event Type',
            type: 'SINGLE_CHOICE',
            required: true,
            options: ['Wedding', 'Conference', 'Birthday Party', 'Corporate Event', 'Other'],
            order: 4
          },
          {
            label: 'Event Comments',
            type: 'TEXTAREA',
            required: false,
            placeholder: 'Tell us about your event experience...',
            order: 5
          }
        ]
      }
    ]

    return NextResponse.json({
      templates,
      categories: ['General', 'Restaurant', 'Room Service', 'Spa', 'Events']
    })

  } catch (error) {
    console.error('Error fetching form templates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
