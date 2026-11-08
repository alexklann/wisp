export function formatBuildId(id: string): string {
  const m = id.match(/^v?([\d.]+)-(\d+)-g([0-9a-f]+)(-dirty)?$/);
  if (!m) return id;
  const [, ver, ahead, sha, dirty = ""] = m;
  return `v${ver}${ahead === "0" ? "" : `+${ahead}`} · ${sha}${dirty}`;
}
