/**
 * One GROQ query for the whole page. The Sanity documents mirror LandingContent,
 * so the projection only picks the singletons; fetch.ts merges over seed.json.
 */
export const LANDING_QUERY = /* groq */ `{
  "settings": *[_id == "siteSettings"][0],
  "page": *[_id == "landingPage"][0]{
    header, hero, trust, services, gallery, pricing, form, footer, stickyBar
  },
  "privacy": *[_id == "privacyPage"][0]{ title, body }
}`;
