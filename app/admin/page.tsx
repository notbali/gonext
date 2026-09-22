import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getAdminOverview } from "@/lib/admin";
import { PageContainer } from "@/components/PageContainer";
import { InviteLinkCard } from "@/components/InviteLinkCard";
import { AdminUserList } from "@/components/AdminUserList";
import {
  adminAddUserToTeam,
  adminDeactivateTeammate,
  adminDemoteTeammate,
  adminPromoteTeammate,
  adminReactivateTeammate,
  adminRegenerateInvite,
} from "@/app/admin/actions";

export default async function AdminPage() {
  const session = await auth();
  // 404 rather than an access gate, so the page's existence isn't advertised.
  if (!session?.isAdmin) notFound();

  const { team, teammates, unassignedUsers } = await getAdminOverview(db);

  return (
    <PageContainer>
      <p className="font-mono text-caption font-semibold uppercase tracking-widest text-brand">Admin</p>
      <h1 className="mt-1 text-title font-bold text-text-primary">{team?.name ?? "No team yet"}</h1>
      <p className="mt-1 text-body text-text-muted">
        Everyone who has signed in with Discord. Removing someone deactivates them — they can be
        reactivated later with their availability intact.
      </p>

      {team && (
        <div className="mt-6">
          <InviteLinkCard teamId={team.id} token={team.inviteToken} regenerate={adminRegenerateInvite} />
        </div>
      )}

      <AdminUserList
        teammates={teammates}
        unassignedUsers={unassignedUsers}
        canAddToTeam={team !== null}
        addUserToTeam={adminAddUserToTeam}
        deactivateTeammate={adminDeactivateTeammate}
        reactivateTeammate={adminReactivateTeammate}
        promoteTeammate={adminPromoteTeammate}
        demoteTeammate={adminDemoteTeammate}
      />
    </PageContainer>
  );
}
