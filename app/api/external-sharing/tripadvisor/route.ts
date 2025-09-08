import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { hotelSlug, reviewId } = await request.json()

    if (!hotelSlug || !reviewId) {
      return NextResponse.json(
        { error: 'Hotel slug and review ID are required' },
        { status: 400 }
      )
    }

    // Get hotel information
    const hotel = await prisma.hotel.findUnique({
      where: { slug: hotelSlug },
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        state: true,
        country: true
      }
    })

    if (!hotel) {
      return NextResponse.json(
        { error: 'Hotel not found' },
        { status: 404 }
      )
    }

    // Get review information
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: {
        id: true,
        overallRating: true,
        responses: true,
        guestName: true
      }
    })

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      )
    }

    // Generate TripAdvisor search URL
    const searchQuery = `${hotel.name} ${hotel.city} ${hotel.state} ${hotel.country}`
    const tripAdvisorSearchUrl = `https://www.tripadvisor.com/Search?q=${encodeURIComponent(searchQuery)}`

    // Generate TripAdvisor review URL (generic)
    const tripAdvisorReviewUrl = `https://www.tripadvisor.com/UserReview`

    // Update review to mark as shared on TripAdvisor
    await prisma.review.update({
      where: { id: reviewId },
      data: {
        sharedOnTripAdvisor: true,
        externalUrls: {
          tripAdvisor: tripAdvisorSearchUrl,
          tripAdvisorReview: tripAdvisorReviewUrl
        }
      }
    })

    return NextResponse.json({
      message: 'TripAdvisor sharing URLs generated successfully',
      urls: {
        tripAdvisorSearch: tripAdvisorSearchUrl,
        tripAdvisorReview: tripAdvisorReviewUrl
      },
      hotel: {
        name: hotel.name,
        location: `${hotel.city}, ${hotel.state}, ${hotel.country}`
      },
      review: {
        rating: review.overallRating,
        guestName: review.guestName
      }
    })

  } catch (error) {
    console.error('Error generating TripAdvisor sharing URLs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
