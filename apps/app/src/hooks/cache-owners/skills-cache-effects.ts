import type { QueryClientArg } from "../cache-effect-types";
import { projectSkillsQueryKey } from "../queries/query-keys";
import { invalidateQueryKeys } from "./cache-effect-utils";

interface ProjectSkillsInvalidationArg extends QueryClientArg {
  projectId: string;
}

export function invalidateProjectSkillsMutationQueries({
  projectId,
  queryClient,
}: ProjectSkillsInvalidationArg): void {
  invalidateQueryKeys({
    queryClient,
    queryKeys: [projectSkillsQueryKey(projectId)],
  });
}

export function refreshProjectSkillsQueries({
  projectId,
  queryClient,
}: ProjectSkillsInvalidationArg): Promise<void> {
  return queryClient.invalidateQueries({
    queryKey: projectSkillsQueryKey(projectId),
  });
}
