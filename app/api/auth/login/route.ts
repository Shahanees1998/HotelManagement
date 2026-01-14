import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BcryptService } from '@/lib/bcrypt';
import { SignJWT } from 'jose';

// JWT Configuration for mobile clients
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || '7b537c24d1f5b2a460c4b3f88ad3e78b2f7462d49a9d9a93c3c86b48a211bc39'
);

const ACCESS_TOKEN_EXPIRY = '30d'; // 30 days

/**
 * POST /api/auth/login
 * Handle login for both web (NextAuth) and mobile (JWT) clients
 * This route provides compatibility for mobile apps that need JWT tokens
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user with hotel information
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        hotel: {
          select: {
            id: true,
            slug: true,
            name: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    if (user.isDeleted) {
      return NextResponse.json(
        { error: 'Account has been deleted. Please contact admin.' },
        { status: 403 }
      );
    }

    if (user.status === 'DEACTIVATED') {
      return NextResponse.json(
        { error: 'Account has been deactivated. Please contact admin.' },
        { status: 403 }
      );
    }

    if (user.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Account is not active. Please contact admin.' },
        { status: 403 }
      );
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return NextResponse.json(
        { 
          error: 'Please verify your email address before logging in. Check your inbox for the verification email.',
          requiresVerification: true,
          email: user.email,
        },
        { status: 403 }
      );
    }

    // Check if user has valid role
    if (user.role !== 'ADMIN' && user.role !== 'HOTEL') {
      return NextResponse.json(
        { error: 'Invalid credentials or unauthorized access' },
        { status: 403 }
      );
    }

    // Verify password
    if (!user.password) {
      return NextResponse.json(
        { error: 'Invalid authentication method' },
        { status: 401 }
      );
    }

    const isValidPassword = await BcryptService.comparePassword(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Generate JWT token for mobile apps
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      status: user.status,
      profileImage: user.profileImage || undefined,
      profileImagePublicId: user.profileImagePublicId || undefined,
      phone: user.phone || undefined,
      lastLogin: new Date(),
      createdAt: user.createdAt || undefined,
      updatedAt: user.updatedAt || undefined,
      hotelId: user.hotel?.id || undefined,
      hotelSlug: user.hotel?.slug || undefined,
      hotelName: user.hotel?.name || undefined,
    };

    const accessToken = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(ACCESS_TOKEN_EXPIRY)
      .sign(JWT_SECRET);

    // Return response
    return NextResponse.json({
      success: true,
      message: 'Login successful',
      accessToken, // For mobile apps
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        status: user.status,
        profileImage: user.profileImage,
        profileImagePublicId: user.profileImagePublicId,
        lastLogin: new Date(),
        isPasswordChanged: user.isPasswordChanged,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        hotelId: user.hotel?.id,
        hotelSlug: user.hotel?.slug,
        hotelName: user.hotel?.name,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 