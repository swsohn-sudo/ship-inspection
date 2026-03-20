import { type NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/',
  },
  callbacks: {
    async signIn({ user }) {
      // @ekmtc.com 이메일만 로그인 허용
      const email = user.email ?? '';
      if (!email.endsWith('@ekmtc.com')) {
        return false; // 로그인 차단
      }
      return true;
    },
    async session({ session }) {
      return session;
    },
  },
};