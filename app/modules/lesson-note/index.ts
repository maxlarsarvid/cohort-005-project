import { describeNote, type NoteState, type NoteStatus } from "./lib/status";

export type { NoteState, NoteStatus };

/**
 * What the Lesson Note's footer says, and whether Save is worth pressing.
 * Pure, so the component only renders what this decides.
 */
export function lessonNoteStatus(state: NoteState): {
  status: NoteStatus;
  canSave: boolean;
} {
  return describeNote(state);
}
