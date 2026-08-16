export function avatarFromMetadata(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object") return null;
  const record = metadata as Record<string, unknown>;
  for (const key of ["avatar_url", "picture"]) {
    const value = record[key];
    if (typeof value !== "string") continue;
    const url = value.trim();
    if (url) return url;
  }
  return null;
}

export function avatarFromAuthUser(
  user: {
    user_metadata?: unknown;
    identities?: Array<{ identity_data?: unknown }> | null;
  } | null,
): string | null {
  const fromMeta = avatarFromMetadata(user?.user_metadata);
  if (fromMeta) return fromMeta;
  for (const identity of user?.identities ?? []) {
    const fromIdentity = avatarFromMetadata(identity.identity_data);
    if (fromIdentity) return fromIdentity;
  }
  return null;
}

export function resolveAvatarUrl(
  stored: string | null | undefined,
  metadata: unknown,
): string | null {
  const storedUrl = typeof stored === "string" ? stored.trim() : "";
  return storedUrl || avatarFromMetadata(metadata);
}
