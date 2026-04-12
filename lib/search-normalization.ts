const COMBINING_MARKS_REGEX = /[\u0300-\u036f]/g;
const APOSTROPHE_VARIANTS_REGEX = /[\u2018\u2019\u02BC\u00B4\u0060]/g;

export function normalizeSearchText(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(APOSTROPHE_VARIANTS_REGEX, "'")
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae")
    .normalize("NFD")
    .replace(COMBINING_MARKS_REGEX, "")
    .replace(/\s+/g, " ");
}

export function buildSearchableText(parts: Array<string | null | undefined>): string {
  return normalizeSearchText(parts.filter((part): part is string => Boolean(part && part.trim())).join(" "));
}