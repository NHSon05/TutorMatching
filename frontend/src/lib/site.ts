/** Canonical public origin used for SEO (metadata, sitemap, robots). No trailing slash. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://www.edora.click").replace(/\/+$/, "");
