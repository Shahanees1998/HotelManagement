import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AuthService } from '@/lib/auth';
import { canAccessSection, getDefaultRedirectPath, isAdminRole, ROLE_PERMISSIONS, UserRole, type RolePermissions } from '@/lib/rolePermissions';

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
  const host = req.headers.get('host');

  // Allow access to public paths
  if (ignorePaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Check if user is authenticated
  const token = AuthService.getTokenFromRequest(req);  
  // Protect admin and hotel routes (both frontend and API)
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin') || 
      pathname.startsWith('/hotel') || pathname.startsWith('/api/hotel')) {
    if (!token) {
      // For API routes, return 401 instead of redirecting
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status:401}
        );
      }
      
      // For frontend routes, redirect to login
      const loginUrl = new URL('/auth/login', req.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      // Verify the token
      const payload = await AuthService.verifyToken(token);
      
      // Check role-based access
      if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
        // Allow hotel users to access notifications API
        if (pathname.startsWith('/api/admin/notifications') && payload.role === 'HOTEL') {
          // Allow hotel users to access their notifications
        } else if (payload.role !== 'ADMIN') {
          // For API routes, return 403 instead of redirecting
          if (pathname.startsWith('/api/')) {
            return NextResponse.json(
              { error: 'Admin access required' },
              { status: 403}
            );
          }
          
          // For frontend routes, redirect to hotel dashboard
          return NextResponse.redirect(new URL('/hotel/dashboard', req.url));
        }
      }
      
      if (pathname.startsWith('/hotel') || pathname.startsWith('/api/hotel')) {
        if (payload.role !== 'HOTEL') {
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
          if (!canAccessSection(payload.role, 'canAccessAll')) {
            // Redirect to user's allowed section
            const redirectPath = getDefaultRedirectPath(payload.role);
            return NextResponse.redirect(new URL(redirectPath, req.url));
          }
        } else {
          // Check specific sections
          const section = getSectionFromPath(pathname);
          if (section && section in ROLE_PERMISSIONS[payload.role as UserRole]) {
            if (!canAccessSection(payload.role, section as keyof RolePermissions)) {
              // Redirect to user's allowed section
              const redirectPath = getDefaultRedirectPath(payload.role);
              return NextResponse.redirect(new URL(redirectPath, req.url));
            }
          }
        }
      }
    } catch (error) {
      // Token is invalid or expired      
      // Clear invalid tokens
      console.log('>>>>> error')
      const response = pathname.startsWith('/api/')
        ? NextResponse.json(
            { error: 'Invalid or expired token' },
            { status: 401 }
          )
        : NextResponse.redirect(new URL('/auth/login', req.url));
      
      // Clear cookies for both API and frontend responses
      response.cookies.delete('access_token');
      response.cookies.delete('refresh_token');
      
      // For frontend routes, add callback URL
      if (!pathname.startsWith('/api/')) {
        const loginUrl = new URL('/auth/login', req.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
      }
      
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico|auth/login|auth/error|auth/forgotpassword|auth/reset-password).*)',
  ],
};
