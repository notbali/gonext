import NextAuth from "next-auth";
import Discord from "next-auth/providers/discord";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  providers: [Discord],
  session: { strategy: "database" },
  callbacks: {
    async session({ session, user }) {
      const teammate = await db.teammate.findUnique({ where: { userId: user.id } });
      session.user.id = user.id;
      session.teammateId = teammate?.id ?? null;
      session.isCoach = teammate?.isCoach ?? false;
      return session;
    },
  },
});
