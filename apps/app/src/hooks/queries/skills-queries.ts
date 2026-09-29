import { useMemo } from "react";
import {
  useMutation,
  useMutationState,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { PERSONAL_PROJECT_ID } from "@bb/domain";
import type { DeleteSkillRequest, SkillSummary } from "@bb/server-contract";
import { sdk } from "@/lib/sdk";
import {
  projectSkillsQueryKey,
  skillContentQueryKey,
  skillFilesQueryKey,
  SKILL_CONTENT_QUERY_KEY,
  SKILL_FILES_QUERY_KEY,
} from "@/hooks/queries/query-keys";
import {
  invalidateProjectSkillsMutationQueries,
  refreshProjectSkillsQueries,
} from "@/hooks/cache-owners/skills-cache-effects";

const INSTALL_REGISTRY_SKILL_MUTATION_KEY = ["skills-registry", "install"];

export function useProjectSkills(projectId: string) {
  return useQuery({
    queryKey: projectSkillsQueryKey(projectId),
    queryFn: ({ signal }) =>
      sdk.skills.list({ projectId, environmentId: null, signal }),
    enabled: projectId.length > 0,
    staleTime: 0,
    refetchOnMount: "always",
  });
}

export function useSkillContent(
  projectId: string,
  skill: SkillSummary | null,
  path: string,
) {
  return useQuery({
    queryKey: skill
      ? skillContentQueryKey(projectId, skill.id, path)
      : [SKILL_CONTENT_QUERY_KEY, projectId, "none", path],
    queryFn: ({ signal }) =>
      sdk.skills.getContent({
        projectId,
        skillId: skill!.id,
        path,
        environmentId: null,
        signal,
      }),
    enabled: skill !== null && projectId.length > 0,
    staleTime: 0,
    refetchOnMount: "always",
  });
}

export function prefetchSkillDetail(
  queryClient: ReturnType<typeof useQueryClient>,
  projectId: string,
  skill: SkillSummary,
): void {
  void queryClient.prefetchQuery({
    queryKey: skillFilesQueryKey(projectId, skill.id),
    queryFn: ({ signal }) =>
      sdk.skills.listFiles({
        projectId,
        skillId: skill.id,
        environmentId: null,
        signal,
      }),
    staleTime: 5_000,
  });
  void queryClient.prefetchQuery({
    queryKey: skillContentQueryKey(projectId, skill.id, "SKILL.md"),
    queryFn: ({ signal }) =>
      sdk.skills.getContent({
        projectId,
        skillId: skill.id,
        path: "SKILL.md",
        environmentId: null,
        signal,
      }),
    staleTime: 5_000,
  });
}

export function useSkillFiles(projectId: string, skill: SkillSummary | null) {
  return useQuery({
    queryKey: skill
      ? skillFilesQueryKey(projectId, skill.id)
      : [SKILL_FILES_QUERY_KEY, projectId, "none"],
    queryFn: ({ signal }) =>
      sdk.skills.listFiles({
        projectId,
        skillId: skill!.id,
        environmentId: null,
        signal,
      }),
    enabled: skill !== null && projectId.length > 0,
    staleTime: 0,
    refetchOnMount: "always",
  });
}

export function useDeleteSkill(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    meta: { errorMessage: "Failed to delete skill." },
    mutationFn: (body: DeleteSkillRequest) =>
      sdk.skills.remove({ projectId, ...body }),
    onSuccess: () => {
      invalidateProjectSkillsMutationQueries({ projectId, queryClient });
    },
  });
}

export function useInstallRegistrySkill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: INSTALL_REGISTRY_SKILL_MUTATION_KEY,
    meta: { errorMessage: "Failed to install skill." },
    mutationFn: (registrySkillId: string) =>
      sdk.skills.registry.install({ registrySkillId }),
    onSuccess: () =>
      refreshProjectSkillsQueries({
        projectId: PERSONAL_PROJECT_ID,
        queryClient,
      }),
  });
}

export function useInstallingRegistrySkillIds(): ReadonlySet<string> {
  const variables = useMutationState({
    filters: {
      mutationKey: INSTALL_REGISTRY_SKILL_MUTATION_KEY,
      status: "pending",
    },
    select: (mutation) => mutation.state.variables,
  });
  return useMemo(
    () =>
      new Set(
        variables.filter(
          (registrySkillId): registrySkillId is string =>
            typeof registrySkillId === "string",
        ),
      ),
    [variables],
  );
}
