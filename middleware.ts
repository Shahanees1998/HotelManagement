import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { canAccessSection, getDefaultRedirectPath, ROLE_PERMISSIONS, UserRole, type RolePermissions } from '@/lib/rolePermissions';

/** True if the role has full admin access (allowed to hit /admin routes). */
function isAdminAccess(role: string | null): boolean {
  return role != null && canAccessSection(role, 'canAccessAll');
}
import { jwtVerify } from 'jose';

// JWT Configuration for mobile clients
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || '7b537c24d1f5b2a460c4b3f88ad3e78b2f7462d49a9d9a93c3c86b48a211bc39'
);

const ignorePaths: string[] = [
  '/api/auth',
  '/auth',
  '/_next',
  '/favicon.ico',
  '/api/webhook',
  '/api/public',
  '/public',
  '/register-hotel',
  '/feedback',
  '/api/hotel/register',
  '/api/hotel/validate-slug',
];

function getSectionFromPath(pathname: string): string | null {
  // Extract section from admin paths like /admin/festive-board, /admin/trestle-board, etc.
  const adminMatch = pathname.match(/^\/admin\/([^\/]+)/);
  if (adminMatch) {
    const section = adminMatch[1];
    // Map path sections to permission keys
    const sectionMap: Record<string, string> = {
      'festive-board': 'canAccessFestiveBoard',
      'trestle-board': 'canAccessTrestleBoard',
      'documents': 'canAccessDocuments',
      'users': 'canAccessUsers',
      'settings': 'canAccessSettings',
      'support': 'canAccessSupport',
      'lcm-test': 'canAccessLCMTest',
    };
    return sectionMap[section] || null;
  }
  
  // Check for nested paths like /admin/communications/announcements
  const nestedMatch = pathname.match(/^\/admin\/communications\/([^\/]+)/);
  if (nestedMatch) {
    const section = nestedMatch[1];
    const nestedSectionMap: Record<string, string> = {
      'announcements': 'canAccessAnnouncements',
    };
    return nestedSectionMap[section] || null;
  }
  
  return null;
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Allow access to public paths
  if (ignorePaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Protect admin and hotel routes (both frontend and API)
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin') || 
      pathname.startsWith('/hotel') || pathname.startsWith('/api/hotel')) {
    
    // Check for NextAuth session (web clients)
    let token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    let userRole: string | null = token?.role as string || null;
    let userId: string | null = token?.id as string || null;

    // If no NextAuth token, try JWT for mobile clients
    if (!token) {
      const authHeader = req.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const jwtToken = authHeader.substring(7);
        try {
          const { payload } = await jwtVerify(jwtToken, JWT_SECRET);
          userRole = payload.role as string;
          userId = payload.userId as string;
        } catch (error) {
          // JWT token invalid
        }
      }
    }

    // No valid authentication found
    if (!userId || !userRole) {
      // For API routes, return 401 instead of redirecting
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
      
      // For frontend routes, redirect to login
      const loginUrl = new URL('/auth/login', req.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      // Check role-based access
      if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
        // Allow hotel users to access notifications API
        if (pathname.startsWith('/api/admin/notifications') && userRole === 'HOTEL') {
          // Allow hotel users to access their notifications
        } else if (!isAdminAccess(userRole)) {
          // For API routes, return 403
          if (pathname.startsWith('/api/')) {
            return NextResponse.json(
              { error: 'Admin access required' },
              { status: 403 }
            );
          }
          
          // For frontend routes, redirect to hotel dashboard
          return NextResponse.redirect(new URL('/hotel/dashboard', req.url));
        }
      }
      
      if (pathname.startsWith('/hotel') || pathname.startsWith('/api/hotel')) {
        if (userRole !== 'HOTEL') {
          // For API routes, return 403 instead of redirecting
          if (pathname.startsWith('/api/')) {
            return NextResponse.json(
              { error: 'Hotel access required' },
              { status: 403}
            );
          }
          
          // For frontend routes, redirect to admin dashboard
          return NextResponse.redirect(new URL('/admin', req.url));
        }
      }

      // Check role-based access for specific sections
      if (!pathname.startsWith('/api/')) {
        // Check if accessing main dashboard
        if (pathname === '/admin') {
          if (!canAccessSection(userRole, 'canAccessAll')) {
            // Redirect to user's allowed section
            const redirectPath = getDefaultRedirectPath(userRole);
            return NextResponse.redirect(new URL(redirectPath, req.url));
          }
        } else {
          // Check specific sections
          const section = getSectionFromPath(pathname);
          if (section && section in ROLE_PERMISSIONS[userRole as UserRole]) {
            if (!canAccessSection(userRole, section as keyof RolePermissions)) {
              // Redirect to user's allowed section
              const redirectPath = getDefaultRedirectPath(userRole);
              return NextResponse.redirect(new URL(redirectPath, req.url));
            }
          }
        }
      }
    } catch (error) {
      console.error('Middleware error:', error);
      
      // For API routes, return 401
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Invalid or expired token' },
          { status: 401 }
        );
      }
      
      // For frontend routes, redirect to login
      const loginUrl = new URL('/auth/login', req.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico|auth/login|auth/error|auth/forgotpassword|auth/reset-password).*)',
  ],
};
