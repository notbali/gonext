export function AccessGate({ isSignedIn }: { isSignedIn: boolean }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-2 px-6 text-center">
      <p className="font-mono text-caption font-semibold uppercase tracking-widest text-brand">
        {isSignedIn ? "Not on this team" : "Sign in required"}
      </p>
      <p className="max-w-sm text-body text-text-muted">
        {isSignedIn
          ? "Your Discord account isn't linked to this team yet. Ask your coach for the invite link."
          : "This schedule is private to the team. Log in with Discord above to view it."}
      </p>
    </div>
  );
}
