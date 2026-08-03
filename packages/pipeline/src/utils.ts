const SLUG_NAME_OVERRIDES: Record<string, string> = {
  '1password': '1Password',
  browsercompany: 'The Browser Company',
  cal: 'Cal.com',
  clickhouse: 'ClickHouse',
  cockroachlabs: 'Cockroach Labs',
  dbtlabs: 'dbt Labs',
  fullstory: 'FullStory',
  grafanalabs: 'Grafana Labs',
  hashicorp: 'HashiCorp',
  helpscout: 'Help Scout',
  hibob: 'HiBob',
  hubspot: 'HubSpot',
  langchain: 'LangChain',
  mural: 'MURAL',
  pagerduty: 'PagerDuty',
  posthog: 'PostHog',
  trigger: 'Trigger.dev',
  workos: 'WorkOS',
};

export const slugToDisplayName = (slug: string): string =>
  SLUG_NAME_OVERRIDES[slug] ?? slug.charAt(0).toUpperCase() + slug.slice(1);

const HTML_ENTITY_MAP: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&nbsp;': ' ',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&mdash;': '—',
  '&ndash;': '–',
  '&rsquo;': '’',
  '&lsquo;': '‘',
  '&rdquo;': '”',
  '&ldquo;': '“',
  '&hellip;': '…',
  '&times;': '×',
  '&bull;': '•',
};

export const decodeHtmlEntities = (str: string): string =>
  str
    .replace(/&amp;/g, '&')
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCharCode(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, h: string) =>
      String.fromCharCode(parseInt(h, 16))
    )
    .replace(/&[a-z]+;/gi, (e) => HTML_ENTITY_MAP[e] ?? e);

export const stripHtml = (html: string): string =>
  decodeHtmlEntities(
    html
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  );
