"use client";

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
