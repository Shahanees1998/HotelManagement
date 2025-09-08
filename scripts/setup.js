#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const readline = require('readline')

const prisma = new PrismaClient()

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query) {
  return new Promise(resolve => rl.question(query, resolve))
}

async function createSuperAdmin() {
  console.log('\n🏨 Hotel Feedback SaaS - Super Admin Setup\n')
  
  try {
    // Check if super admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' }
    })
    
    if (existingAdmin) {
      console.log('✅ Super admin already exists!')
      console.log(`Email: ${existingAdmin.email}`)
      rl.close()
      return
    }
    
    // Get super admin details
    const firstName = await question('Enter first name: ')
    const lastName = await question('Enter last name: ')
    const email = await question('Enter email: ')
    const password = await question('Enter password: ')
    
    if (!firstName || !lastName || !email || !password) {
      console.log('❌ All fields are required!')
      rl.close()
      return
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)
    
    // Create super admin user
    const superAdmin = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role: 'SUPER_ADMIN'
      }
    })
    
    console.log('\n✅ Super admin created successfully!')
    console.log(`Name: ${firstName} ${lastName}`)
    console.log(`Email: ${email}`)
    console.log('\nYou can now login to the super admin panel at: /super-admin')
    
  } catch (error) {
    console.error('❌ Error creating super admin:', error.message)
  } finally {
    rl.close()
    await prisma.$disconnect()
  }
}

// Run the setup
createSuperAdmin()
