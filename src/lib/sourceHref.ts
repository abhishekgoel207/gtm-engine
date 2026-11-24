export const DEMO_SOURCE_PREFIX = "https://example.com/demo/";

/** Reserved domain: a Ripple contact is a source inside this app, not a web page. */
export const RIPPLE_SOURCE_PREFIX = "https://ripple.invalid/contact/";

export const isDemoSource = (url: string) => url.startsWith(DEMO_SOURCE_PREFIX);

/** Where a citation link should go. Demo sources open a page inside the app. */
export function sourceHref(url: string): string {
  if (url.startsWith(RIPPLE_SOURCE_PREFIX)) return `/ripple#${url.slice(RIPPLE_SOURCE_PREFIX.length)}`;
  return isDemoSource(url) ? `/demo/${url.slice(DEMO_SOURCE_PREFIX.length)}` : url;
}
