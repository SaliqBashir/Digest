/** Recover the sanitized filename from a stored Supabase public URL. */
export function extractFileName(link: string | undefined): string {
  if (!link) return "Unknown File";
  const fullPath = link.split("/").pop() || "";
  if (!fullPath) return "Unknown File";
  // New format: <uuid>_<original> (uuid contains dashes, never "_").
  const underscore = fullPath.indexOf("_");
  if (underscore >= 0 && underscore < fullPath.length - 1) {
    const uuidPart = fullPath.slice(0, underscore);
    const looksLikeUuid =
      /^[0-9a-fA-F-]{8,36}$/.test(uuidPart) || uuidPart.length >= 8;
    if (looksLikeUuid) return fullPath.slice(underscore + 1);
  }
  // Legacy format: <timestamp>-<original> (timestamp has no dashes).
  const dash = fullPath.indexOf("-");
  if (dash >= 0 && dash < fullPath.length - 1) {
    const prefix = fullPath.slice(0, dash);
    if (/^\d+$/.test(prefix)) return fullPath.slice(dash + 1);
  }
  return fullPath;
}

/** Display name: original upload name when present, else parsed link. */
export function displayFileName(file: {
  filename?: string | null;
  link?: string;
}): string {
  if (file.filename && file.filename.trim()) return file.filename;
  return extractFileName(file.link);
}
