import type { CandidateSourceAsset } from "../types.ts";

export function getCandidateSourceStoragePaths(
  assets: CandidateSourceAsset[],
) {
  return [
    ...new Set(
      assets
        .map((asset) => asset.storage_path?.trim())
        .filter((path): path is string => Boolean(path)),
    ),
  ];
}
