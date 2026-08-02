const HTML_ENTITY_MAP: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&nbsp;': ' ',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
};

export const stripHtml = (html: string): string => {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, (e) => HTML_ENTITY_MAP[e] ?? '')
    .replace(/\s+/g, ' ')
    .trim();
};

export const searchText = (job: {
  description: string;
  locationPolicy: string | null;
  role: string;
}): string => {
  return `${job.role} ${job.description} ${job.locationPolicy ?? ''}`.toLowerCase();
};
