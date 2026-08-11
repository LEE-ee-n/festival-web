"use client";

import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { ArtistCandidate } from "../components/ArtistCandidateTable";
import type {
  ArtistSortKey,
  ManagedArtistRow,
  SortDirection,
} from "../components/ArtistManagementTable";
import { filterAndSortManagedArtists } from "@/lib/artists/managedArtistList";
import {
  isValidArtistNormalizedName,
  normalizeArtistName,
} from "@/lib/artists/normalizeArtistName";
import {
  normalizeFeaturedPlaylistUrl,
  normalizeInstagramUrl,
} from "@/lib/artists/profileLinks";
import {
  prepareArtistImageRename,
  prepareArtistImageUpload,
  removeArtistImageByUrl,
  type PreparedArtistImageChange,
} from "@/lib/artists/uploadArtistImage";
import { supabase } from "@/lib/supabase/client";
import { parseArtistMutationResult } from "@/lib/supabase/rpcResults";

type SimilarArtist = ArtistCandidate;
type ManagedArtist = ManagedArtistRow;
type SelectableArtist = Pick<
  ManagedArtist,
  "id" | "name" | "normalized_name"
> & {
  aliases?: string[];
};

function normalizeSearchText(value: string) {
  return value.toLowerCase().replace(/\s+/g, "");
}

export function useAdminArtistsController() {
  const [artistName, setArtistName] = useState("");
  const [officialEnglishName, setOfficialEnglishName] = useState("");
  const [candidates, setCandidates] = useState<SimilarArtist[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [artists, setArtists] = useState<ManagedArtist[]>([]);
  const [isLoadingArtists, setIsLoadingArtists] = useState(true);
  const [listFilter, setListFilter] = useState("");
  const [sortKey, setSortKey] = useState<ArtistSortKey>("id");
  const [sortDirection, setSortDirection] =
    useState<SortDirection>("asc");

  const [selectedArtistId, setSelectedArtistId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editUniqueName, setEditUniqueName] = useState("");
  const [editAliases, setEditAliases] = useState("");
  const [editInstagramUrl, setEditInstagramUrl] = useState("");
  const [editFeaturedPlaylistUrl, setEditFeaturedPlaylistUrl] = useState("");
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreviewUrl, setEditImagePreviewUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const searchName = officialEnglishName.trim() || artistName.trim();

  const loadArtists = useCallback(async () => {
    try {
      setIsLoadingArtists(true);
      setErrorMessage(null);

      const [artistsResult, aliasesResult] = await Promise.all([
        supabase
          .from("artists")
          .select("id, name, normalized_name, image_url, instagram_url, featured_playlist_url")
          .order("id", { ascending: true }),
        supabase
          .from("artist_aliases")
          .select("artist_id, alias_name")
          .order("alias_name", { ascending: true }),
      ]);

      if (artistsResult.error) throw artistsResult.error;
      if (aliasesResult.error) throw aliasesResult.error;

      const aliasesByArtist = new Map<number, string[]>();

      (aliasesResult.data ?? []).forEach((alias) => {
        const current = aliasesByArtist.get(alias.artist_id) ?? [];
        current.push(alias.alias_name);
        aliasesByArtist.set(alias.artist_id, current);
      });

      setArtists(
        (artistsResult.data ?? []).map((artist) => ({
          id: artist.id,
          name: artist.name,
          normalized_name: artist.normalized_name,
          aliases: aliasesByArtist.get(artist.id) ?? [],
          image_url: artist.image_url,
          instagram_url: artist.instagram_url,
          featured_playlist_url: artist.featured_playlist_url,
        })),
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "아티스트 목록을 불러오지 못했습니다.",
      );
    } finally {
      setIsLoadingArtists(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadArtists();
    }, 0);

  
  return () => window.clearTimeout(timeoutId);
  }, [loadArtists]);

  useEffect(() => () => {
    if (editImagePreviewUrl) URL.revokeObjectURL(editImagePreviewUrl);
  }, [editImagePreviewUrl]);

  function handleImageFileChange(file: File | null) {
    setEditImageFile(file);
    setEditImagePreviewUrl(file ? URL.createObjectURL(file) : "");
  }

  const filteredArtists = useMemo(() => {
    return filterAndSortManagedArtists(artists, listFilter, sortKey, sortDirection);
  }, [artists, listFilter, sortDirection, sortKey]);

  function handleSort(nextSortKey: ArtistSortKey) {
    if (sortKey === nextSortKey) {
      setSortDirection((current) => current === "asc" ? "desc" : "asc");
      return;
    }

    setSortKey(nextSortKey);
    setSortDirection("asc");
  }

  function scrollToArtist(artistId: number) {
    window.setTimeout(() => {
      const view = window.matchMedia("(min-width: 768px)").matches
        ? "desktop"
        : "mobile";
      document
        .querySelector<HTMLElement>(
          `[data-artist-id="${artistId}"][data-artist-view="${view}"]`,
        )
        ?.scrollIntoView({ behavior: "auto", block: "center" });
    }, 0);
  }

  function selectArtist(
    artist: SelectableArtist,
    options?: { revealInList?: boolean },
  ) {
    const fullArtist = artists.find((item) => item.id === artist.id);

    if (options?.revealInList) setListFilter("");
    setSelectedArtistId(artist.id);
    setEditName(fullArtist?.name ?? artist.name);
    setEditUniqueName(fullArtist?.normalized_name ?? artist.normalized_name);
    setEditAliases((fullArtist?.aliases ?? []).join(", "));
    setEditInstagramUrl(fullArtist?.instagram_url ?? "");
    setEditFeaturedPlaylistUrl(fullArtist?.featured_playlist_url ?? "");
    setEditImageFile(null);
    setEditImagePreviewUrl("");
    setErrorMessage(null);
    setSuccessMessage(null);

    if (options?.revealInList) scrollToArtist(artist.id);
  }

  function cancelArtistEdit() {
    setSelectedArtistId(null);
    setEditName("");
    setEditUniqueName("");
    setEditAliases("");
    setEditInstagramUrl("");
    setEditFeaturedPlaylistUrl("");
    setEditImageFile(null);
    setEditImagePreviewUrl("");
    setErrorMessage(null);
  }

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!artistName.trim()) {
      setErrorMessage("화면 표시 이름을 입력하세요.");
      return;
    }

    try {
      setIsSearching(true);
      setErrorMessage(null);
      setSuccessMessage(null);
      setSelectedArtistId(null);

      const normalizedQuery = normalizeSearchText(searchName);
      const localMatches: SimilarArtist[] = artists
        .filter((artist) =>
          normalizeSearchText(artist.name).includes(normalizedQuery)
          || normalizeSearchText(artist.normalized_name).includes(
            normalizedQuery,
          )
          || artist.aliases.some((alias) =>
            normalizeSearchText(alias).includes(normalizedQuery),
          ),
        )
        .map((artist) => ({
          id: artist.id,
          name: artist.name,
          normalized_name: artist.normalized_name,
          similarity_score: 1,
        }));

      if (localMatches.length > 0) {
        setCandidates(localMatches);
        setHasSearched(true);
        return;
      }

      const { data, error } = await supabase.rpc("search_similar_artists", {
        input_name: searchName,
      });

      if (error) throw error;

      setCandidates(data ?? []);
      setHasSearched(true);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "아티스트 검색에 실패했습니다.",
      );
    } finally {
      setIsSearching(false);
    }
  }

  function resetSearch() {
    setArtistName("");
    setOfficialEnglishName("");
    setCandidates([]);
    setHasSearched(false);
    setSelectedArtistId(null);
    setErrorMessage(null);
    setSuccessMessage(null);
  }

  async function handleCreateArtist() {
    const name = artistName.trim();
    const uniqueName = normalizeArtistName(searchName);

    if (!name) {
      setErrorMessage("화면 표시 이름을 입력하세요.");
      return;
    }

    if (!isValidArtistNormalizedName(uniqueName)) {
      setErrorMessage("한글 아티스트는 공식 영문명을 입력해야 합니다.");
      return;
    }

    try {
      setIsCreating(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      const { data, error } = await supabase.rpc("create_artist_with_audit", {
        p_name: name,
        p_normalized_name: uniqueName,
        p_aliases: [],
      });

      if (error) throw error;

      await loadArtists();
      setCandidates([]);
      setHasSearched(false);
      const created = parseArtistMutationResult(data);
      selectArtist(created, { revealInList: true });
      setSuccessMessage(`${created.name}을(를) 신규 등록했습니다.`);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "신규 등록에 실패했습니다.",
      );
    } finally {
      setIsCreating(false);
    }
  }

  async function handleSaveArtist() {
    if (selectedArtistId === null) return;

    const name = editName.trim();
    const uniqueName = normalizeArtistName(editUniqueName);
    const aliases = [...new Set(
      editAliases
        .split(",")
        .map((alias) => alias.trim())
        .filter(Boolean),
    )];

    let instagramUrl: string | null;
    let featuredPlaylistUrl: string | null;
    let preparedImageChange: PreparedArtistImageChange | null = null;
    let didPersistChanges = false;
    try {
      instagramUrl = normalizeInstagramUrl(editInstagramUrl);
      featuredPlaylistUrl = normalizeFeaturedPlaylistUrl(editFeaturedPlaylistUrl);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "프로필 링크를 확인해 주세요.");
      return;
    }

    if (!name) {
      setErrorMessage("화면 표시 이름을 입력하세요.");
      return;
    }

    if (!isValidArtistNormalizedName(uniqueName)) {
      setErrorMessage("normalized_name은 영문 소문자와 숫자로 입력해 주세요.");
      return;
    }

    const duplicateArtist = artists.find(
      (artist) =>
        artist.id !== selectedArtistId
        && artist.normalized_name === uniqueName,
    );

    if (duplicateArtist) {
      setErrorMessage(
        `${duplicateArtist.name}(ID: ${duplicateArtist.id})이 같은 normalized_name을 사용 중입니다.`,
      );
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      const selectedArtist = artists.find((artist) => artist.id === selectedArtistId);
      if (editImageFile) {
        preparedImageChange = await prepareArtistImageUpload(
          uniqueName,
          editImageFile,
          selectedArtist?.image_url ?? "",
        );
      } else if (
        selectedArtist
        && selectedArtist.normalized_name !== uniqueName
        && selectedArtist.image_url
      ) {
        preparedImageChange = await prepareArtistImageRename(
          uniqueName,
          selectedArtist.image_url,
        );
      }

      const { error } = await supabase.rpc("update_artist_admin", {
        p_artist_id: selectedArtistId,
        p_name: name,
        p_normalized_name: uniqueName,
        p_aliases: aliases,
        p_instagram_url: instagramUrl ?? "",
        p_featured_playlist_url: featuredPlaylistUrl ?? "",
        p_image_url: preparedImageChange?.publicUrl ?? null,
      });

      if (error) throw error;
      didPersistChanges = true;

      const cleanupWarning = await preparedImageChange?.finalize();

      await loadArtists();
      setSelectedArtistId(null);
      setEditName("");
      setEditUniqueName("");
      setEditAliases("");
      setEditInstagramUrl("");
      setEditFeaturedPlaylistUrl("");
      setEditImageFile(null);
      setEditImagePreviewUrl("");
      setSuccessMessage(
        cleanupWarning
          ? `${name}의 정보는 저장했지만 이전 로고 정리에 실패했습니다: ${cleanupWarning}`
          : `${name}의 정보를 수정했습니다.`,
      );
    } catch (error) {
      let rollbackMessage = "";
      if (preparedImageChange && !didPersistChanges) {
        try {
          await preparedImageChange.rollback();
        } catch (rollbackError) {
          rollbackMessage = rollbackError instanceof Error
            ? ` 새 로고 복원·정리에도 실패했습니다: ${rollbackError.message}`
            : " 새 로고 복원·정리에도 실패했습니다.";
        }
      }
      const message =
        typeof error === "object"
        && error !== null
        && "message" in error
          ? String(error.message)
          : "아티스트 수정에 실패했습니다.";

      setErrorMessage(
        message.includes("update_artist_admin")
          || message.toLowerCase().includes("schema cache")
          || message.toLowerCase().includes("bucket not found")
          ? "Supabase에 054_artist_image_upload.sql을 먼저 실행해 주세요."
          : `${message}${rollbackMessage}`,
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteArtist() {
    if (selectedArtistId === null) return;
    const selected = artists.find((artist) => artist.id === selectedArtistId);
    const label = selected?.name ?? (editName || `아티스트 #${selectedArtistId}`);
    if (!window.confirm(`${label}을(를) 삭제하시겠습니까?\n라인업에 연결된 아티스트는 삭제되지 않습니다.`)) return;

    try {
      setIsDeleting(true);
      setErrorMessage(null);
      setSuccessMessage(null);
      const { error } = await supabase.rpc("delete_artist_admin", { p_artist_id: selectedArtistId });
      if (error) throw error;
      const imageCleanupWarning = await removeArtistImageByUrl(selected?.image_url ?? "");
      setSelectedArtistId(null);
      setEditName("");
      setEditUniqueName("");
      setEditAliases("");
      setEditInstagramUrl("");
      setEditFeaturedPlaylistUrl("");
      setEditImageFile(null);
      setEditImagePreviewUrl("");
      await loadArtists();
      setSuccessMessage(
        imageCleanupWarning
          ? `${label}은(는) 삭제했지만 로고 파일 정리에 실패했습니다: ${imageCleanupWarning}`
          : `${label}을(를) 삭제했습니다.`,
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "아티스트 삭제에 실패했습니다.");
    } finally {
      setIsDeleting(false);
    }
  }


  return {
    artistName,
    setArtistName,
    officialEnglishName,
    setOfficialEnglishName,
    candidates,
    hasSearched,
    isSearching,
    isCreating,
    artists,
    isLoadingArtists,
    listFilter,
    setListFilter,
    sortKey,
    sortDirection,
    selectedArtistId,
    editName,
    setEditName,
    editUniqueName,
    setEditUniqueName,
    editAliases,
    setEditAliases,
    editInstagramUrl,
    setEditInstagramUrl,
    editFeaturedPlaylistUrl,
    setEditFeaturedPlaylistUrl,
    editImageFile,
    editImagePreviewUrl,
    isSaving,
    isDeleting,
    errorMessage,
    successMessage,
    filteredArtists,
    handleImageFileChange,
    handleSort,
    selectArtist,
    cancelArtistEdit,
    handleSearch,
    resetSearch,
    handleCreateArtist,
    handleSaveArtist,
    handleDeleteArtist,
  };
}


