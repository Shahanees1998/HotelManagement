import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/auth/logout
 * Handle logout - clears any legacy cookies
 * NextAuth logout is handled by NextAuth's signOut function
 */
export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'Logout successful',
    });

    // Clear any legacy authentication cookies
    response.cookies.delete('access_token');
    response.cookies.delete('refresh_token');

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 