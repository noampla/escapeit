// Mission checking logic

// Check if a single mission is complete
// theme parameter is optional - used for extinguish to get hazard tile types
export function checkMissionComplete(mission, gameState, grid, theme = null) {
  switch (mission.type) {
    case 'collect':
      return gameState.collectedItems.includes(mission.targetId);
    case 'rescue':
      return gameState.rescuedFriends > 0 || gameState.collectedItems.includes('friend');
    case 'extinguish': {
      // Check if any hazard tiles remain on grid
      if (!grid) return false;
      // Get hazard tile types from theme, default to ['fire']
      const hazardTiles = theme?.getHazardTileTypes?.() || ['fire'];
      for (let y = 0; y < grid.length; y++) {
        for (let x = 0; x < grid[y].length; x++) {
          if (hazardTiles.includes(grid[y][x].type)) return false;
        }
      }
      return true;
    }
    case 'reach':
      return gameState.reachedLocations.includes(mission.targetId);
    case 'escape':
      return gameState.reachedExit;
    default:
      return false;
  }
}

// Check all missions, optionally with theme for hazard checking
export function checkAllMissions(missions, gameState, fixedOrder, grid, theme = null) {
  if (fixedOrder) {
    for (let i = 0; i < missions.length; i++) {
      if (!checkMissionComplete(missions[i], gameState, grid, theme)) {
        return { allComplete: false, currentMissionIndex: i };
      }
    }
    return { allComplete: true, currentMissionIndex: missions.length };
  }
  const allComplete = missions.every(m => checkMissionComplete(m, gameState, grid, theme));
  return { allComplete, currentMissionIndex: -1 };
}

// Get the index of the next incomplete mission (for fixed order mode)
export function getNextRequiredMission(missions, gameState, fixedOrder, grid, theme = null) {
  if (!fixedOrder) return null;
  for (let i = 0; i < missions.length; i++) {
    if (!checkMissionComplete(missions[i], gameState, grid, theme)) return i;
  }
  return null;
}
