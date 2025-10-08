import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextauth';
import { jwtVerify } from 'jose';

// JWT Configuration for mobile clients
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || '7b537c24d1f5b2a460c4b3f88ad3e78b2f7462d49a9d9a93c3c86b48a211bc39'
);

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  status: string;
  profileImage?: string;
  profileImagePublicId?: string;
  phone?: string;
  lastLogin?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  hotelId?: string;
  hotelSlug?: string;
  hotelName?: string;
}

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload;
}

/**
 * Middleware to protect API routes
 * Validates NextAuth session (web) or JWT token (mobile)
 */
export async function withAuth(
  req: NextRequest,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    // First try NextAuth session (for web clients)
    const session = await getServerSession(authOptions);

    if (session?.user) {
      const authenticatedReq = req as AuthenticatedRequest;
      authenticatedReq.user = {
        userId: session.user.id,
        email: session.user.email,
        firstName: session.user.firstName,
        lastName: session.user.lastName,
        role: session.user.role,
        status: session.user.status,
        phone: session.user.phone,
        profileImage: session.user.profileImage,
        profileImagePublicId: session.user.profileImagePublicId,
        lastLogin: session.user.lastLogin,
        createdAt: session.user.createdAt,
        updatedAt: session.user.updatedAt,
        hotelId: session.user.hotelId,
        hotelSlug: session.user.hotelSlug,
        hotelName: session.user.hotelName,
      };

      return await handler(authenticatedReq);
    }

    // Try JWT token for mobile clients
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        
        const authenticatedReq = req as AuthenticatedRequest;
        authenticatedReq.user = payload as unknown as JWTPayload;

        return await handler(authenticatedReq);
      } catch (error) {
        // Token is invalid or expired
      }
    }

    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Auth middleware error:', error);
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }
}

/**
 * Middleware to protect admin routes
 * Requires authentication and admin role
 */
export async function withAdminAuth(
  req: NextRequest,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  return withAuth(req, async (authenticatedReq) => {
    const user = authenticatedReq.user;
    
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'You are unauthorized to access this page' },
        { status: 403 }
      );
    }

    return await handler(authenticatedReq);
  });
}

/**
 * Optional auth middleware - doesn't fail if no token, but adds user if present
 */
export async function withOptionalAuth(
  req: NextRequest,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    // Try NextAuth session
    const session = await getServerSession(authOptions);

    if (session?.user) {
      const authenticatedReq = req as AuthenticatedRequest;
      authenticatedReq.user = {
        userId: session.user.id,
        email: session.user.email,
        firstName: session.user.firstName,
        lastName: session.user.lastName,
        role: session.user.role,
        status: session.user.status,
        phone: session.user.phone,
        profileImage: session.user.profileImage,
        profileImagePublicId: session.user.profileImagePublicId,
        lastLogin: session.user.lastLogin,
        createdAt: session.user.createdAt,
        updatedAt: session.user.updatedAt,
        hotelId: session.user.hotelId,
        hotelSlug: session.user.hotelSlug,
        hotelName: session.user.hotelName,
      };
      return await handler(authenticatedReq);
    }

    // Try JWT token for mobile clients
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        
        const authenticatedReq = req as AuthenticatedRequest;
        authenticatedReq.user = payload as unknown as JWTPayload;

        return await handler(authenticatedReq);
      } catch (error) {
        // Ignore auth errors for optional auth
      }
    }
  } catch (error) {
    // Ignore auth errors for optional auth
  }

  return await handler(req as AuthenticatedRequest);
}