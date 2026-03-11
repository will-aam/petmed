import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Email from "next-auth/providers/nodemailer";
import { prisma } from "@/infrastructure/prisma/client";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Email({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user && user) {
        session.user.id = user.id;
        // Ensure tutor profile exists on first login
        const tutorProfile = await prisma.tutorProfile.findUnique({
          where: { userId: user.id },
        });
        if (!tutorProfile) {
          await prisma.tutorProfile.create({
            data: { userId: user.id },
          });
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
    verifyRequest: "/verify-request",
  },
});
