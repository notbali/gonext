"use client";

import { useId, useState, type ReactNode } from "react";
import { Avatar } from "@/components/Avatar";
import { ActionForm } from "@/components/ActionForm";

export type AdminTeammateRow = {
  id: string;
  name: string;
  image: string | null;
  discordId: string | null;
  isCoach: boolean;
  active: boolean;
};

export type AdminUnassignedRow = {
  id: string;
  name: string;
  image: string | null;
  discordId: string | null;
};

type Action = (id: string) => Promise<void>;

const ACTION_CLASS =
  "tap-target font-mono text-[11px] font-semibold uppercase tracking-wide transition-colors duration-[var(--d-micro)] disabled:opacity-60";
const PRIMARY = `${ACTION_CLASS} text-primary hover:text-primary-bright`;
const MUTED = `${ACTION_CLASS} text-text-muted hover:text-text-primary`;
const DANGER = `${ACTION_CLASS} text-danger hover:text-danger/80`;

function matches(row: { name: string; discordId: string | null }, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return row.name.toLowerCase().includes(q) || (row.discordId ?? "").includes(q);
}

function Section({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className="mt-8">
      <h2
        id={headingId}
        className="flex items-center gap-2 font-mono text-caption font-semibold uppercase tracking-widest text-text-dim"
      >
        {title}
        <span className="rounded-full border border-border px-1.5 text-[10px] text-text-muted">{count}</span>
      </h2>
      <div className="mt-2 flex flex-col gap-2">{children}</div>
    </section>
  );
}

function Row({
  name,
  image,
  discordId,
  dimmed = false,
  badge,
  children,
}: {
  name: string;
  image: string | null;
  discordId: string | null;
  dimmed?: boolean;
  badge?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4 ${
        dimmed ? "bg-surface/50 opacity-70" : "bg-surface"
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <Avatar name={name} src={image} size={32} />
        <div className="min-w-0">
          <p className="flex min-w-0 items-center gap-2 text-body-lg font-medium text-text-primary">
            <span className="min-w-0 truncate">{name}</span>
            {badge}
          </p>
          <p className="truncate font-mono text-caption text-text-dim">{discordId ?? "No Discord account"}</p>
        </div>
      </div>
      {children && <div className="flex items-center gap-4">{children}</div>}
    </div>
  );
}

export function AdminUserList({
  teammates,
  unassignedUsers,
  canAddToTeam,
  addUserToTeam,
  deactivateTeammate,
  reactivateTeammate,
  promoteTeammate,
  demoteTeammate,
}: {
  teammates: AdminTeammateRow[];
  unassignedUsers: AdminUnassignedRow[];
  canAddToTeam: boolean;
  addUserToTeam: Action;
  deactivateTeammate: Action;
  reactivateTeammate: Action;
  promoteTeammate: Action;
  demoteTeammate: Action;
}) {
  const [query, setQuery] = useState("");

  const visible = teammates.filter((t) => matches(t, query));
  const coaches = visible.filter((t) => t.active && t.isCoach);
  const players = visible.filter((t) => t.active && !t.isCoach);
  const inactive = visible.filter((t) => !t.active);
  const unassigned = unassignedUsers.filter((u) => matches(u, query));
  const nothingShown = coaches.length + players.length + inactive.length + unassigned.length === 0;

  const removeButton = (t: AdminTeammateRow) => (
    <ActionForm
      action={() => deactivateTeammate(t.id)}
      successMessage={`${t.name} was removed.`}
      ariaLabel={`Remove ${t.name}`}
      className={DANGER}
    >
      Remove
    </ActionForm>
  );

  return (
    <div>
      <input
        type="search"
        aria-label="Search users"
        placeholder="Search by name or Discord ID"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="mt-6 w-full rounded-md border border-border bg-surface-raised px-3 py-2 font-mono text-caption text-text-primary placeholder:text-text-dim focus:border-brand/50 focus:outline-none"
      />

      {nothingShown && (
        <p className="mt-6 text-body text-text-muted">
          {query.trim() ? "No users match that search." : "Nobody has signed in yet."}
        </p>
      )}

      {coaches.length > 0 && (
        <Section title="Coaches" count={coaches.length}>
          {coaches.map((t) => (
            <Row
              key={t.id}
              {...t}
              badge={
                <span className="shrink-0 rounded-full bg-brand-dim px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-brand-bright">
                  Coach
                </span>
              }
            >
              <ActionForm
                action={() => demoteTeammate(t.id)}
                successMessage={`${t.name} is no longer a Coach.`}
                ariaLabel={`Demote ${t.name}`}
                className={MUTED}
              >
                Demote
              </ActionForm>
              {removeButton(t)}
            </Row>
          ))}
        </Section>
      )}

      {players.length > 0 && (
        <Section title="Players" count={players.length}>
          {players.map((t) => (
            <Row key={t.id} {...t}>
              <ActionForm
                action={() => promoteTeammate(t.id)}
                successMessage={`${t.name} is now a Coach.`}
                ariaLabel={`Make ${t.name} a Coach`}
                className={PRIMARY}
              >
                Make Coach
              </ActionForm>
              {removeButton(t)}
            </Row>
          ))}
        </Section>
      )}

      {inactive.length > 0 && (
        <Section title="Inactive" count={inactive.length}>
          {inactive.map((t) => (
            <Row key={t.id} {...t} dimmed>
              <ActionForm
                action={() => reactivateTeammate(t.id)}
                successMessage={`${t.name} is active again.`}
                ariaLabel={`Reactivate ${t.name}`}
                className={PRIMARY}
              >
                Reactivate
              </ActionForm>
            </Row>
          ))}
        </Section>
      )}

      {unassigned.length > 0 && (
        <Section title="Not on team" count={unassigned.length}>
          {unassigned.map((u) => (
            <Row key={u.id} {...u}>
              {canAddToTeam && (
                <ActionForm
                  action={() => addUserToTeam(u.id)}
                  successMessage={`${u.name} was added to the team.`}
                  ariaLabel={`Add ${u.name} to team`}
                  className={PRIMARY}
                >
                  Add to team
                </ActionForm>
              )}
            </Row>
          ))}
        </Section>
      )}
    </div>
  );
}
