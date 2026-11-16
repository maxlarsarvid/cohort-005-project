import { describe, it, expect } from "vitest";
import { lessonNoteStatus, type NoteState } from "../index";
import { MAX_NOTE_LENGTH } from "~/lib/notes";

const saved = {
  body: "Types erase at runtime",
  updatedAt: "2026-11-16T10:00:00Z",
};

function state(overrides: Partial<NoteState>): NoteState {
  return {
    saved: null,
    draft: "",
    saving: false,
    error: undefined,
    ...overrides,
  };
}

describe("lessonNoteStatus", () => {
  it("is empty with nothing to save before the Student writes", () => {
    expect(lessonNoteStatus(state({}))).toEqual({
      status: { kind: "empty" },
      canSave: false,
    });
  });

  it("does not offer to save a draft of only whitespace", () => {
    expect(lessonNoteStatus(state({ draft: "   \n" })).canSave).toBe(false);
  });

  it("marks a new draft as unsaved and saveable", () => {
    expect(lessonNoteStatus(state({ draft: "First thought" }))).toEqual({
      status: { kind: "unsaved" },
      canSave: true,
    });
  });

  it("shows when the saved Note was last edited while the draft matches it", () => {
    expect(lessonNoteStatus(state({ saved, draft: saved.body }))).toEqual({
      status: { kind: "saved", updatedAt: saved.updatedAt },
      canSave: false,
    });
  });

  it("ignores surrounding whitespace the server would trim", () => {
    const result = lessonNoteStatus(
      state({ saved, draft: `  ${saved.body}\n` })
    );
    expect(result.status.kind).toBe("saved");
    expect(result.canSave).toBe(false);
  });

  it("marks an edit to the saved Note as unsaved", () => {
    expect(lessonNoteStatus(state({ saved, draft: `${saved.body}!` }))).toEqual(
      { status: { kind: "unsaved" }, canSave: true }
    );
  });

  it("will not save an emptied Note, which the server rejects", () => {
    expect(lessonNoteStatus(state({ saved, draft: "" }))).toEqual({
      status: { kind: "unsaved" },
      canSave: false,
    });
  });

  it("reports saving and blocks a second save meanwhile", () => {
    expect(
      lessonNoteStatus(state({ draft: "Draft", saving: true, error: "old" }))
    ).toEqual({ status: { kind: "saving" }, canSave: false });
  });

  it("surfaces the error from the last save", () => {
    expect(lessonNoteStatus(state({ draft: "Draft", error: "Nope" }))).toEqual({
      status: { kind: "error", message: "Nope" },
      canSave: true,
    });
  });

  it("accepts a draft of exactly the maximum length", () => {
    const draft = "a".repeat(MAX_NOTE_LENGTH);
    expect(lessonNoteStatus(state({ draft }))).toEqual({
      status: { kind: "unsaved" },
      canSave: true,
    });
  });

  it("says how far over the limit a draft is, and will not save it", () => {
    const draft = "a".repeat(MAX_NOTE_LENGTH + 3);
    expect(lessonNoteStatus(state({ draft, error: "old" }))).toEqual({
      status: { kind: "too-long", over: 3 },
      canSave: false,
    });
  });
});
