const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAdminNotifications() {
  try {
    // Get all admin users
    const adminUsers = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true, email: true }
    });
    
    console.log('Admin users:');
    adminUsers.forEach(admin => console.log(`- ${admin.email} (ID: ${admin.id})`));
    
    // Check notifications for each admin
    for (const admin of adminUsers) {
      const notifications = await prisma.notification.findMany({
        where: { userId: admin.id },
        select: { id: true, title: true, type: true, isRead: true }
      });
      console.log(`\nNotifications for ${admin.email}:`, notifications.length);
      notifications.forEach(notif => console.log(`  - ${notif.title} (${notif.type}) - Read: ${notif.isRead}`));
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminNotifications();


