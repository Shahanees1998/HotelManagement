import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if email exists or not for security
      return NextResponse.json({
        message: 'If an account with this email exists and is not verified, a verification email has been sent.',
      });
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json({
        message: 'This email is already verified. You can log in now.',
      });
    }

    // Generate new verification token
    const verificationToken = generateVerificationToken();
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update user with new token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: verificationToken,
        emailVerificationTokenExpiry: verificationTokenExpiry,
      },
    });

    // Send verification email
    try {
      if (SENDGRID_API_KEY) {
        const appBaseUrl = process.env.NEXTAUTH_URL || 'https://primoochat.vercel.app';
        const verificationUrl = `${appBaseUrl}/auth/verify-email?token=${verificationToken}`;
        
        // Get hotel name if exists
        const hotel = await prisma.hotels.findFirst({
          where: { ownerId: user.id },
        });
        
        const emailContent = createVerificationEmail(
          user.firstName,
          verificationUrl,
          user.email,
          hotel?.name || 'your hotel'
        );
        
        await sgMail.send({
          to: user.email,
          from: FROM_EMAIL,
          subject: `Verify your email - ${APP_NAME}`,
          html: emailContent,
        });
        
        console.log(`Verification email resent to ${user.email}`);
      } else {
        console.log('SendGrid not configured. Skipping verification email.');
      }
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      return NextResponse.json(
        { error: 'Failed to send verification email. Please try again later.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Verification email has been sent. Please check your inbox.',
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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
            <h2 style="color: #1e3a5f; margin-top: 0;">Hello, ${firstName}!</h2>
            <p style="color: #333333; font-size: 16px; line-height: 1.6;">
              You requested a new verification email for your hotel <strong>${hotelName}</strong> account.
            </p>
            <p style="color: #333333; font-size: 16px; line-height: 1.6;">
              To verify your email address and activate your account, please click the button below.
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
              This verification link will expire in 24 hours. If you didn't request this email, please ignore it.
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

