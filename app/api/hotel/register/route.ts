import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import sgMail from '@sendgrid/mail';
import crypto from 'crypto';

// Configure SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'app.thebuilders@gmail.com';
const APP_NAME = process.env.APP_NAME || 'C-Reviews';

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

// Generate verification token
function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

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
    const existingHotel = await prisma.hotels.findUnique({
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
    const existingHotelByEmail = await prisma.hotels.findFirst({
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

    // Generate verification token
    const verificationToken = generateVerificationToken();
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user and hotel in a transaction
    // Increased timeout to 15 seconds to handle slower database operations
    const result = await prisma.$transaction(
      async (tx) => {
        // Create user with verification token
        const user = await tx.user.create({
          data: {
            email,
            password: hashedPassword,
            firstName,
            lastName,
            phone: phone || null,
            role: 'HOTEL',
            status: 'ACTIVE',
            emailVerified: null, // Not verified yet
            emailVerificationToken: verificationToken,
            emailVerificationTokenExpiry: verificationTokenExpiry,
          },
        });

        // Create hotel
        const hotel = await tx.hotels.create({
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
      },
      {
        maxWait: 10000, // Maximum time to wait to acquire a transaction (10 seconds)
        timeout: 15000, // Maximum time the transaction can run (15 seconds)
      }
    );

    // Send notifications to admin users
    try {
      const { NotificationCreators } = await import('@/lib/notificationService');
      
      await NotificationCreators.newHotelRegistered(result.hotel.id, hotelName);
      
      console.log('Admin notification sent successfully');
    } catch (notificationError) {
      console.error('Error sending admin notification:', notificationError);
      // Don't fail the registration if notifications fail
    }

    // Send verification email to the new user
    try {
      if (SENDGRID_API_KEY) {
        const appBaseUrl = process.env.NEXTAUTH_URL || 'https://primoochat.vercel.app';
        const verificationUrl = `${appBaseUrl}/auth/verify-email?token=${verificationToken}`;
        const emailContent = createVerificationEmail(result.user.firstName, verificationUrl, email, hotelName);
        
        await sgMail.send({
          to: email,
          from: FROM_EMAIL,
          subject: `Verify your email - ${APP_NAME}`,
          html: emailContent,
        });
        
        console.log(`Verification email sent to ${email}`);
      } else {
        console.log('SendGrid not configured. Skipping verification email.');
      }
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail registration if email fails
    }

    return NextResponse.json({
      message: 'Hotel registration successful! Please check your email to verify your account before logging in.',
      data: {
        hotelId: result.hotel.id,
        userId: result.user.id,
        emailVerified: false,
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

function createVerificationEmail(firstName: string, verificationUrl: string, email: string, hotelName: string): string {
  const currentYear = new Date().getFullYear();
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify your email - ${APP_NAME}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 20px 0; text-align: center; background-color: #1e3a5f;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">${APP_NAME}</h1>
          </td>
        </tr>
        <tr>
          <td style="padding: 40px 20px; background-color: #ffffff;">
            <h2 style="color: #1e3a5f; margin-top: 0;">Welcome, ${firstName}!</h2>
            <p style="color: #333333; font-size: 16px; line-height: 1.6;">
              Thank you for registering your hotel <strong>${hotelName}</strong> with ${APP_NAME}!
            </p>
            <p style="color: #333333; font-size: 16px; line-height: 1.6;">
              To complete your registration and activate your account, please verify your email address by clicking the button below.
            </p>
            <p style="color: #333333; font-size: 16px; line-height: 1.6;">
              <strong>Your account details:</strong><br>
              Email: ${email}<br>
              Hotel: ${hotelName}
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="display: inline-block; padding: 12px 30px; background-color: #1e3a5f; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Verify Email Address
              </a>
            </div>
            <p style="color: #666666; font-size: 14px; line-height: 1.6;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${verificationUrl}" style="color: #1e3a5f; word-break: break-all;">${verificationUrl}</a>
            </p>
            <p style="color: #ff6600; font-size: 14px; line-height: 1.6; font-weight: bold;">
              ⚠️ Important: You must verify your email before you can log in to your account.
            </p>
            <p style="color: #666666; font-size: 14px; line-height: 1.6;">
              This verification link will expire in 24 hours. If you didn't create an account, please ignore this email.
            </p>
            <p style="color: #666666; font-size: 14px; line-height: 1.6;">
              Best regards,<br>
              The ${APP_NAME} Team
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding: 20px; text-align: center; background-color: #f4f4f4; color: #666666; font-size: 12px;">
            <p style="margin: 0;">
              © ${currentYear} ${APP_NAME}. All rights reserved.
            </p>
            <p style="margin: 5px 0 0 0;">
              This is an automated email. Please do not reply to this message.
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}