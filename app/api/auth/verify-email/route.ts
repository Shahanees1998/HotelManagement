import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import sgMail from '@sendgrid/mail';

// Configure SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'app.thebuilders@gmail.com';
const APP_NAME = process.env.APP_NAME || 'C-Reviews';

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'missing_token', message: 'Verification token is missing' },
        { status: 400 }
      );
    }

    // Find user with this verification token
    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationTokenExpiry: {
          gt: new Date(), // Token not expired
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'invalid_or_expired_token', message: 'Invalid or expired verification token' },
        { status: 400 }
      );
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json(
        { success: true, message: 'already_verified', messageText: 'Email is already verified' },
        { status: 200 }
      );
    }

    // Verify the email
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        emailVerificationToken: null,
        emailVerificationTokenExpiry: null,
      },
    });

    // Send welcome email after verification
    try {
      if (SENDGRID_API_KEY) {
        const appBaseUrl = process.env.NEXTAUTH_URL || 'https://primoochat.vercel.app';
        const loginUrl = `${appBaseUrl}/auth/login`;
        const emailContent = createWelcomeEmail(user.firstName, loginUrl, user.email);
        
        await sgMail.send({
          to: user.email,
          from: FROM_EMAIL,
          subject: `Welcome to ${APP_NAME} - Your Account is Verified!`,
          html: emailContent,
        });
        
        console.log(`Welcome email sent to ${user.email}`);
      }
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail verification if email fails
    }

    return NextResponse.json(
      { success: true, message: 'email_verified', messageText: 'Email verified successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: 'verification_failed', message: 'Verification failed' },
      { status: 500 }
    );
  }
}

function createWelcomeEmail(firstName: string, loginUrl: string, email: string): string {
  const currentYear = new Date().getFullYear();
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to ${APP_NAME}</title>
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
              Your email has been successfully verified! Your account is now active and ready to use.
            </p>
            <p style="color: #333333; font-size: 16px; line-height: 1.6;">
              You can now log in to your account and start managing your hotel reviews and feedback.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${loginUrl}" 
                 style="display: inline-block; padding: 12px 30px; background-color: #1e3a5f; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Login to Your Account
              </a>
            </div>
            <p style="color: #666666; font-size: 14px; line-height: 1.6;">
              If you have any questions or need assistance, please don't hesitate to contact our support team.
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

