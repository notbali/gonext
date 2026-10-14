import { auth } from "@/auth";
import { AccessGate } from "@/components/AccessGate";
import { PageContainer } from "@/components/PageContainer";
import { MarkPatchNotesSeen, PatchNotesList } from "@/components/PatchNotesList";
import { LATEST_PATCH_DATE, PATCH_NOTES } from "@/lib/patch-notes";

export default async function WhatsNewPage() {
  const session = await auth();

  if (!session?.teammateId) {
    return <AccessGate isSignedIn={Boolean(session?.user)} />;
  }

  return (
    <PageContainer>
      <p className="font-mono text-caption font-semibold uppercase tracking-widest text-brand">
        What&apos;s new
      </p>
      <h1 className="mt-1 text-title font-bold text-text-primary">Patch notes</h1>
      <PatchNotesList notes={PATCH_NOTES} />
      <MarkPatchNotesSeen latest={LATEST_PATCH_DATE} />
    </PageContainer>
  );
}
