import NextAuth from "next-auth";
import Discord from "next-auth/providers/discord";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import { isAdminUser, parseAdminDiscordIds } from "@/lib/admin";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  // Discord now appends `iss=https://discord.com` to its OAuth redirect (RFC 9207). Auth.js
  // checks that against the provider's issuer, which defaults to https://authjs.dev for
  // plain-OAuth providers, so every callback failed with error=Configuration.
  providers: [Discord({ issuer: "https://discord.com" })],
  session: { strategy: "database" },
  callbacks: {
    async session({ session, user }) {
      const [teammate, isAdmin] = await Promise.all([
        db.teammate.findUnique({ where: { userId: user.id } }),
        isAdminUser(user.id, parseAdminDiscordIds(process.env.ADMIN_DISCORD_IDS), db),
      ]);
      session.user.id = user.id;
      session.teammateId = teammate?.id ?? null;
      session.isCoach = teammate?.isCoach ?? false;
      session.isAdmin = isAdmin;
      return session;
    },
  },
});
