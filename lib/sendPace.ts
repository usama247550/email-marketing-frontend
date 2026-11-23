/** Mirrors backend services/sendSchedule.js (timing estimate only). */

function splitIntoParts(leadCount: number, partCount: number): number[] {
  if (leadCount <= 0) return [];
  const n = Math.min(partCount, leadCount);
  const parts = Array.from({ length: n }, () => 0);
  for (let i = 0; i < leadCount; i++) {
    parts[i % n] += 1;
  }
  return parts.filter((c) => c > 0);
}

export function estimateSendDurationMinutes(
  leadCount: number,
  emailGapSeconds: number,
  partCount: number,
  partGapMinutes: number
): number {
  if (leadCount <= 0) return 0;
  const emailGapMs = emailGapSeconds * 1000;
  const partGapMs = partGapMinutes * 60 * 1000;
  const parts = splitIntoParts(leadCount, partCount);
  let ms = 0;
  for (let p = 0; p < parts.length; p++) {
    const count = parts[p];
    if (count > 1) ms += (count - 1) * emailGapMs;
    if (p < parts.length - 1) ms += partGapMs;
  }
  return ms > 0 ? Math.ceil(ms / 60000) : 0;
}