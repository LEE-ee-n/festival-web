import { cache } from "react";

import type { ArtistDirectoryItem } from "@/lib/artists/artistDirectory";
import { createPublicSupabaseClient } from "@/lib/supabase/public";

const PAGE_SIZE = 1000;

export const getPublicArtistDirectory = cache(
  async (): Promise<ArtistDirectoryItem[]> => {
    const supabase = createPublicSupabaseClient();
    if (!supabase) return [];

    const artists: ArtistDirectoryItem[] = [];
    let offset = 0;

    while (true) {
      const { data, error } = await supabase
        .from("artists")
        .select(`
          id, name, normalized_name, image_url,
          artist_aliases (alias_name)
        `)
        .order("id", { ascending: true })
        .range(offset, offset + PAGE_SIZE - 1);

      if (error) throw error;

      const rows = data ?? [];
      artists.push(...rows.map((artist) => ({
        id: artist.id,
        name: artist.name,
        normalizedName: artist.normalized_name,
        imageUrl: artist.image_url,
        aliases: (artist.artist_aliases ?? [])
          .map((alias) => alias.alias_name),
      })));

      if (rows.length < PAGE_SIZE) break;
      offset += PAGE_SIZE;
    }

    return artists;
  },
);
