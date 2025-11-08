import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log('Authorization failed: Missing credentials')
          throw new Error('Missing email or password')
        }

        console.log('Attempting to authorize user:', credentials.email)

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user || !user.password) {
          console.log('Authorization failed: User not found')
          throw new Error('No user found')
        }

        const isCorrectPassword = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isCorrectPassword) {
          console.log('Authorization failed: Incorrect password')
          throw new Error('Incorrect password')
        }

        console.log('Authorization successful for user:', user.email)
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
      }

      // Refresh role from database on session update
      if (trigger === 'update' || !token.role) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true }
        })
        if (dbUser) {
          token.role = dbUser.role
        }
      }

      return token
    },
    async session({ session, token }) {
      console.log('[SESSION CALLBACK] Token:', { id: token.id, role: token.role })
      if (session.user) {
        session.user.id = token.id as string
        ;(session.user as any).role = token.role
        console.log('[SESSION CALLBACK] Session user:', { id: session.user.id, role: (session.user as any).role, email: session.user.email })
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}
