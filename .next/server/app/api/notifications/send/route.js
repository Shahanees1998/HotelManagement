"use strict";(()=>{var e={};e.id=5285,e.ids=[5285,7862],e.modules={399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},6936:(e,t,r)=>{r.r(t),r.d(t,{originalPathname:()=>f,patchFetch:()=>v,requestAsyncStorage:()=>p,routeModule:()=>m,serverHooks:()=>g,staticGenerationAsyncStorage:()=>h});var o={};r.r(o),r.d(o,{POST:()=>u});var n=r(3277),i=r(5265),a=r(5356),s=r(7076),l=r(7862);(function(){var e=Error("Cannot find module 'next-auth'");throw e.code="MODULE_NOT_FOUND",e})(),function(){var e=Error("Cannot find module '@prisma/client'");throw e.code="MODULE_NOT_FOUND",e}(),function(){var e=Error("Cannot find module 'zod'");throw e.code="MODULE_NOT_FOUND",e}();let d=Object(function(){var e=Error("Cannot find module '@prisma/client'");throw e.code="MODULE_NOT_FOUND",e}())(),c=Object(function(){var e=Error("Cannot find module 'zod'");throw e.code="MODULE_NOT_FOUND",e}()).object({type:Object(function(){var e=Error("Cannot find module 'zod'");throw e.code="MODULE_NOT_FOUND",e}()).enum(["welcome","newReview","subscriptionActivated","subscriptionCancelled"]),hotelId:Object(function(){var e=Error("Cannot find module 'zod'");throw e.code="MODULE_NOT_FOUND",e}()).string(),data:Object(function(){var e=Error("Cannot find module 'zod'");throw e.code="MODULE_NOT_FOUND",e}()).record(Object(function(){var e=Error("Cannot find module 'zod'");throw e.code="MODULE_NOT_FOUND",e}()).any())});async function u(e){try{let t;let r=await Object(function(){var e=Error("Cannot find module 'next-auth'");throw e.code="MODULE_NOT_FOUND",e}())();if(!r||!["SUPER_ADMIN","HOTEL_ADMIN"].includes(r.user?.role))return s.NextResponse.json({error:"Unauthorized"},{status:401});let o=await e.json(),n=c.parse(o),i=await d.hotel.findUnique({where:{id:n.hotelId},include:{users:{where:{role:"HOTEL_ADMIN"},select:{firstName:!0,lastName:!0,email:!0}}}});if(!i)return s.NextResponse.json({error:"Hotel not found"},{status:404});let a=i.users[0];if(!a)return s.NextResponse.json({error:"No admin found for hotel"},{status:404});switch(n.type){case"welcome":t=l.emailTemplates.welcome(i.name,`${a.firstName} ${a.lastName}`);break;case"newReview":t=l.emailTemplates.newReview(i.name,n.data.guestName,n.data.rating);break;case"subscriptionActivated":t=l.emailTemplates.subscriptionActivated(i.name,n.data.plan);break;case"subscriptionCancelled":t=l.emailTemplates.subscriptionCancelled(i.name);break;default:return s.NextResponse.json({error:"Invalid notification type"},{status:400})}let u=await (0,l.sendEmail)({to:a.email,subject:t.subject,html:t.html});if(u.success)return await d.notification.create({data:{userId:r.user.id,title:t.subject,message:`Email sent to ${a.email}`,type:"info",data:{emailSent:!0,messageId:u.messageId,notificationType:n.type}}}),s.NextResponse.json({message:"Notification sent successfully",messageId:u.messageId});return s.NextResponse.json({error:"Failed to send email",details:u.error},{status:500})}catch(e){if(console.error("Error sending notification:",e),e instanceof Object(function(){var e=Error("Cannot find module 'zod'");throw e.code="MODULE_NOT_FOUND",e}()).ZodError)return s.NextResponse.json({error:"Validation error",details:e.errors},{status:400});return s.NextResponse.json({error:"Internal server error"},{status:500})}}let m=new n.AppRouteRouteModule({definition:{kind:i.x.APP_ROUTE,page:"/api/notifications/send/route",pathname:"/api/notifications/send",filename:"route",bundlePath:"app/api/notifications/send/route"},resolvedPagePath:"/Users/mac/Documents/primochatadmin/hotel-feedback-saas/app/api/notifications/send/route.ts",nextConfigOutput:"",userland:o}),{requestAsyncStorage:p,staticGenerationAsyncStorage:h,serverHooks:g}=m,f="/api/notifications/send/route";function v(){return(0,a.patchFetch)({serverHooks:g,staticGenerationAsyncStorage:h})}},7862:(e,t,r)=>{r.d(t,{emailTemplates:()=>i,sendEmail:()=>n}),function(){var e=Error("Cannot find module 'nodemailer'");throw e.code="MODULE_NOT_FOUND",e}();let o=Object(function(){var e=Error("Cannot find module 'nodemailer'");throw e.code="MODULE_NOT_FOUND",e}())({host:process.env.SMTP_HOST,port:parseInt(process.env.SMTP_PORT||"587"),secure:!1,auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASS}});async function n({to:e,subject:t,html:r,text:n}){try{let i=await o.sendMail({from:`"${process.env.APP_NAME||"Hotel Feedback SaaS"}" <${process.env.SMTP_USER}>`,to:e,subject:t,html:r,text:n||r.replace(/<[^>]*>/g,"")});return console.log("Email sent:",i.messageId),{success:!0,messageId:i.messageId}}catch(e){return console.error("Email sending failed:",e),{success:!1,error:e.message}}}let i={welcome:(e,t)=>({subject:`Welcome to Hotel Feedback SaaS - ${e}`,html:`
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #3B82F6, #1E40AF); color: white; padding: 2rem; text-align: center;">
          <h1 style="margin: 0; font-size: 2rem;">Welcome to Hotel Feedback SaaS!</h1>
        </div>
        <div style="padding: 2rem; background: white;">
          <h2 style="color: #1F2937;">Hello ${t},</h2>
          <p style="color: #6B7280; line-height: 1.6;">
            Welcome to Hotel Feedback SaaS! Your account for <strong>${e}</strong> has been successfully created.
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
    `}),newReview:(e,t,r)=>({subject:`New Guest Review - ${e}`,html:`
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 2rem; text-align: center;">
          <h1 style="margin: 0; font-size: 2rem;">New Guest Review!</h1>
        </div>
        <div style="padding: 2rem; background: white;">
          <h2 style="color: #1F2937;">You have a new review</h2>
          <p style="color: #6B7280; line-height: 1.6;">
            <strong>${t||"Anonymous Guest"}</strong> has left a review for <strong>${e}</strong>.
          </p>
          <div style="background: #F3F4F6; padding: 1rem; border-radius: 0.5rem; margin: 1rem 0;">
            <p style="margin: 0; color: #374151;">
              <strong>Rating:</strong> ${r}/5 stars
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
    `}),subscriptionActivated:(e,t)=>({subject:`Subscription Activated - ${e}`,html:`
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #8B5CF6, #7C3AED); color: white; padding: 2rem; text-align: center;">
          <h1 style="margin: 0; font-size: 2rem;">Subscription Activated!</h1>
        </div>
        <div style="padding: 2rem; background: white;">
          <h2 style="color: #1F2937;">Your subscription is now active</h2>
          <p style="color: #6B7280; line-height: 1.6;">
            Great news! Your <strong>${t}</strong> subscription for <strong>${e}</strong> has been successfully activated.
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
    `}),subscriptionCancelled:e=>({subject:`Subscription Cancelled - ${e}`,html:`
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #EF4444, #DC2626); color: white; padding: 2rem; text-align: center;">
          <h1 style="margin: 0; font-size: 2rem;">Subscription Cancelled</h1>
        </div>
        <div style="padding: 2rem; background: white;">
          <h2 style="color: #1F2937;">Your subscription has been cancelled</h2>
          <p style="color: #6B7280; line-height: 1.6;">
            Your subscription for <strong>${e}</strong> has been cancelled and will end at the conclusion of your current billing period.
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
    `})}}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),o=t.X(0,[916,3786],()=>r(6936));module.exports=o})();