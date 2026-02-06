"use client";

/**
 * Constructs an Uploadcare preview URL for a given image source and width.
 *
 * If `src` is a local path (starts with "/") or not hosted on `ucarecd.net`, the original `src` is returned unchanged.
 *
 * @param src - The image source URL; local or non-Uploadcare URLs are returned as-is.
 * @param width - The width in pixels to request for the square preview (`{width}x{width}`).
 * @param quality - Optional numeric quality that is ignored; the loader always uses the `smart` quality preset.
 * @returns The resulting URL string: either the original `src` or a preview URL of the form
 * `{src}-/preview/{width}x{width}/-/quality/smart/-/format/auto/`
 */
export default function uploadcareLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  // 1. Guard for local files
  if (src.startsWith("/") || !src.includes("ucarecd.net")) {
    return src;
  }

  // 2. Updated quality command from number to preset
  // We use 'smart' which automatically balances quality/size
  const qualityPreset = "smart";

  return `${src}-/preview/${width}x${width}/-/quality/${qualityPreset}/-/format/auto/`;
}