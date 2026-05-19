import { AlertTriangle, CheckCircle2, ExternalLink, Github, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "@tanstack/react-router";

export type PublishEvent = {
  id: string;
  status: string;
  target_type: string;
  target_id: string | null;
  github_url: string | null;
  error_message: string | null;
  created_at: string;
};

export function getPublishEventForSource(
  events: PublishEvent[] | undefined,
  status: "success" | "failed" | "attempted" = "success",
): PublishEvent | null {
  if (!events?.length) return null;
  return events.find((e) => e.status === status) ?? null;
}

export function formatPublishedAt(iso: string): string {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return iso;
  }
}

export function PublishStatusBadge({
  status,
}: {
  status: "idle" | "success" | "failed" | "attempted";
}) {
  if (status === "success") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-success/40 bg-success/10 text-success px-2 py-0.5 text-[10px] font-medium">
        <CheckCircle2 className="size-3" /> Posted to GitHub
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-destructive/40 bg-destructive/10 text-destructive px-2 py-0.5 text-[10px] font-medium">
        <XCircle className="size-3" /> Publish failed
      </span>
    );
  }
  if (status === "attempted") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface text-muted-foreground px-2 py-0.5 text-[10px]">
        Publish attempted
      </span>
    );
  }
  return null;
}

export function AlreadyPublishedNotice({
  event,
  onRepublish,
  disabled,
  republishLabel = "Post again",
}: {
  event: PublishEvent;
  onRepublish: () => void;
  disabled?: boolean;
  republishLabel?: string;
}) {
  return (
    <div className="rounded-md border border-success/30 bg-success/5 p-3 text-xs space-y-2">
      <div className="flex items-start gap-2">
        <CheckCircle2 className="size-4 text-success shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          <div className="font-medium text-success">Already posted to GitHub</div>
          <div className="text-muted-foreground mt-0.5">
            {formatPublishedAt(event.created_at)}
            {event.github_url && (
              <>
                {" · "}
                <a
                  href={event.github_url}
                  target="_blank"
                  rel="noreferrer"
                  className="underline inline-flex items-center gap-0.5"
                >
                  Open <ExternalLink className="size-3" />
                </a>
              </>
            )}
          </div>
        </div>
      </div>
      <button
        onClick={onRepublish}
        disabled={disabled}
        className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2 py-1 text-[11px] hover:bg-accent disabled:opacity-50"
      >
        {republishLabel}
      </button>
    </div>
  );
}

export function GitHubPermissionWarning({
  missing,
  hasToken,
}: {
  missing: string;
  hasToken: boolean;
}) {
  return (
    <div className="rounded-md border border-warning/40 bg-warning/10 p-3 text-xs space-y-2">
      <div className="flex items-start gap-2">
        <AlertTriangle className="size-4 text-warning shrink-0 mt-0.5" />
        <div>
          <div className="font-medium text-warning">GitHub write permission missing</div>
          <div className="text-muted-foreground mt-0.5">
            {hasToken
              ? `Your current GitHub session can't ${missing}. Reconnect to grant repo write scope.`
              : `Sign in with GitHub to enable ${missing}.`}
          </div>
        </div>
      </div>
      <Link
        to="/login"
        className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2 py-1 text-[11px] hover:bg-accent"
      >
        <Github className="size-3" /> Reconnect GitHub
      </Link>
    </div>
  );
}
