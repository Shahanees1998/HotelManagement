import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      hotelName,
      hotelSlug,
      description,
      address,
      city,
      country,
      phone,
      website,
      firstName,
      lastName,
      email,
      password,
    } = body;

    // Validate required fields
    if (!hotelName || !hotelSlug || !firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if hotel slug already exists
    const existingHotel = await prisma.hotel.findUnique({
      where: { slug: hotelSlug },
    });

    if (existingHotel) {
      return NextResponse.json(
        { error: 'Hotel URL already exists. Please choose a different one.' },
        { status: 400 }
      );
    }

    // Check if user email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered. Please use a different email.' },
        { status: 400 }
      );
    }

    // Check if hotel already exists for this email
    const existingHotelByEmail = await prisma.hotel.findFirst({
      where: { email },
    });

    if (existingHotelByEmail) {
      return NextResponse.json(
        { error: 'A hotel is already registered with this email address' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user and hotel in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          phone: phone || null,
          role: 'HOTEL',
          status: 'ACTIVE',
        },
      });

      // Create hotel
      const hotel = await tx.hotel.create({
        data: {
          name: hotelName,
          slug: hotelSlug,
          description: description || null,
          address: address || null,
          city: city || null,
          country: country || null,
          phone: phone || null,
          email: email,
          website: website || null,
          ownerId: user.id,
          subscriptionStatus: 'TRIAL',
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
        },
      });

      return { user, hotel };
    });

    // Send notifications to admin users
    try {
      const { sendAdminNotification, NotificationTemplates } = await import('@/lib/notificationService');
      
      await sendAdminNotification(
        NotificationTemplates.hotelRegistered(hotelName, result.hotel.id)
      );
      
      console.log('Admin notification sent successfully');
    } catch (notificationError) {
      console.error('Error sending admin notification:', notificationError);
      // Don't fail the registration if notifications fail
    }

    return NextResponse.json({
      message: 'Hotel registration successful! Please check your email for verification.',
      data: {
        hotelId: result.hotel.id,
        userId: result.user.id,
      },
    });
  } catch (error) {
    console.error('Hotel registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}