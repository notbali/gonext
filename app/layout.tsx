import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { TopNav } from "@/components/TopNav";
import { RouteTransition } from "@/components/RouteTransition";
import { ToastProvider } from "@/components/ToastProvider";
import { AmbientGrain } from "@/components/AmbientGrain";
import { FaviconController } from "@/components/FaviconController";
import { getScheduleData } from "@/lib/schedule-data";
import { getFaviconSignals } from "@/lib/favicon-data";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GO//NEXT — Premier Scheduler",
  description: "Team availability scheduling for VALORANT Premier teams.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [session, team] = await Promise.all([
    auth(),
    db.team.findFirst({ select: { division: true } }),
  ]);

  const today = new Date();
  const schedule = session?.teammateId ? await getScheduleData(today, today, db, 1) : null;
  const faviconSignals = schedule && session?.teammateId
    ? getFaviconSignals(schedule, session.teammateId)
    : null;

  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full`}
    >
      <body className="min-h-full font-sans antialiased">
        <AmbientGrain />
        {faviconSignals && (
          <FaviconController
            hasUnsetDays={faviconSignals.hasUnsetDays}
            nearestMatchDate={faviconSignals.nearestMatchDate}
          />
        )}
        <ToastProvider>
          {team && (
            <TopNav
              teamDivision={team.division}
              isSignedIn={Boolean(session?.user)}
              userName={session?.user?.name}
              userImage={session?.user?.image}
            />
          )}
          <RouteTransition>{children}</RouteTransition>
        </ToastProvider>
      </body>
    </html>
  );
}
