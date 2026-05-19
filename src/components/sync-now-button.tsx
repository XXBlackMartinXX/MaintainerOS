import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { syncRepository } from "@/lib/github.functions";

export function SyncNowButton({
  repositoryId,
  size = "sm",
  variant = "default",
  label = "Sync now",
}: {
  repositoryId: string | null | undefined;
  size?: "sm" | "default" | "lg";
  variant?: "default" | "outline" | "ghost";
  label?: string;
}) {
  const qc = useQueryClient();
  const fn = useServerFn(syncRepository);
  const m = useMutation({
    mutationFn: (id: string) => fn({ data: { repository_id: id } }),
    onSuccess: (job) => {
      if (job.error) {
        toast.error("Sync finished with errors", { description: job.error });
      } else {
        toast.success("Repository synced", {
          description: `${job.issues_synced} issues · ${job.prs_synced} PRs · ${job.contributors_synced} contributors`,
        });
      }
      qc.invalidateQueries({ queryKey: ["sync", repositoryId] });
      qc.invalidateQueries({ queryKey: ["issues", repositoryId] });
      qc.invalidateQueries({ queryKey: ["pulls", repositoryId] });
      qc.invalidateQueries({ queryKey: ["contributors", repositoryId] });
      qc.invalidateQueries({ queryKey: ["labels", repositoryId] });
      qc.invalidateQueries({ queryKey: ["connected-repos"] });
    },
    onError: (e: unknown) => {
      toast.error("Sync failed", {
        description: e instanceof Error ? e.message : String(e),
      });
    },
  });

  const disabled = !repositoryId || m.isPending;

  return (
    <Button
      size={size}
      variant={variant}
      disabled={disabled}
      onClick={() => repositoryId && m.mutate(repositoryId)}
    >
      {m.isPending ? (
        <>
          <Loader2 className="size-3.5 animate-spin" /> Syncing…
        </>
      ) : (
        <>
          <RefreshCw className="size-3.5" /> {label}
        </>
      )}
    </Button>
  );
}
