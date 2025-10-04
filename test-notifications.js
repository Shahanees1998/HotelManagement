const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testNotifications() {
  try {
    console.log('Testing notifications system...');
    
    // Check if there are any users
    const users = await prisma.user.findMany({
      select: { id: true, email: true, role: true }
    });
    console.log('Users in database:', users.length);
    users.forEach(user => console.log(`- ${user.email} (${user.role}) - ID: ${user.id}`));
    
    // Check if there are any notifications
    const notifications = await prisma.notification.findMany({
      include: {
        user: {
          select: { email: true, role: true }
        }
      }
    });
    console.log('\nNotifications in database:', notifications.length);
    notifications.forEach(notif => {
      console.log(`- ${notif.title} (${notif.type}) - User: ${notif.user.email} - Read: ${notif.isRead}`);
    });
    
    // Create a test notification if we have users
    if (users.length > 0) {
      const adminUser = users.find(u => u.role === 'ADMIN');
      if (adminUser) {
        console.log('\nCreating test notification for admin user...');
        const testNotification = await prisma.notification.create({
          data: {
            userId: adminUser.id,
            title: 'Test Notification',
            message: 'This is a test notification to verify the system works.',
            type: 'SYSTEM_ALERT',
            relatedId: 'test-123',
            relatedType: 'test',
          }
        });
        console.log('Test notification created:', testNotification.id);
      } else {
        console.log('No admin user found to create test notification');
      }
    }
    
  } catch (error) {
    console.error('Error testing notifications:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testNotifications();


