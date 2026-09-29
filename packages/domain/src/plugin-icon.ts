export function isPluginOwnedIconPath(icon: string): boolean {
  return icon.startsWith("./");
}

export const PLUGIN_ICON_NAME_PATTERN = /^[a-z0-9][a-z0-9-]*$/u;

export const PLUGIN_ICON_NAME_MAX_LENGTH = 48;

export const PLUGIN_ICON_MAX_BYTES = 32 * 1024;

export const PLUGIN_ICONS_MAX_COUNT = 64;

const IMAGE_DATA_URI_PATTERN =
  /^data:(image\/(?:svg\+xml|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/u;

export function isImageDataUri(icon: string): boolean {
  return icon.startsWith("data:");
}

export function parseImageDataUri(
  icon: string,
): { bytes: Uint8Array; contentType: string } | null {
  const match = IMAGE_DATA_URI_PATTERN.exec(icon);
  const contentType = match?.[1];
  const encoded = match?.[2];
  if (contentType === undefined || encoded === undefined) {
    return null;
  }
  let decoded: string;
  try {
    decoded = atob(encoded);
  } catch {
    return null;
  }
  if (decoded.length > PLUGIN_ICON_MAX_BYTES) {
    return null;
  }
  return {
    bytes: Uint8Array.from(decoded, (char) => char.charCodeAt(0)),
    contentType,
  };
}

export const NAMESPACED_GLYPH_PATTERN = /^[a-z0-9-]+\/[a-z0-9][a-z0-9-]*$/u;

export function isNamespacedGlyph(glyph: string): boolean {
  return NAMESPACED_GLYPH_PATTERN.test(glyph);
}

export function parseNamespacedGlyph(
  glyph: string,
): { pluginId: string; name: string } | null {
  if (!isNamespacedGlyph(glyph)) {
    return null;
  }
  const separator = glyph.indexOf("/");
  return {
    pluginId: glyph.slice(0, separator),
    name: glyph.slice(separator + 1),
  };
}
