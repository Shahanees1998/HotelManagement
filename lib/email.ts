import nodemailer from 'nodemailer'

// Create transporter
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail({ to, subject, html, text }: EmailOptions) {
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.APP_NAME || 'Hotel Feedback SaaS'}" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    })

    console.log('Email sent:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Email sending failed:', error)
    return { success: false, error: error.message }
  }
}

// Email templates
export const emailTemplates = {
  welcome: (hotelName: string, adminName: string) => ({
    subject: `Welcome to Hotel Feedback SaaS - ${hotelName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #3B82F6, #1E40AF); color: white; padding: 2rem; text-align: center;">
          <h1 style="margin: 0; font-size: 2rem;">Welcome to Hotel Feedback SaaS!</h1>
        </div>
        <div style="padding: 2rem; background: white;">
          <h2 style="color: #1F2937;">Hello ${adminName},</h2>
          <p style="color: #6B7280; line-height: 1.6;">
            Welcome to Hotel Feedback SaaS! Your account for <strong>${hotelName}</strong> has been successfully created.
          </p>
          <p style="color: #6B7280; line-height: 1.6;">
            You can now start collecting guest feedback and managing reviews. Here's what you can do:
          </p>
          <ul style="color: #6B7280; line-height: 1.6;">
            <li>Create custom feedback forms</li>
            <li>Generate QR codes for easy guest access</li>
            <li>Manage and respond to guest reviews</li>
            <li>View analytics and insights</li>
          </ul>
          <div style="text-align: center; margin: 2rem 0;">
            <a href="${process.env.APP_URL}/hotel-dashboard" 
               style="background: #3B82F6; color: white; padding: 1rem 2rem; text-decoration: none; border-radius: 0.5rem; display: inline-block;">
              Access Your Dashboard
            </a>
          </div>
          <p style="color: #6B7280; line-height: 1.6;">
            If you have any questions, feel free to contact our support team.
          </p>
          <p style="color: #6B7280; line-height: 1.6;">
            Best regards,<br>
            The Hotel Feedback SaaS Team
          </p>
        </div>
      </div>
    `
  }),

  newReview: (hotelName: string, guestName: string, rating: number) => ({
    subject: `New Guest Review - ${hotelName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 2rem; text-align: center;">
          <h1 style="margin: 0; font-size: 2rem;">New Guest Review!</h1>
        </div>
        <div style="padding: 2rem; background: white;">
          <h2 style="color: #1F2937;">You have a new review</h2>
          <p style="color: #6B7280; line-height: 1.6;">
            <strong>${guestName || 'Anonymous Guest'}</strong> has left a review for <strong>${hotelName}</strong>.
          </p>
          <div style="background: #F3F4F6; padding: 1rem; border-radius: 0.5rem; margin: 1rem 0;">
            <p style="margin: 0; color: #374151;">
              <strong>Rating:</strong> ${rating}/5 stars
            </p>
          </div>
          <div style="text-align: center; margin: 2rem 0;">
            <a href="${process.env.APP_URL}/hotel-dashboard/reviews" 
               style="background: #10B981; color: white; padding: 1rem 2rem; text-decoration: none; border-radius: 0.5rem; display: inline-block;">
              View Review
            </a>
          </div>
          <p style="color: #6B7280; line-height: 1.6;">
            Log in to your dashboard to read the full review and respond if needed.
          </p>
        </div>
      </div>
    `
  }),

  subscriptionActivated: (hotelName: string, plan: string) => ({
    subject: `Subscription Activated - ${hotelName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #8B5CF6, #7C3AED); color: white; padding: 2rem; text-align: center;">
          <h1 style="margin: 0; font-size: 2rem;">Subscription Activated!</h1>
        </div>
        <div style="padding: 2rem; background: white;">
          <h2 style="color: #1F2937;">Your subscription is now active</h2>
          <p style="color: #6B7280; line-height: 1.6;">
            Great news! Your <strong>${plan}</strong> subscription for <strong>${hotelName}</strong> has been successfully activated.
          </p>
          <p style="color: #6B7280; line-height: 1.6;">
            You now have access to all the features included in your plan:
          </p>
          <ul style="color: #6B7280; line-height: 1.6;">
            <li>Unlimited QR code generation</li>
            <li>Custom feedback forms</li>
            <li>Review management dashboard</li>
            <li>Analytics and reporting</li>
            <li>Email support</li>
          </ul>
          <div style="text-align: center; margin: 2rem 0;">
            <a href="${process.env.APP_URL}/hotel-dashboard" 
               style="background: #8B5CF6; color: white; padding: 1rem 2rem; text-decoration: none; border-radius: 0.5rem; display: inline-block;">
              Access Your Dashboard
            </a>
          </div>
          <p style="color: #6B7280; line-height: 1.6;">
            Thank you for choosing Hotel Feedback SaaS!
          </p>
        </div>
      </div>
    `
  }),

  subscriptionCancelled: (hotelName: string) => ({
    subject: `Subscription Cancelled - ${hotelName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #EF4444, #DC2626); color: white; padding: 2rem; text-align: center;">
          <h1 style="margin: 0; font-size: 2rem;">Subscription Cancelled</h1>
        </div>
        <div style="padding: 2rem; background: white;">
          <h2 style="color: #1F2937;">Your subscription has been cancelled</h2>
          <p style="color: #6B7280; line-height: 1.6;">
            Your subscription for <strong>${hotelName}</strong> has been cancelled and will end at the conclusion of your current billing period.
          </p>
          <p style="color: #6B7280; line-height: 1.6;">
            You will continue to have access to your account until the end of your current billing period. After that, your account will be downgraded to the free tier.
          </p>
          <div style="text-align: center; margin: 2rem 0;">
            <a href="${process.env.APP_URL}/hotel-dashboard/subscription" 
               style="background: #EF4444; color: white; padding: 1rem 2rem; text-decoration: none; border-radius: 0.5rem; display: inline-block;">
              Manage Subscription
            </a>
          </div>
          <p style="color: #6B7280; line-height: 1.6;">
            If you have any questions or would like to reactivate your subscription, please contact our support team.
          </p>
        </div>
      </div>
    `
  })
}
