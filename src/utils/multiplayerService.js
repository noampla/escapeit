/**
 * Multiplayer utilities.
 * Score submission reuses the existing leaderboardService.submitScore() -
 * each player submits their own entry with shared time and individual steps.
 */

/**
 * Returns the room ID for a given map.
 * One active room per map - first player waits, second joins and game starts.
 */
export function makeRoomId(mapId) {
  return `room_${mapId}`;
}
