/**
 * Minecraft profile — the site owner's Java Edition account.
 *
 * The official Mojang JSON endpoints (`api.mojang.com` /
 * `sessionserver.mojang.com`) send no CORS headers, so the profile
 * (skin / cape texture URLs) is read through the playerdb.co relay;
 * the texture PNGs themselves load straight from the Mojang texture
 * CDN (`textures.minecraft.net`), which allows cross-origin reads.
 */

/** The site owner's Minecraft (Java Edition) UUID — undashed. */
export const MINECRAFT_PROFILE_UUID = "769103ad56da4e9088b72a3d4e19687a";

/** playerdb.co player endpoint base — append the UUID. */
export const PLAYERDB_PLAYER_ENDPOINT =
  "https://playerdb.co/api/player/minecraft";
