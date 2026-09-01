import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    teammateId: string | null;
    isCoach: boolean;
    user: DefaultSession["user"] & { id: string };
  }
}
