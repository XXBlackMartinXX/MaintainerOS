import { useState } from "react";
import { Loader2, AlertTriangle, ExternalLink } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export type PublishConfirmKind = "issue_comment" | "issue_labels" | "pr_comment" | "release_draft";

const COPY: Record<PublishConfirmKind, { title: string; warning: string; confirmLabel: string }> = {
  issue_comment: {
    title: "Publish issue comment to GitHub?",
    warning: "This will publish a public GitHub comment under your account.",
    confirmLabel: "Post comment",
  },
  issue_labels: {
    title: "Apply labels to this GitHub issue?",
    warning: "This will modify the issue's labels publicly under your account.",
    confirmLabel: "Apply labels",
  },
  pr_comment: {
    title: "Publish PR review summary to GitHub?",
    warning: "This will publish a public GitHub comment under your account.",
    confirmLabel: "Post summary",
  },
  release_draft: {
    title: "Create a draft GitHub release?",
    warning:
      "This will create a draft release on GitHub. Drafts are not published until you publish them on GitHub.",
    confirmLabel: "Create draft release",
  },
};

export function PublishConfirmDialog({
  open,
  onOpenChange,
  kind,
  preview,
  previousUrl,
  onConfirm,
  disabled,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  kind: PublishConfirmKind;
  /** What will be sent to GitHub (text body or label list rendered as JSX). */
  preview: React.ReactNode;
  /** If set, this is a "post again" flow. */
  previousUrl?: string | null;
  onConfirm: () => Promise<{
    ok: boolean;
    githubUrl?: string | null;
    alreadyPosted?: boolean;
    previousUrl?: string | null;
  } | void>;
  disabled?: boolean;
}) {
  const copy = COPY[kind];
  const [submitting, setSubmitting] = useState(false);

  async function handleConfirm() {
    setSubmitting(true);
    try {
      const res = await onConfirm();
      if (res && res.ok === false && res.alreadyPosted) {
        toast.error("Already posted. Use 'Post again' to repost.");
      } else if (res && res.ok && res.githubUrl) {
        toast.success(
          <span>
            Posted to GitHub.{" "}
            <a href={res.githubUrl} target="_blank" rel="noreferrer" className="underline">
              Open <ExternalLink className="inline size-3" />
            </a>
          </span>,
        );
      } else {
        toast.success("Posted to GitHub.");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error((err as Error).message || "Publish failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-xl">
        <AlertDialogHeader>
          <AlertDialogTitle>{previousUrl ? "Post again to GitHub?" : copy.title}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <div className="flex items-start gap-2 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning">
                <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                <span>{copy.warning}</span>
              </div>
              {previousUrl && (
                <div className="text-xs text-muted-foreground">
                  Previously posted:{" "}
                  <a href={previousUrl} target="_blank" rel="noreferrer" className="underline">
                    {previousUrl}
                  </a>
                </div>
              )}
              <div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
                  Preview
                </div>
                <div className="rounded-md border border-border bg-background p-3 max-h-72 overflow-y-auto text-sm">
                  {preview}
                </div>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={disabled || submitting}
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
          >
            {submitting && <Loader2 className="size-3.5 animate-spin mr-1.5" />}
            {previousUrl ? "Post again" : copy.confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
