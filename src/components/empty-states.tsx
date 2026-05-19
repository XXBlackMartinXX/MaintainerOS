import { Link } from "@tanstack/react-router";
import { Github, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SyncNowButton } from "@/components/sync-now-button";

export function EmptyRepositoryState({
  title = "No repository connected",
  description = "Connect a GitHub repository to start syncing live issues, pull requests, and contributors.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="panel rounded-xl p-10 text-center">
      <div className="mx-auto size-12 rounded-full bg-primary/10 grid place-items-center ring-1 ring-primary/30">
        <Github className="size-5 text-primary" />
      </div>
      <h3 className="mt-4 font-medium">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">{description}</p>
      <div className="mt-5">
        <Button asChild>
          <Link to="/onboarding">
            <Github className="size-4" /> Connect a repository
          </Link>
        </Button>
      </div>
    </div>
  );
}

export function EmptySyncedDataState({
  repositoryId,
  resource = "data",
}: {
  repositoryId: string | null | undefined;
  resource?: string;
}) {
  return (
    <div className="panel rounded-xl p-10 text-center">
      <div className="mx-auto size-12 rounded-full bg-info/10 grid place-items-center ring-1 ring-info/30">
        <Database className="size-5 text-info" />
      </div>
      <h3 className="mt-4 font-medium">No synced {resource} yet</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
        Run a sync to pull the latest {resource} from GitHub for this repository.
      </p>
      <div className="mt-5">
        <SyncNowButton repositoryId={repositoryId} />
      </div>
    </div>
  );
}
