import { useState } from "react";
import { useFetcher } from "react-router";
import { Lock, NotebookPen } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { cn, formatRelativeTime } from "~/lib/utils";
import { lessonNoteStatus, type NoteStatus } from "~/modules/lesson-note";

/**
 * The Student's private Note, written at the foot of the Lesson. Key it on the
 * Lesson id so the draft resets when the Student moves to another Lesson.
 */
export function LessonNote({
  note,
}: {
  note: { body: string; updatedAt: string } | null;
}) {
  const fetcher = useFetcher<{ ok: boolean; error?: string }>();
  const [draft, setDraft] = useState(note?.body ?? "");
  const [submittedDraft, setSubmittedDraft] = useState("");
  const error = fetcher.data?.error;
  const { status, canSave } = lessonNoteStatus({
    saved: note,
    draft,
    saving: fetcher.state !== "idle",
    error: error ? { message: error, draft: submittedDraft } : undefined,
  });

  return (
    <section
      aria-labelledby="lesson-note-heading"
      className="mb-8 border-t pt-8"
    >
      <NoteHeading />

      <fetcher.Form
        method="post"
        onSubmit={() => setSubmittedDraft(draft)}
        className="rounded-lg border bg-muted/30 transition-colors focus-within:border-ring focus-within:bg-background"
      >
        <input type="hidden" name="intent" value="save-note" />
        <Textarea
          name="body"
          aria-labelledby="lesson-note-heading"
          rows={4}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Jot down what you want to remember from this lesson…"
          className="min-h-28 resize-y border-0 bg-transparent px-4 py-3 shadow-none focus-visible:ring-0 dark:bg-transparent"
        />
        <NoteSaveBar status={status} canSave={canSave} />
      </fetcher.Form>
    </section>
  );
}

function NoteSaveBar({
  status,
  canSave,
}: {
  status: NoteStatus;
  canSave: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-t px-4 py-2">
      <NoteStatusLine status={status} />
      <Button
        type="submit"
        size="sm"
        variant={canSave ? "default" : "ghost"}
        disabled={!canSave}
      >
        {status.kind === "saving" ? "Saving..." : "Save note"}
      </Button>
    </div>
  );
}

function NoteHeading() {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h2
        id="lesson-note-heading"
        className="flex items-center gap-2 text-lg font-semibold"
      >
        <NotebookPen className="size-4 text-muted-foreground" />
        Your notes
      </h2>
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Lock className="size-3" />
        Only you can see these
      </span>
    </div>
  );
}

function NoteStatusLine({ status }: { status: NoteStatus }) {
  const failed =
    status.kind === "error" ||
    status.kind === "too-long" ||
    status.kind === "blank";
  return (
    <span
      aria-live="polite"
      suppressHydrationWarning
      className={cn(
        "text-xs",
        failed ? "text-red-600" : "text-muted-foreground"
      )}
    >
      {statusText(status)}
    </span>
  );
}

function statusText(status: NoteStatus): string {
  switch (status.kind) {
    case "saving":
      return "Saving...";
    case "error":
      return status.message;
    case "too-long":
      return `${status.over.toLocaleString("en")} characters over the limit`;
    case "blank":
      return "Write something before saving your note.";
    case "unsaved":
      return "Unsaved changes";
    case "saved":
      return `Saved ${formatRelativeTime(status.updatedAt)}`;
    case "empty":
      return "Notes save to this lesson and show up on your Saved page.";
  }
}
