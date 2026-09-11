"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Avatar } from "@/components/Avatar";
import { AvailabilityRing } from "@/components/AvailabilityRing";
import { ActionForm } from "@/components/ActionForm";
import { chip } from "@/lib/motion";

export type RosterTeammate = {
  id: string;
  name: string;
  image: string | null;
  isCoach: boolean;
  completeness: number;
};

export function RosterList({
  teammates,
  viewerIsCoach,
  promoteTeammate,
  deactivateTeammate,
}: {
  teammates: RosterTeammate[];
  viewerIsCoach: boolean;
  promoteTeammate: (teammateId: string) => Promise<void>;
  deactivateTeammate: (teammateId: string) => Promise<void>;
}) {
  return (
    <div className="mt-6 flex flex-col gap-2">
      <AnimatePresence>
        {teammates.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={chip.hidden}
            animate={chip.visible}
            exit={chip.exit}
            className="flex items-center justify-between rounded-lg border border-border bg-surface p-4"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar name={t.name} src={t.image} size={32} />
                <div className="absolute -inset-1">
                  <AvailabilityRing percent={t.completeness} size={40} />
                </div>
              </div>
              <p className="flex items-center gap-2 text-body-lg font-medium text-text-primary">
                {t.name}
                {t.isCoach && (
                  <span className="rounded-full bg-brand-dim px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-brand-bright">
                    Coach
                  </span>
                )}
              </p>
            </div>
            {viewerIsCoach && !t.isCoach && (
              <div className="flex items-center gap-4">
                <ActionForm
                  action={() => promoteTeammate(t.id)}
                  successMessage={`${t.name} is now a Coach.`}
                  className="font-mono text-[11px] font-semibold uppercase tracking-wide text-primary transition-colors duration-[var(--d-micro)] hover:text-primary-bright disabled:opacity-60"
                >
                  Make Coach
                </ActionForm>
                <ActionForm
                  action={() => deactivateTeammate(t.id)}
                  successMessage={`${t.name} was removed.`}
                  className="font-mono text-[11px] font-semibold uppercase tracking-wide text-danger transition-colors duration-[var(--d-micro)] hover:text-danger/80 disabled:opacity-60"
                >
                  Remove
                </ActionForm>
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
