"use client";

import { useEffect } from "react";
import { patchDateLabel, type PatchNote } from "@/lib/patch-notes";
import { markPatchNotesSeen } from "@/lib/patch-notes-seen";

export function PatchNotesList({ notes }: { notes: PatchNote[] }) {
  if (notes.length === 0) {
    return <p className="mt-6 text-body text-text-muted">Nothing new yet.</p>;
  }

  return (
    <div className="mt-6 flex flex-col gap-3">
      {notes.map((note, i) => (
        <article key={`${note.date}-${note.title}`} className="rounded-lg border border-border bg-surface p-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <time
              dateTime={note.date}
              className="font-mono text-caption font-semibold uppercase tracking-widest text-text-dim"
            >
              {patchDateLabel(note.date)}
            </time>
            {i === 0 && (
              <span className="rounded-full border border-brand/40 bg-brand-dim px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide text-brand-bright">
                Latest
              </span>
            )}
          </div>
          <h2 className="mt-1 text-body-lg font-semibold text-text-primary">{note.title}</h2>
          <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-body text-text-muted marker:text-brand">
            {note.changes.map((change) => (
              <li key={change}>{change}</li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}

/** Records that this browser has read up to `latest`, clearing the nav's new dot. */
export function MarkPatchNotesSeen({ latest }: { latest: string }) {
  useEffect(() => {
    markPatchNotesSeen(latest);
  }, [latest]);
  return null;
}
