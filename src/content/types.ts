/**
 * Shape of all editable content. Sanity documents (studio/schemas) mirror this
 * exactly; seed.json is the fallback used when Sanity isn't configured or a
 * field is empty.
 *
 * Text fields may contain tokens filled from SiteSettings, see `fill()` in
 * src/content/tokens.ts: {firma} {rok} {miasto} {telefon} {email} {adres} {nip}
 * {godziny} {godzina_zamkniecia} {promien} {termin_oddzwonienia}.
 * A token written with a capital letter ({Termin_oddzwonienia}) capitalizes the value.
 */

export const ICON_NAMES = [
  "phone",
  "camera",
  "tree",
  "alert-triangle",
  "scissors",
  "cylinder",
  "truck",
  "wind",
  "file-text",
  "shield",
  "clock",
  "check",
  "arrow-right",
  "x",
  "alert-circle",
] as const;
export type IconName = (typeof ICON_NAMES)[number];

/** Sanity image value (asset reference + optional crop/hotspot). */
export interface SanityImageValue {
  asset?: { _ref: string };
  crop?: { top: number; bottom: number; left: number; right: number };
  hotspot?: { x: number; y: number; width: number; height: number };
}

/** An image slot. Without an uploaded photo the striped placeholder shows `placeholderLabel` (the shot list). */
export interface SiteImage {
  image?: SanityImageValue | null;
  alt: string;
  placeholderLabel: string;
}

export interface NavLink {
  label: string;
  href: string;
}

export interface SiteSettings {
  companyName: string;
  foundingYear: string;
  city: string;
  /** Display form, e.g. "600 000 000". tel: links are built from it. */
  phone: string;
  email: string;
  address: string;
  nip: string;
  /** Display text, e.g. "Pn–Sob 7:00–19:00". */
  hoursText: string;
  /** Used for JSON-LD and the "Odbieramy teraz" indicator. */
  openingDays: string[]; // schema.org day codes: Mo Tu We Th Fr Sa Su
  opensAt: string; // "07:00"
  closesAt: string; // "19:00"
  /** Shown in copy, e.g. "[19:00]". */
  closingHourText: string;
  radiusKm: string;
  callbackPromise: string;
  areaServed: string[];
  seoTitle: string;
  seoDescription: string;
  ogImage?: SanityImageValue | null;
}

export interface HeaderContent {
  tagline: string;
  nav: NavLink[];
  stickyNav: NavLink[];
  callLabel: string;
  callAriaLabel: string;
  stickyStatus: string;
}

export interface HeroContent {
  eyebrow: string;
  heading: string;
  lead: string;
  callLabelMobile: string;
  callLabelDesktop: string;
  photoCtaMobile: string;
  photoCtaDesktop: string;
  hoursLine: string;
  badgeValue: string;
  badgeLabel: string;
  image: SiteImage;
}

export interface TrustItem {
  icon: IconName;
  /** "\n" = line break on mobile only. */
  label: string;
  hideOnMobile: boolean;
}

export interface ServiceCard {
  icon: IconName;
  title: string;
  text: string;
  image: SiteImage;
}

export interface ServicesContent {
  eyebrow: string;
  heading: string;
  lead: string;
  pricingLinkLabel: string;
  cards: ServiceCard[];
  permitsStrong: string;
  permitsText: string;
  ctaMobileTitle: string;
  ctaMobileText: string;
  ctaDesktopTitle: string;
  ctaDesktopText: string;
  ctaCallLabel: string;
}

export interface GalleryFilter {
  value: string; // "all" or a category value
  label: string;
}

export interface GalleryItem {
  title: string;
  category: string;
  location: string;
  detail: string;
  before: SiteImage;
  after: SiteImage;
}

export interface GalleryContent {
  eyebrow: string;
  heading: string;
  lead: string;
  filters: GalleryFilter[];
  beforeLabel: string;
  afterLabel: string;
  sliderAriaLabel: string;
  sliderHintMobile: string;
  sliderHintDesktop: string;
  moreLabelMobile: string;
  moreLabelDesktop: string;
  /** Optional external link (e.g. Facebook album). Without it the button reveals more items. */
  moreUrl: string;
  emptyText: string;
  items: GalleryItem[];
}

export interface PriceRow {
  service: string;
  scope: string;
  price: string;
  /** Shorter price for mobile; "\n" = line break. Falls back to `price`. */
  priceMobile: string;
  free: boolean;
}

export interface PricingContent {
  eyebrow: string;
  heading: string;
  lead: string;
  captionMobile: string;
  colService: string;
  colScope: string;
  colPrice: string;
  rows: PriceRow[];
  vatNote: string;
  factorsTitle: string;
  factors: string[];
  ctaMobileCall: string;
  ctaMobileLink: string;
  ctaCardTitle: string;
  ctaCardText: string;
  ctaCardCall: string;
  ctaCardLink: string;
}

export interface FormStep {
  title: string;
  text: string;
}

export interface FormContent {
  eyebrow: string;
  headingMobile: string;
  headingDesktop: string;
  leadMobile: string;
  steps: FormStep[];
  talkLabelMobile: string;
  talkLabelDesktop: string;
  nameLabel: string;
  namePlaceholder: string;
  phoneLabel: string;
  phonePlaceholder: string;
  phoneError: string;
  cityLabel: string;
  cityPlaceholder: string;
  descLabel: string;
  optionalLabel: string;
  descPlaceholder: string;
  photosLabel: string;
  dropTitleMobile: string;
  dropTitleDesktop: string;
  limitsMobile: string;
  limitsDesktop: string;
  pickLabel: string;
  addMoreLabel: string;
  readyOne: string;
  readyFew: string;
  readyMany: string;
  statusDone: string;
  statusQueued: string;
  statusCompressing: string;
  cancelAria: string;
  removeAria: string;
  failedSuffix: string;
  retryLabel: string;
  removeLabel: string;
  errorTooLarge: string;
  errorBadType: string;
  errorTooMany: string;
  errorUpload: string;
  errorSubmit: string;
  consentText: string;
  consentLinkLabel: string;
  consentError: string;
  submitLabel: string;
  submittingLabel: string;
  uploadingLabel: string;
  turnstileError: string;
  sentHeading: string;
  sentText: string;
  sentTextNoPhotos: string;
  photoWordOne: string;
  photoWordFew: string;
  photoWordMany: string;
  sentNumberLabel: string;
  sentPhotosHeading: string;
  urgentLabelMobile: string;
  urgentLabelDesktop: string;
  resetLabel: string;
}

export interface FooterContent {
  ctaTitle: string;
  ctaText: string;
  description: string;
  phoneLabelMobile: string;
  callLabel: string;
  contactHeading: string;
  emailLabel: string;
  addressLabel: string;
  hoursLabel: string;
  hoursExtra: string;
  areaHeading: string;
  areaLine: string;
  navHeading: string;
  nav: NavLink[];
  copyright: string;
  privacyLabel: string;
}

export interface StickyBarContent {
  ariaLabel: string;
  onlineLine: string;
  offlineLine: string;
  photoLabel: string;
  /** Outside opening hours: show offlineLine and make the photo button the main one. Confirm with the client first. */
  swapOffHours: boolean;
}

export interface PrivacyContent {
  title: string;
  /** Paragraphs; a paragraph starting with "## " is rendered as a heading. */
  body: string[];
}

export interface LandingContent {
  settings: SiteSettings;
  header: HeaderContent;
  hero: HeroContent;
  trust: { items: TrustItem[] };
  services: ServicesContent;
  gallery: GalleryContent;
  pricing: PricingContent;
  form: FormContent;
  footer: FooterContent;
  stickyBar: StickyBarContent;
  privacy: PrivacyContent;
}
