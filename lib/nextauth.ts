import { NextAuthOptions, Session, User as NextAuthUser } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import { BcryptService } from '@/lib/bcrypt';

// Extend NextAuth types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      phone?: string;
      role: string;
      status: string;
      profileImage?: string;
      profileImagePublicId?: string;
      lastLogin?: Date;
      isPasswordChanged?: boolean;
      createdAt?: Date;
      updatedAt?: Date;
      hotelId?: string;
      hotelSlug?: string;
      hotelName?: string;
    };
  }

  interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role: string;
    status: string;
    profileImage?: string;
    profileImagePublicId?: string;
    lastLogin?: Date;
    isPasswordChanged?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
    hotelId?: string;
    hotelSlug?: string;
    hotelName?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role: string;
    status: string;
    profileImage?: string;
    profileImagePublicId?: string;
    lastLogin?: Date;
    isPasswordChanged?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
    hotelId?: string;
    hotelSlug?: string;
    hotelName?: string;
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials): Promise<any> {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        // Find user with hotel information
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
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
          throw new Error('Invalid email or password');
        }

        // Check if user is deleted
        if (user.isDeleted) {
          throw new Error('Account has been deleted. Please contact admin.');
        }

        // Check user status
        if (user.status === 'DEACTIVATED') {
          throw new Error('Account has been deactivated. Please contact admin.');
        }

        if (user.status !== 'ACTIVE') {
          throw new Error('Account is not active. Please contact admin.');
        }

        // Check if user has a password (for credential-based auth)
        if (!user.password) {
          throw new Error('Invalid authentication method');
        }

        // Verify password
        const isValidPassword = await BcryptService.comparePassword(
          credentials.password,
          user.password
        );

        if (!isValidPassword) {
          throw new Error('Invalid email or password');
        }

        // Check if user has valid role
        if (user.role !== 'ADMIN' && user.role !== 'HOTEL') {
          throw new Error('Invalid credentials or unauthorized access');
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() },
        });

        // Return user object that will be stored in the session
        return {
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
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
    signOut: '/auth/login',
  },
  callbacks: {
    async jwt({ token, user, trigger, session }): Promise<JWT> {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.phone = user.phone;
        token.role = user.role;
        token.status = user.status;
        token.profileImage = user.profileImage;
        token.profileImagePublicId = user.profileImagePublicId;
        token.lastLogin = user.lastLogin;
        token.isPasswordChanged = user.isPasswordChanged;
        token.createdAt = user.createdAt;
        token.updatedAt = user.updatedAt;
        token.hotelId = user.hotelId;
        token.hotelSlug = user.hotelSlug;
        token.hotelName = user.hotelName;
      }

      // Handle session update
      if (trigger === 'update' && session) {
        // Update token with new session data
        token = { ...token, ...session.user };
      }

      return token;
    },
    async session({ session, token }): Promise<Session> {
      // Add token data to session
      if (token && session.user) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.firstName = token.firstName;
        session.user.lastName = token.lastName;
        session.user.phone = token.phone;
        session.user.role = token.role;
        session.user.status = token.status;
        session.user.profileImage = token.profileImage;
        session.user.profileImagePublicId = token.profileImagePublicId;
        session.user.lastLogin = token.lastLogin;
        session.user.isPasswordChanged = token.isPasswordChanged;
        session.user.createdAt = token.createdAt;
        session.user.updatedAt = token.updatedAt;
        session.user.hotelId = token.hotelId;
        session.user.hotelSlug = token.hotelSlug;
        session.user.hotelName = token.hotelName;
      }

      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};
