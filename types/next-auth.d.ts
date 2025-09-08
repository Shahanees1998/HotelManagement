import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: 'SUPER_ADMIN' | 'HOTEL_ADMIN'
      hotelId?: string
      hotel?: {
        id: string
        name: string
        slug: string
        city: string
        state: string
      }
    }
  }

  interface User {
    id: string
    email: string
    name: string
    role: 'SUPER_ADMIN' | 'HOTEL_ADMIN'
    hotelId?: string
    hotel?: {
      id: string
      name: string
      slug: string
      city: string
      state: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: 'SUPER_ADMIN' | 'HOTEL_ADMIN'
    hotelId?: string
    hotel?: {
      id: string
      name: string
      slug: string
      city: string
      state: string
    }
  }
}
