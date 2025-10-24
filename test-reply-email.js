// Test script to send a dummy reply email
const sgMail = require('@sendgrid/mail');

// Configure SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'app.thebuilders@gmail.com';

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

async function testReplyEmail() {
  const testEmail = 'aneesshah@yopmail.com';
  const replyText = 'Thank you for your valuable feedback! We truly appreciate you taking the time to share your experience with us. Your comments help us improve our services and ensure we provide the best possible experience for all our guests. We look forward to welcoming you back soon!';
  
  const emailContent = createReplyEmail(
    'Test Guest',
    replyText,
    'Test Hotel',
    'Guest Feedback Form'
  );

  try {
    if (SENDGRID_API_KEY) {
      await sgMail.send({
        to: testEmail,
        from: FROM_EMAIL,
        subject: `Reply from Test Hotel - Your Feedback`,
        html: emailContent,
      });

      console.log(`✅ Test reply email sent successfully to ${testEmail}`);
      console.log('📧 Check the email inbox to verify delivery');
    } else {
      console.log('❌ SendGrid API key not configured');
      console.log('📧 Email would be sent to:', testEmail);
      console.log('📝 Reply text:', replyText);
    }
  } catch (error) {
    console.error('❌ Failed to send test email:', error);
  }
}

function createReplyEmail(guestName, replyText, hotelName, formTitle) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reply from ${hotelName}</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }
            .header {
                background-color: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 20px;
            }
            .content {
                background-color: #ffffff;
                padding: 20px;
                border: 1px solid #e9ecef;
                border-radius: 8px;
            }
            .reply-box {
                background-color: #f8f9fa;
                padding: 15px;
                border-left: 4px solid #007bff;
                margin: 20px 0;
                border-radius: 4px;
            }
            .footer {
                margin-top: 20px;
                padding-top: 20px;
                border-top: 1px solid #e9ecef;
                font-size: 14px;
                color: #6c757d;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h2>Thank you for your feedback!</h2>
            <p>Dear ${guestName},</p>
        </div>
        
        <div class="content">
            <p>Thank you for taking the time to share your feedback about your experience at <strong>${hotelName}</strong> regarding "${formTitle}".</p>
            
            <div class="reply-box">
                <h3>Our Response:</h3>
                <p>${replyText.replace(/\n/g, '<br>')}</p>
            </div>
            
            <p>We truly appreciate your feedback and look forward to serving you again in the future.</p>
            
            <p>Best regards,<br>
            <strong>The ${hotelName} Team</strong></p>
        </div>
        
        <div class="footer">
            <p>This is an automated response from ${hotelName}. Please do not reply to this email.</p>
        </div>
    </body>
    </html>
  `;
}

// Run the test
testReplyEmail();
