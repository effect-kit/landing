/**
 * Assets that are not part of the build (blog covers, avatars, post images) live on the R2
 * bucket behind cdn.effectkit.dev. Content stores keys such as `blog/<slug>/cover.webp`, never
 * full URLs, so the host can change in one place.
 */
export const cdnOrigin = "https://cdn.effectkit.dev";

/** Public URL for a key on the CDN. */
export const cdn = (key: string) => `${cdnOrigin}/${key.replace(/^\/+/, "")}`;
