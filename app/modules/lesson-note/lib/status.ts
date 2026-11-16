import { MAX_NOTE_LENGTH } from "~/lib/notes";

export type NoteStatus =
  | { kind: "saving" }
  | { kind: "error"; message: string }
  | { kind: "too-long"; over: number }
  | { kind: "unsaved" }
  | { kind: "saved"; updatedAt: string }
  | { kind: "empty" };

export type NoteState = {
  /** The Note as last saved, or null if the Student has not written one. */
  saved: { body: string; updatedAt: string } | null;
  /** What is in the textarea now. */
  draft: string;
  saving: boolean;
  /** The error the last save came back with, if it failed. */
  error: string | undefined;
};

export function describeNote(state: NoteState): {
  status: NoteStatus;
  canSave: boolean;
} {
  const draft = state.draft.trim();
  // The server trims before it stores, so trailing whitespace is not a change.
  const changed = draft !== (state.saved?.body ?? "");
  const over = draft.length - MAX_NOTE_LENGTH;
  const canSave = changed && draft.length > 0 && over <= 0 && !state.saving;

  return { status: statusOf(state, changed, over), canSave };
}

function statusOf(
  state: NoteState,
  changed: boolean,
  over: number
): NoteStatus {
  if (state.saving) return { kind: "saving" };
  if (over > 0) return { kind: "too-long", over };
  if (state.error) return { kind: "error", message: state.error };
  if (changed) return { kind: "unsaved" };
  if (state.saved) return { kind: "saved", updatedAt: state.saved.updatedAt };
  return { kind: "empty" };
}
