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
  }),

  // New email templates for additional functionality
  feedbackReceived: (hotelName: string, guestName: string, rating: number) => ({
    subject: `Thank you for your feedback - ${hotelName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 2rem; text-align: center;">
          <h1 style="margin: 0; font-size: 2rem;">Thank You!</h1>
        </div>
        <div style="padding: 2rem; background: white;">
          <h2 style="color: #1F2937;">Dear ${guestName || 'Valued Guest'},</h2>
          <p style="color: #6B7280; line-height: 1.6;">
            Thank you for taking the time to share your feedback about your stay at <strong>${hotelName}</strong>.
          </p>
          ${rating ? `
            <div style="background: #F3F4F6; padding: 1rem; border-radius: 0.5rem; margin: 1rem 0;">
              <p style="color: #1F2937; margin: 0; font-weight: bold;">Your Rating: ${rating}/5 stars</p>
            </div>
          ` : ''}
          <p style="color: #6B7280; line-height: 1.6;">
            Your feedback is invaluable to us and helps us improve our services for future guests.
          </p>
          <p style="color: #6B7280; line-height: 1.6;">
            We hope to welcome you back to ${hotelName} soon!
          </p>
          <p style="color: #6B7280; line-height: 1.6;">
            Best regards,<br>
            The ${hotelName} Team
          </p>
        </div>
      </div>
    `
  }),

  hotelRegistration: (hotelName: string, adminName: string, adminEmail: string) => ({
    subject: `Welcome to Hotel Feedback SaaS - ${hotelName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #3B82F6, #1E40AF); color: white; padding: 2rem; text-align: center;">
          <h1 style="margin: 0; font-size: 2rem;">Welcome to Hotel Feedback SaaS!</h1>
        </div>
        <div style="padding: 2rem; background: white;">
          <h2 style="color: #1F2937;">Hello ${adminName},</h2>
          <p style="color: #6B7280; line-height: 1.6;">
            Welcome to Hotel Feedback SaaS! Your hotel <strong>${hotelName}</strong> has been successfully registered.
          </p>
          <p style="color: #6B7280; line-height: 1.6;">
            Your account details:
          </p>
          <ul style="color: #6B7280; line-height: 1.6;">
            <li><strong>Hotel:</strong> ${hotelName}</li>
            <li><strong>Admin:</strong> ${adminName}</li>
            <li><strong>Email:</strong> ${adminEmail}</li>
          </ul>
          <p style="color: #6B7280; line-height: 1.6;">
            You can now start collecting guest feedback and managing reviews. Here's what you can do:
          </p>
          <ul style="color: #6B7280; line-height: 1.6;">
            <li>Create custom feedback forms</li>
            <li>Generate QR codes for easy guest access</li>
            <li>Manage and respond to guest reviews</li>
            <li>View analytics and insights</li>
            <li>Configure your hotel settings</li>
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

  forgotPassword: (userName: string, resetLink: string) => ({
    subject: 'Password Reset Request - Hotel Feedback SaaS',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #F59E0B, #D97706); color: white; padding: 2rem; text-align: center;">
          <h1 style="margin: 0; font-size: 2rem;">Password Reset</h1>
        </div>
        <div style="padding: 2rem; background: white;">
          <h2 style="color: #1F2937;">Hello ${userName},</h2>
          <p style="color: #6B7280; line-height: 1.6;">
            We received a request to reset your password for your Hotel Feedback SaaS account.
          </p>
          <p style="color: #6B7280; line-height: 1.6;">
            Click the button below to reset your password:
          </p>
          <div style="text-align: center; margin: 2rem 0;">
            <a href="${resetLink}" 
               style="background: #F59E0B; color: white; padding: 1rem 2rem; text-decoration: none; border-radius: 0.5rem; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color: #6B7280; line-height: 1.6;">
            This link will expire in 1 hour for security reasons.
          </p>
          <p style="color: #6B7280; line-height: 1.6;">
            If you didn't request this password reset, please ignore this email.
          </p>
          <p style="color: #6B7280; line-height: 1.6;">
            Best regards,<br>
            The Hotel Feedback SaaS Team
          </p>
        </div>
      </div>
    `
  }),

  contactFormSubmission: (hotelName: string, subject: string, message: string, guestEmail: string) => ({
    subject: `New Contact Form Submission - ${hotelName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #8B5CF6, #7C3AED); color: white; padding: 2rem; text-align: center;">
          <h1 style="margin: 0; font-size: 2rem;">New Contact Form</h1>
        </div>
        <div style="padding: 2rem; background: white;">
          <h2 style="color: #1F2937;">New Contact Form Submission</h2>
          <p style="color: #6B7280; line-height: 1.6;">
            You have received a new contact form submission from a guest at <strong>${hotelName}</strong>.
          </p>
          <div style="background: #F3F4F6; padding: 1rem; border-radius: 0.5rem; margin: 1rem 0;">
            <p style="color: #1F2937; margin: 0; font-weight: bold;">Subject:</p>
            <p style="color: #6B7280; margin: 0.5rem 0 0 0;">${subject}</p>
          </div>
          <div style="background: #F3F4F6; padding: 1rem; border-radius: 0.5rem; margin: 1rem 0;">
            <p style="color: #1F2937; margin: 0; font-weight: bold;">Message:</p>
            <p style="color: #6B7280; margin: 0.5rem 0 0 0; white-space: pre-wrap;">${message}</p>
          </div>
          <div style="background: #F3F4F6; padding: 1rem; border-radius: 0.5rem; margin: 1rem 0;">
            <p style="color: #1F2937; margin: 0; font-weight: bold;">Guest Email:</p>
            <p style="color: #6B7280; margin: 0.5rem 0 0 0;">${guestEmail}</p>
          </div>
          <div style="text-align: center; margin: 2rem 0;">
            <a href="${process.env.APP_URL}/hotel-dashboard/contact" 
               style="background: #8B5CF6; color: white; padding: 1rem 2rem; text-decoration: none; border-radius: 0.5rem; display: inline-block;">
              View Contact Forms
            </a>
          </div>
          <p style="color: #6B7280; line-height: 1.6;">
            Please respond to this inquiry as soon as possible.
          </p>
          <p style="color: #6B7280; line-height: 1.6;">
            Best regards,<br>
            The Hotel Feedback SaaS Team
          </p>
        </div>
      </div>
    `
  }),

  superAdminContactForm: (hotelName: string, subject: string, message: string, guestEmail: string, hotelEmail: string) => ({
    subject: `New Contact Form from ${hotelName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #EF4444, #DC2626); color: white; padding: 2rem; text-align: center;">
          <h1 style="margin: 0; font-size: 2rem;">New Contact Form</h1>
        </div>
        <div style="padding: 2rem; background: white;">
          <h2 style="color: #1F2937;">New Contact Form Submission</h2>
          <p style="color: #6B7280; line-height: 1.6;">
            A guest from <strong>${hotelName}</strong> has submitted a contact form.
          </p>
          <div style="background: #F3F4F6; padding: 1rem; border-radius: 0.5rem; margin: 1rem 0;">
            <p style="color: #1F2937; margin: 0; font-weight: bold;">Hotel:</p>
            <p style="color: #6B7280; margin: 0.5rem 0 0 0;">${hotelName} (${hotelEmail})</p>
          </div>
          <div style="background: #F3F4F6; padding: 1rem; border-radius: 0.5rem; margin: 1rem 0;">
            <p style="color: #1F2937; margin: 0; font-weight: bold;">Subject:</p>
            <p style="color: #6B7280; margin: 0.5rem 0 0 0;">${subject}</p>
          </div>
          <div style="background: #F3F4F6; padding: 1rem; border-radius: 0.5rem; margin: 1rem 0;">
            <p style="color: #1F2937; margin: 0; font-weight: bold;">Message:</p>
            <p style="color: #6B7280; margin: 0.5rem 0 0 0; white-space: pre-wrap;">${message}</p>
          </div>
          <div style="background: #F3F4F6; padding: 1rem; border-radius: 0.5rem; margin: 1rem 0;">
            <p style="color: #1F2937; margin: 0; font-weight: bold;">Guest Email:</p>
            <p style="color: #6B7280; margin: 0.5rem 0 0 0;">${guestEmail}</p>
          </div>
          <div style="text-align: center; margin: 2rem 0;">
            <a href="${process.env.APP_URL}/super-admin/contact-forms" 
               style="background: #EF4444; color: white; padding: 1rem 2rem; text-decoration: none; border-radius: 0.5rem; display: inline-block;">
              View Contact Forms
            </a>
          </div>
          <p style="color: #6B7280; line-height: 1.6;">
            Please review this inquiry and provide appropriate support.
          </p>
          <p style="color: #6B7280; line-height: 1.6;">
            Best regards,<br>
            The Hotel Feedback SaaS System
          </p>
        </div>
      </div>
    `
  })
}
