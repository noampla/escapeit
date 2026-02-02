// Mission checking logic
export function checkMissionComplete(mission, gameState, grid) {
  switch (mission.type) {
    case 'collect':
      return gameState.collectedItems.includes(mission.targetId);
    case 'rescue':
      return gameState.rescuedFriends > 0 || gameState.collectedItems.includes('friend');
    case 'extinguish':
      // Check if any fire tiles remain on grid
      if (!grid) return false;
      for (let y = 0; y < grid.length; y++) {
        for (let x = 0; x < grid[y].length; x++) {
          if (grid[y][x].type === 'fire') return false;
        }
      }
      return true;
    case 'reach':
      return gameState.reachedLocations.includes(mission.targetId);
    case 'escape':
      return gameState.reachedExit;
    default:
      return false;
  }
}

export function checkAllMissions(missions, gameState, fixedOrder, grid) {
  if (fixedOrder) {
    for (let i = 0; i < missions.length; i++) {
      if (!checkMissionComplete(missions[i], gameState, grid)) {
        return { allComplete: false, currentMissionIndex: i };
      }
    }
    return { allComplete: true, currentMissionIndex: missions.length };
  }
  const allComplete = missions.every(m => checkMissionComplete(m, gameState, grid));
  return { allComplete, currentMissionIndex: -1 };
}

export function getNextRequiredMission(missions, gameState, fixedOrder, grid) {
  if (!fixedOrder) return null;
  for (let i = 0; i < missions.length; i++) {
    if (!checkMissionComplete(missions[i], gameState, grid)) return i;
  }
  return null;
}
