# Lesson 7: Images

**Why:** a static export can't use Next.js's built-in image optimizer, because that needs a server. Sanity's image CDN
does the job instead, with `next/image` still generating the responsive `srcset`. Three small files connect the two.

## Learn

**What an image field stores.** Uploading a photo creates an **asset** document and stores a *reference* to it:

```json
{ "asset": { "_ref": "image-a1b2c3...-2400x1600-jpg" }, "hotspot": { "x": 0.4, "y": 0.3, ... }, "crop": { ... } }
```

The `_ref` ID encodes the hash, the **original dimensions** and the format. `imageDimensions()` in
[`sanity-image.ts`](../src/lib/sanity-image.ts) parses them with a regex, so the build knows the aspect ratio without
downloading anything. Docs: [image type](https://www.sanity.io/docs/image-type).

**Hotspot and crop.** With `options: { hotspot: true }` the editor marks the important area of a photo and can crop it.
Crop is applied by the URL builder. The hotspot is turned into CSS `object-position` by `objectPosition()`, so
`object-cover` keeps the subject in frame on any screen shape.

**The image CDN.** `https://cdn.sanity.io/images/<project>/<dataset>/<id>.jpg?w=800&q=75&auto=format&fit=max` resizes on
the fly, and `auto=format` serves AVIF or WebP when the browser supports them. `@sanity/image-url` builds these URLs
from an image value. Docs: [image URLs](https://www.sanity.io/docs/image-url),
[presenting images](https://www.sanity.io/docs/presenting-images).

**How the pieces fit:**

1. [`Photo.tsx`](../src/components/ui/Photo.tsx) gets a `SiteImage` (image + alt + placeholder label). With no uploaded
   photo it renders the striped `Placeholder` with the label, so the page doubles as a **shot list** for the
   photographer.
2. With a photo, it renders `next/image` with `src = imageBaseUrl(value)` (the CDN URL with the crop applied) and a
   `sizes` hint.
3. Because [`next.config.ts`](../next.config.ts) sets `images.loader: "custom"`, `next/image` calls
   [`sanity-image-loader.ts`](../src/lib/sanity-image-loader.ts) once per width in its list, which appends `w`, `q`,
   `auto=format` and `fit=max`. The result is a full `srcset` pointing at Sanity's CDN.
4. `preload` on the hero image (Next 16's replacement for `priority`) adds a preload hint; every other image is
   `loading="lazy"`. `layout.tsx` adds `<link rel="preconnect" href="https://cdn.sanity.io">`.

Docs: [`next/image`](https://nextjs.org/docs/app/api-reference/components/image),
[`images` config / custom loaders](https://nextjs.org/docs/app/api-reference/config/next-config-js/images).

**Fixed sizes for metadata.** Open Graph and JSON-LD need a single URL, so [`layout.tsx`](../src/app/layout.tsx) uses
`imageUrl(value, 1200, 630)`, which crops to that size around the hotspot.

## Read in the repo

[`sanity-image.ts`](../src/lib/sanity-image.ts), [`sanity-image-loader.ts`](../src/lib/sanity-image-loader.ts),
[`Photo.tsx`](../src/components/ui/Photo.tsx), [`Placeholder.tsx`](../src/components/ui/Placeholder.tsx), the `images`
block of [`next.config.ts`](../next.config.ts), and `siteImageType` in
[`studio/schemas/index.ts`](../studio/schemas/index.ts).

## Do

With the Sanity project and the local Studio:

1. Upload any photo to *Strona główna → Hero → Zdjęcie główne*, set a hotspot, and publish.
2. `npm run dev` (with `SANITY_PROJECT_ID` in `.env`), open DevTools → Network → Img. Look at the requested URL, the
   `w` parameter and the response `content-type`. Resize the window and reload.
3. Inspect the `<img>`: find `srcset`, `sizes` and `style="object-position: ..."`.
4. Move the hotspot, publish, reload. Remove the photo afterwards if it's not a real one.

## Check yourself

- Why does the site need a custom loader at all? What does the default loader expect that a static export doesn't have?
- Where do the intrinsic width and height come from, given the build never downloads the image?
- A phone screen is 390 px wide at DPR 3. Which `w` will the browser most likely request for the hero, and who decides?

---

Previous: [Lesson 6](06-groq-and-fetching.md) · Next: [Lesson 8: The content pipeline](08-content-pipeline.md)
