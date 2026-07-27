import { supabase } from "@/lib/supabase/client";
import { getCandidateSourceStoragePaths } from "@/lib/festivals/candidateSourceAssetPaths";
import type { CandidateSourceAsset } from "@/lib/types";

export async function removeCandidateSourceAssets(
  assets: CandidateSourceAsset[],
) {
  const paths = getCandidateSourceStoragePaths(assets);
  if (paths.length === 0) return 0;

  const { error } = await supabase.storage
    .from("festival-candidate-posters")
    .remove(paths);

  if (error) throw error;
  return paths.length;
}
