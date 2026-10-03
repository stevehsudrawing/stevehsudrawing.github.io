/**
 * useMinecraftProfile — the site owner's Minecraft profile via the
 * playerdb.co relay (skin / cape texture URLs).
 *
 * A thin wrapper over the shared `useCachedFetch` SWR core: all
 * callers share one cached profile; stale data is served while a
 * background refresh runs (1-hour freshness keeps the relay lookups
 * polite).  The `select` step trims the playerdb envelope down to the
 * consumed `MinecraftProfile` shape and validates it.
 */

import {
  MINECRAFT_PROFILE_UUID,
  PLAYERDB_PLAYER_ENDPOINT,
} from "../../configs/minecraft";
import { MINECRAFT_PROFILE_CACHE } from "../../platform/storage";
import type { MinecraftProfile } from "../../types/app";
import { useCachedFetch, type CachedFetchState } from "../core/useCachedFetch";

// =========================================================================
// Constants
// =========================================================================

/** Player-endpoint URL for the site owner's account. */
const PROFILE_URL = `${PLAYERDB_PLAYER_ENDPOINT}/${MINECRAFT_PROFILE_UUID}`;

// =========================================================================
// Response shape (the consumed subset of the playerdb envelope)
// =========================================================================

/** Raw `data.player` fields the select step reads. */
interface PlayerDbPlayer {
  username?: unknown;
  raw_id?: unknown;
  skin_texture?: unknown;
  cape_texture?: unknown;
}

// =========================================================================
// Composable
// =========================================================================

/**
 * Reactive Minecraft profile with stale-while-revalidate caching.
 *
 * @returns Shared reactive state for the site owner's profile (skin /
 *          cape texture URLs on `textures.minecraft.net`).
 *
 * @example
 * const { data, isLoading, error, refresh } = useMinecraftProfile();
 * // data.value?.skin_texture → "https://textures.minecraft.net/texture/…"
 */
export function useMinecraftProfile(): CachedFetchState<MinecraftProfile> {
  return useCachedFetch<MinecraftProfile>(
    PROFILE_URL,
    MINECRAFT_PROFILE_CACHE,
    {
      api: "playerdb",
      label: "PlayerDB",
      staleStatuses: [429],
      select: (raw) => {
        const player = (raw as { data?: { player?: PlayerDbPlayer } })?.data
          ?.player;
        if (
          !player ||
          typeof player.username !== "string" ||
          typeof player.raw_id !== "string" ||
          typeof player.skin_texture !== "string"
        ) {
          throw new Error("Unexpected PlayerDB response");
        }
        return {
          username: player.username,
          raw_id: player.raw_id,
          skin_texture: player.skin_texture,
          cape_texture:
            typeof player.cape_texture === "string"
              ? player.cape_texture
              : null,
        };
      },
    },
  );
}
