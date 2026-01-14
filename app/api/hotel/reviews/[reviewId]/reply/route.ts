import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import sgMail from '@sendgrid/mail';

// Configure SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'app.thebuilders@gmail.com';
const APP_NAME = 'HOTEL Management';

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { reviewId: string } }
) {
  return withAuth(request, async (authenticatedReq: AuthenticatedRequest) => {
    try {
      const { replyText, emailTitle } = await request.json();
      
      if (!replyText || !replyText.trim()) {
        return NextResponse.json(
          { error: 'Reply text is required' },
          { status: 400 }
        );
      }

      // Get the review and verify it belongs to the hotel
      const review = await prisma.review.findFirst({
        where: {
          id: params.reviewId,
          hotel: {
            ownerId: authenticatedReq.user?.userId
          }
        },
        include: {
          hotel: true,
          form: true
        }
      });

      if (!review) {
        return NextResponse.json(
          { error: 'Review not found or access denied' },
          { status: 404 }
        );
      }

      if (!review.guestEmail || review.guestEmail.trim() === '') {
        return NextResponse.json(
          { error: 'No email available for this review' },
          { status: 400 }
        );
      }

      // Send email reply if SendGrid is configured
      if (SENDGRID_API_KEY) {
        try {
          const emailContent = createReplyEmail(
            replyText,
            emailTitle || undefined
          );

          await sgMail.send({
            to: review.guestEmail,
            from: FROM_EMAIL,
            subject: emailTitle || `Reply from ${review.hotel.name}`,
            html: emailContent,
          });

          console.log(`Reply email sent to ${review.guestEmail} for review ${review.id}`);
          
          // Save the response to the database
          await prisma.reviewResponse.create({
            data: {
              reviewId: review.id,
              replyText: replyText.trim(),
              sentTo: review.guestEmail,
            }
          });
          
          // Update review to mark as replied
          await prisma.review.update({
            where: { id: review.id },
            data: { isReplied: true }
          });
          
          return NextResponse.json({
            message: 'Reply sent successfully',
            sentTo: review.guestEmail
          });
        } catch (emailError) {
          console.error('Failed to send reply email:', emailError);
          return NextResponse.json(
            { error: 'Failed to send reply email. Please try again later.' },
            { status: 500 }
          );
        }
      } else {
        console.log('SendGrid not configured. Reply would be sent to:', review.guestEmail);
        
        // Save the response to the database even if SendGrid is not configured
        await prisma.reviewResponse.create({
          data: {
            reviewId: review.id,
            replyText: replyText.trim(),
            sentTo: review.guestEmail,
          }
        });
        
        // Update review to mark as replied
        await prisma.review.update({
          where: { id: review.id },
          data: { isReplied: true }
        });
        
        return NextResponse.json({
          message: 'Reply would be sent (SendGrid not configured)',
          sentTo: review.guestEmail,
          replyText: replyText
        });
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  });
}

function createReplyEmail(replyText: string, emailTitle?: string): string {
  // Only show what the hotel owner writes - no English boilerplate
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f8f9fa;
            }
            .content {
                background-color: #ffffff;
                padding: 30px;
                border: 1px solid #e9ecef;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .reply-text {
                white-space: pre-wrap;
                font-size: 15px;
                line-height: 1.8;
                color: #333;
            }
        </style>
    </head>
    <body>
        <div class="content">
            <div class="reply-text">${replyText.replace(/\n/g, '<br>')}</div>
        </div>
    </body>
    </html>
  `;
}
