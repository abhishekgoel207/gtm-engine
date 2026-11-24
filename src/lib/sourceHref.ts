export const DEMO_SOURCE_PREFIX = "https://example.com/demo/";

export const isDemoSource = (url: string) => url.startsWith(DEMO_SOURCE_PREFIX);

/** Where a citation link should go. Demo sources open a page inside the app. */
export function sourceHref(url: string): string {
  return isDemoSource(url) ? `/demo/${url.slice(DEMO_SOURCE_PREFIX.length)}` : url;
}
