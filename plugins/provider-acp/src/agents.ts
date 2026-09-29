import { readFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { extname, join } from "node:path";
import { z } from "zod";
import type { PluginProviderReasoningLevel } from "@get-bb/plugin-sdk";
import { experimental_acpLaunchSpecSchema } from "@get-bb/plugin-sdk/provider-bridge/acp";
import type { AcpLaunchSpec } from "@get-bb/plugin-sdk/provider-bridge/acp";
import type { AcpNativeRootsResolver } from "./native-roots/resolver.js";

export const ACP_FAMILY = "acp";

export function formatCustomAcpProviderId(slug: string): string {
  return `acp-${slug}`;
}

export type { AcpLaunchSpec };

export interface AcpAgentDefinition {
  id: string;
  displayName: string;
  icon?: string;
  launch: AcpLaunchSpec;
  dialect?: string;
  parameterizedModelPicker?: boolean;
  primaryModels?: readonly string[];
  reasoningProbePriorityModelIds?: readonly string[];
  visibility?: "always" | "installed";
  signInCommand?: string;
  installUrl?: string;
  iconTint?: { light: string; dark: string };
  supportsManualCompaction?: boolean;
  fork?: "none" | "tip";
  reasoningLevels?: readonly PluginProviderReasoningLevel[];
  providerUsage?: boolean;
  providerInstallation?: boolean;
  nativeRootsResolver?: AcpNativeRootsResolver;
}

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]*$/u;
const ENV_NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/u;
const HOST_GLYPH_PATTERN = /^[A-Z][A-Za-z0-9]*$/u;
export const CUSTOM_AGENT_DECLARED_ICON_NAMES = [
  "claude",
  "cursor",
  "glm",
  "grok",
  "hermes-agent",
  "omp",
  "opencode",
] as const;
const DECLARED_ICON_NAMES = new Set<string>(CUSTOM_AGENT_DECLARED_ICON_NAMES);
const ICON_MAX_BYTES = 32 * 1024;
const ICON_CONTENT_TYPES: Readonly<Record<string, string>> = {
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
};
const ICON_DATA_URI_PATTERN =
  /^data:image\/(?:svg\+xml|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/u;

function isIconFilePath(icon: string): boolean {
  return (
    (icon.startsWith("/") || icon.startsWith("~/")) &&
    ICON_CONTENT_TYPES[extname(icon).toLowerCase()] !== undefined
  );
}

function isCustomAgentIcon(icon: string): boolean {
  return (
    HOST_GLYPH_PATTERN.test(icon) ||
    (icon.startsWith("provider-acp/") &&
      DECLARED_ICON_NAMES.has(icon.slice("provider-acp/".length))) ||
    ICON_DATA_URI_PATTERN.test(icon) ||
    isIconFilePath(icon)
  );
}

export function loadCustomAgentIcon(
  icon: string,
): { icon: string } | { problem: string } {
  if (isIconFilePath(icon)) {
    const path = icon.startsWith("~/") ? join(homedir(), icon.slice(2)) : icon;
    let bytes: Buffer;
    try {
      const { size } = statSync(path);
      if (size === 0 || size > ICON_MAX_BYTES) {
        return {
          problem: `icon file ${icon} must be 1-${ICON_MAX_BYTES} bytes`,
        };
      }
      bytes = readFileSync(path);
    } catch (error) {
      return {
        problem: `icon file ${icon} could not be read: ${String(error)}`,
      };
    }
    const contentType = ICON_CONTENT_TYPES[extname(icon).toLowerCase()];
    return {
      icon: `data:${contentType};base64,${bytes.toString("base64")}`,
    };
  }
  const encoded = ICON_DATA_URI_PATTERN.exec(icon)?.[1];
  if (encoded === undefined) {
    return { icon };
  }
  let decodedLength: number;
  try {
    decodedLength = atob(encoded).length;
  } catch {
    return { problem: "icon data URI is not valid base64" };
  }
  return decodedLength > ICON_MAX_BYTES
    ? {
        problem: `icon data URI must decode to at most ${ICON_MAX_BYTES} bytes`,
      }
    : { icon };
}

const launchSpecFields = experimental_acpLaunchSpecSchema.shape;

export const customAcpAgentSchema = z
  .object({
    id: z.string().regex(SLUG_PATTERN),
    displayName: z.string().min(1),
    command: z.string().min(1),
    icon: z
      .string()
      .refine(
        isCustomAgentIcon,
        "Icon must be a host glyph, a declared ACP provider icon, an absolute or ~/ path to an .svg, .png or .webp file, or a base64 image data URI.",
      )
      .optional(),
    args: z.array(z.string()).default([]),
    env: z.record(z.string().regex(ENV_NAME_PATTERN), z.string()).default({}),
    cwd: z.string().min(1).optional(),
    dialect: z.string().min(1).optional(),
    modelCli: launchSpecFields.modelCli,
    reasoningCli: launchSpecFields.reasoningCli,
    nativeReasoning: launchSpecFields.nativeReasoning,
    nativeSkillRoots: launchSpecFields.nativeSkillRoots,
    permissionCli: launchSpecFields.permissionCli,
    supportsManualCompaction: z.boolean().default(false),
    providerUsage: z.boolean().optional(),
  })
  .strict();
export type CustomAcpAgent = z.infer<typeof customAcpAgentSchema>;

const CUSTOM_AGENT_GLYPH = "Toolbox";

export function customAcpAgentDefinition(
  agent: CustomAcpAgent,
  shipped?: AcpAgentDefinition,
): AcpAgentDefinition {
  const nativeSkillRoots =
    agent.nativeSkillRoots ?? shipped?.launch.nativeSkillRoots;
  const icon = agent.icon ?? shipped?.icon ?? CUSTOM_AGENT_GLYPH;
  return {
    id: formatCustomAcpProviderId(agent.id),
    displayName: agent.displayName,
    icon,
    ...(icon === shipped?.icon && shipped.iconTint !== undefined
      ? { iconTint: { ...shipped.iconTint } }
      : {}),
    launch: {
      displayName: agent.displayName,
      command: agent.command,
      args: [...agent.args],
      env: { ...agent.env },
      ...(agent.cwd === undefined ? {} : { cwd: agent.cwd }),
      ...(agent.modelCli === undefined ? {} : { modelCli: agent.modelCli }),
      ...(agent.reasoningCli === undefined
        ? {}
        : { reasoningCli: agent.reasoningCli }),
      ...(agent.nativeReasoning === undefined
        ? {}
        : { nativeReasoning: agent.nativeReasoning }),
      ...(nativeSkillRoots === undefined ? {} : { nativeSkillRoots }),
      ...(agent.permissionCli === undefined
        ? {}
        : { permissionCli: agent.permissionCli }),
    },
    ...(agent.providerUsage ? { providerUsage: true } : {}),
    ...(agent.dialect === undefined ? {} : { dialect: agent.dialect }),
    ...(shipped?.nativeRootsResolver === undefined
      ? {}
      : { nativeRootsResolver: shipped.nativeRootsResolver }),
    visibility: "always",
    fork: "none",
    supportsManualCompaction: agent.supportsManualCompaction,
  };
}

export function parseCustomAcpAgents(args: {
  entries: readonly unknown[];
  reservedProviderIds: ReadonlySet<string>;
}): { agents: CustomAcpAgent[]; problems: string[] } {
  const agents: CustomAcpAgent[] = [];
  const problems: string[] = [];
  const seen = new Set<string>();
  for (const [index, entry] of args.entries.entries()) {
    const parsed = customAcpAgentSchema.safeParse(entry);
    if (!parsed.success) {
      problems.push(
        `entry ${index} is not a valid agent: ${parsed.error.message}`,
      );
      continue;
    }
    const providerId = formatCustomAcpProviderId(parsed.data.id);
    if (args.reservedProviderIds.has(providerId)) {
      problems.push(
        `agent "${parsed.data.id}" resolves to built-in provider "${providerId}"`,
      );
      continue;
    }
    if (seen.has(providerId)) {
      problems.push(`agent "${parsed.data.id}" is configured more than once`);
      continue;
    }
    const launch = experimental_acpLaunchSpecSchema.safeParse(
      customAcpAgentDefinition(parsed.data).launch,
    );
    if (!launch.success) {
      problems.push(
        `agent "${parsed.data.id}" does not produce a launch the bridge accepts: ${launch.error.message}`,
      );
      continue;
    }
    seen.add(providerId);
    agents.push(parsed.data);
  }
  return { agents, problems };
}
