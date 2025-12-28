import { Unit, TeamComposition, SolverConfig, SolverResult } from './types';
import { units, regions, getRegionById } from './data';

/**
 * Efficiently generates combinations with early termination
 */
function* generateCombinations<T>(
  items: T[],
  size: number,
  maxResults: number = 10000
): Generator<T[], void, unknown> {
  if (size === 0) {
    yield [];
    return;
  }
  if (size > items.length) return;
  
  if (size === items.length) {
    yield items;
    return;
  }
  
  let count = 0;
  const current: T[] = [];
  
  function* backtrack(start: number): Generator<T[], void, unknown> {
    if (count >= maxResults) return;
    
    if (current.length === size) {
      yield [...current];
      count++;
      return;
    }
    
    const remaining = items.length - start;
    const needed = size - current.length;
    if (remaining < needed) return;
    
    for (let i = start; i < items.length && count < maxResults; i++) {
      current.push(items[i]);
      yield* backtrack(i + 1);
      current.pop();
    }
  }
  
  yield* backtrack(0);
}

/**
 * Counts how many units contribute to each region
 */
function countRegionUnits(units: Unit[]): Map<string, number> {
  const regionCounts = new Map<string, number>();
  units.forEach(unit => {
    unit.regions.forEach(region => {
      regionCounts.set(region, (regionCounts.get(region) || 0) + 1);
    });
  });
  return regionCounts;
}

/**
 * Checks if a team composition satisfies the 4 unique regions requirement
 * Now checks region activation based on unit count requirements
 * Emblems only add to region count if assigned to units that don't already have that region
 */
function isValidComposition(
  teamUnits: Unit[],
  emblem1: string,
  emblem2: string
): { valid: boolean; activeRegions: string[]; emblemAssignments: { unitId: string; region: string }[] } {
  // Count units per region (from unit traits only, not emblems yet)
  const regionCounts = countRegionUnits(teamUnits);
  
  // Assign emblems: must be placed on units that do NOT already have that region
  // Each emblem adds +1 to that region's count
  const emblemAssignments: { unitId: string; region: string }[] = [];
  
  // Assign emblem1: must be on a unit without that region
  const unitForEmblem1 = teamUnits.find(u => !u.regions.includes(emblem1));
  if (!unitForEmblem1) {
    return { valid: false, activeRegions: [], emblemAssignments: [] };
  }
  emblemAssignments.push({ unitId: unitForEmblem1.id, region: emblem1 });
  regionCounts.set(emblem1, (regionCounts.get(emblem1) || 0) + 1);
  
  // Assign emblem2: must be on a unit without that region and not already used
  // It may be the same unit as emblem1 carrier if it lacks both regions
  const unitForEmblem2 = teamUnits.find(u => !u.regions.includes(emblem2));
  if (!unitForEmblem2) {
    return { valid: false, activeRegions: [], emblemAssignments: [] };
  }
  emblemAssignments.push({ unitId: unitForEmblem2.id, region: emblem2 });
  regionCounts.set(emblem2, (regionCounts.get(emblem2) || 0) + 1);
  
  // Check which regions are active based on their requirements
  // Make sure to check emblem regions even if they weren't in the original unit counts
  const activeRegions: string[] = [];
  const allRegionsToCheck = new Set(regionCounts.keys());
  allRegionsToCheck.add(emblem1);
  allRegionsToCheck.add(emblem2);
  
  const regionDetails: { region: string; count: number; required: number; active: boolean }[] = [];
  
  for (const regionId of allRegionsToCheck) {
    const count = regionCounts.get(regionId) || 0;
    const region = getRegionById(regionId);
    if (!region) continue; // Skip if region doesn't exist
    
    const required = region.requiredUnits || 1;
    const isActive = count >= required;
    regionDetails.push({ region: regionId, count, required, active: isActive });
    
    if (isActive) {
      activeRegions.push(regionId);
    }
  }
  
  // Need at least 4 active regions
  if (activeRegions.length < 4) {
    // Don't log here - we log in the main loop with more context
    return { valid: false, activeRegions, emblemAssignments: [] };
  }
  
  return { valid: true, activeRegions, emblemAssignments };
}

/**
 * Filters units based on configuration
 */
function filterUnits(units: Unit[], config: SolverConfig): Unit[] {
  let filtered = [...units];
  
  if (config.requiredUnits && config.requiredUnits.length > 0) {
    filtered = filtered.filter(u => config.requiredUnits!.includes(u.id));
  }
  
  if (config.excludedUnits && config.excludedUnits.length > 0) {
    filtered = filtered.filter(u => !config.excludedUnits!.includes(u.id));
  }

  // Deprioritize unlockable units (sort them to the end)
  filtered.sort((a, b) => {
    const aUnlock = a.unlockable ? 1 : 0;
    const bUnlock = b.unlockable ? 1 : 0;
    return aUnlock - bUnlock;
  });
  
  return filtered;
}

/**
 * Main solver function that finds all valid team compositions
 * Optimized to prevent browser crashes by limiting search space
 */
export function solveWorldRunes(
  emblem1: string,
  emblem2: string,
  config: SolverConfig = {
    maxBoardSize: 9,
    minUnits: 1,
    maxUnits: 9,
  }
): SolverResult[] {
  console.log('=== SOLVER START ===');
  console.log('Emblems:', emblem1, emblem2);
  console.log('Config:', config);
  console.log('Total units available:', units.length);
  console.log('Total regions available:', regions.length);
  
  if (!emblem1 || !emblem2) {
    console.log('Missing emblems, returning empty');
    return [];
  }
  
  // Verify emblems are valid regions
  const region1 = getRegionById(emblem1);
  const region2 = getRegionById(emblem2);
  console.log('Emblem 1 region:', region1);
  console.log('Emblem 2 region:', region2);
  
  if (!region1 || !region2) {
    console.error('Invalid emblems - regions not found!');
    return [];
  }
  
  const filteredUnits = filterUnits(units, config);
  console.log('Filtered units:', filteredUnits.length, 'out of', units.length);

  // Helper to deduplicate units by id
  const uniqueUnits = (arr: Unit[]): Unit[] => {
    const seen = new Set<string>();
    const out: Unit[] = [];
    for (const u of arr) {
      if (seen.has(u.id)) continue;
      seen.add(u.id);
      out.push(u);
    }
    return out;
  };
  
  // Safety check: if too many units, limit the search more aggressively
  if (filteredUnits.length > 50) {
    console.warn('Too many units, limiting search space');
  }
  
  const results: SolverResult[] = [];
  const seenCompositions = new Set<string>();
  
  // Limit total results to prevent memory issues
  const MAX_TOTAL_RESULTS = 2000;
  
  // Early exit if maxUnits is too high relative to available units
  const effectiveMaxUnits = Math.min(config.maxUnits, config.maxBoardSize, filteredUnits.length);
  console.log('Effective max units:', effectiveMaxUnits);
  
  if (effectiveMaxUnits > 7 && filteredUnits.length > 20) {
    // For large searches, be very conservative
    console.warn('Large search space detected, results may be limited');
  }
  
  // Calculate reasonable limits based on team size
  // For larger teams, we need to be more restrictive
  const getMaxCombinationsForSize = (size: number, unitCount: number): number => {
    // Estimate combination count: C(n, k)
    // For small sizes, allow more; for large sizes, be very restrictive
    // Size 5-6 are most likely to have valid combinations, so allow more
    // But we need to search more thoroughly to find valid combinations
    if (size <= 2) return 10000;
    if (size <= 3) return 5000;
    if (size <= 4) return 2000;
    if (size <= 5) return 50000; // More exhaustive for size 5
    if (size <= 6) return 20000; // More exhaustive for size 6
    if (size <= 7) return 5000; 
    return 2000; // For size 8
  };
  
  // Smart search: Build teams by selecting multiple units from key regions
  // Strategy: Prioritize easy regions (Targon=1, Piltover/Yordle=2) + emblem regions
  const emblem1Units = filteredUnits.filter(u => u.regions.includes(emblem1));
  const emblem2Units = filteredUnits.filter(u => u.regions.includes(emblem2));
  const targonUnits = filteredUnits.filter(u => u.regions.includes('targon'));
  const piltoverUnits = filteredUnits.filter(u => u.regions.includes('piltover'));
  const yordleUnits = filteredUnits.filter(u => u.regions.includes('yordle'));
  const shadowIslesUnits = filteredUnits.filter(u => u.regions.includes('shadow-isles'));
  const voidUnits = filteredUnits.filter(u => u.regions.includes('void'));
  
  console.log(`\n=== SMART SEARCH STRATEGY ===`);
  console.log(`Emblem regions: ${emblem1} (${emblem1Units.length} units), ${emblem2} (${emblem2Units.length} units)`);
  console.log(`Easy regions: Targon (${targonUnits.length}), Piltover (${piltoverUnits.length}), Yordle (${yordleUnits.length}), Shadow Isles (${shadowIslesUnits.length}), Void (${voidUnits.length})`);
  
  // Start with smaller team sizes (more efficient and more useful)
  for (let size = config.minUnits; size <= effectiveMaxUnits; size++) {
    if (results.length >= MAX_TOTAL_RESULTS) break;
    
    console.log(`\n--- Checking size ${size} ---`);
    
    // Calculate max combinations more conservatively for large unit pools
    const unitCount = filteredUnits.length;
    let maxForSize = getMaxCombinationsForSize(size, unitCount);
    
    // Don't reduce for large pools - we need to search more thoroughly
    // if (unitCount > 25 && size > 5) {
    //   maxForSize = Math.floor(maxForSize / 2);
    // }
    
    console.log(`Max combinations for size ${size}:`, maxForSize);
    
    // Try smart combinations first: teams with 2+ units from each emblem region + easy regions
    let checkedCount = 0;
    let validCount = 0;
    let invalidCount = 0;
    
    // Smart search: Try combinations with emblem regions + easy regions
    const req1 = (getRegionById(emblem1)?.requiredUnits || 1);
    const req2 = (getRegionById(emblem2)?.requiredUnits || 1);
    const need1 = Math.max(0, req1 - 1); // emblem gives +1
    const need2 = Math.max(0, req2 - 1); // emblem gives +1
    if (size >= 5 && emblem1Units.length >= need1 && emblem2Units.length >= need2 && targonUnits.length >= 1) {
      console.log(`  Trying smart combinations for size ${size}...`);
      
      // Generate combinations of needed units for emblem regions
      const emblem1Groups = need1 > 0 ? Array.from(generateCombinations(emblem1Units, need1, 80)) : [[]];
      const emblem2Groups = need2 > 0 ? Array.from(generateCombinations(emblem2Units, need2, 80)) : [[]];
      // Get Targon units (need 1)
      const targonOptions = targonUnits.slice(0, 10);
      // Get Piltover pairs (need 2)
      const piltoverPairs = Array.from(generateCombinations(piltoverUnits, 2, 20));
      // Get Yordle pairs (need 2)
      const yordlePairs = Array.from(generateCombinations(yordleUnits, 2, 20));
      // Get Shadow Isles pairs (need 2)
      const shadowIslesPairs = Array.from(generateCombinations(shadowIslesUnits, 2, 20));
      // Get Void pairs (need 2)
      const voidPairs = Array.from(generateCombinations(voidUnits, 2, 20));
      
      // Try each combination: need1 emblem1 units + need2 emblem2 units + 1 Targon + 2 from easy region
      for (const e1Group of emblem1Groups.slice(0, 60)) {
        for (const e2Group of emblem2Groups.slice(0, 60)) {
          for (const targonUnit of targonOptions) {
            // Try with Piltover
            for (const piltoverPair of piltoverPairs.slice(0, 10)) {
              if (checkedCount >= maxForSize) break;
              
              const usedUnitIds = new Set([...e1Group.map(u => u.id), ...e2Group.map(u => u.id), targonUnit.id, ...piltoverPair.map(u => u.id)]);
              const teamUnits = uniqueUnits([...e1Group, ...e2Group, targonUnit, ...piltoverPair]);
              
              if (teamUnits.length === size) {
                checkedCount++;
                // Quick pre-checks to avoid expensive validation
                const r1Req = (getRegionById(emblem1)?.requiredUnits || 1);
                const r2Req = (getRegionById(emblem2)?.requiredUnits || 1);
                const r1Count = teamUnits.filter(u => u.regions.includes(emblem1)).length;
                const r2Count = teamUnits.filter(u => u.regions.includes(emblem2)).length;
                if (r1Count + 1 < r1Req || r2Count + 1 < r2Req) continue;
                const carrier1 = teamUnits.find(u => !u.regions.includes(emblem1));
                const carrier2 = teamUnits.find(u => !u.regions.includes(emblem2));
                if (!carrier1 || !carrier2) continue;
                const { valid, activeRegions, emblemAssignments } = isValidComposition(teamUnits, emblem1, emblem2);
                if (valid) {
                  validCount++;
                  const compositionKey = teamUnits.map(u => u.id).sort().join(',');
                  if (!seenCompositions.has(compositionKey)) {
                    seenCompositions.add(compositionKey);
                    results.push({
                      composition: { units: teamUnits, emblemAssignments, activeRegions },
                      unitCount: teamUnits.length,
                      regionCount: activeRegions.length,
                    });
                    if (results.length <= 3) {
                      console.log(`  ✓ Found valid: ${teamUnits.map(u => u.name).join(', ')}`);
                    }
                  }
                }
              } else if (teamUnits.length < size) {
                // Fill remaining slots
                const remainingUnits = filteredUnits.filter(u => !usedUnitIds.has(u.id));
                const remainingSlots = size - teamUnits.length;
                const fillCombos = generateCombinations(remainingUnits, remainingSlots, 50);
                for (const fillUnits of fillCombos) {
                  if (checkedCount >= maxForSize) break;
                  const fullTeam = uniqueUnits([...teamUnits, ...fillUnits]);
                  checkedCount++;
                  const r1Req = (getRegionById(emblem1)?.requiredUnits || 1);
                  const r2Req = (getRegionById(emblem2)?.requiredUnits || 1);
                  const r1Count = fullTeam.filter(u => u.regions.includes(emblem1)).length;
                  const r2Count = fullTeam.filter(u => u.regions.includes(emblem2)).length;
                  if (r1Count + 1 < r1Req || r2Count + 1 < r2Req) continue;
                const carrier1 = fullTeam.find(u => !u.regions.includes(emblem1));
                const carrier2 = fullTeam.find(u => !u.regions.includes(emblem2));
                if (!carrier1 || !carrier2) continue;
                  const { valid, activeRegions, emblemAssignments } = isValidComposition(fullTeam, emblem1, emblem2);
                  if (valid) {
                    validCount++;
                    const compositionKey = fullTeam.map(u => u.id).sort().join(',');
                    if (!seenCompositions.has(compositionKey)) {
                      seenCompositions.add(compositionKey);
                      results.push({
                        composition: { units: fullTeam, emblemAssignments, activeRegions },
                        unitCount: fullTeam.length,
                        regionCount: activeRegions.length,
                      });
                      if (results.length <= 3) {
                        console.log(`  ✓ Found valid: ${fullTeam.map(u => u.name).join(', ')}`);
                      }
                    }
                  }
                }
              }
              if (checkedCount >= maxForSize) break;
            }
            
            // Try with Yordle
            for (const yordlePair of yordlePairs.slice(0, 10)) {
              if (checkedCount >= maxForSize) break;
              
              const usedUnitIds = new Set([...e1Group.map(u => u.id), ...e2Group.map(u => u.id), targonUnit.id, ...yordlePair.map(u => u.id)]);
              const teamUnits = uniqueUnits([...e1Group, ...e2Group, targonUnit, ...yordlePair]);
              
              if (teamUnits.length === size) {
                checkedCount++;
                const r1Req = (getRegionById(emblem1)?.requiredUnits || 1);
                const r2Req = (getRegionById(emblem2)?.requiredUnits || 1);
                const r1Count = teamUnits.filter(u => u.regions.includes(emblem1)).length;
                const r2Count = teamUnits.filter(u => u.regions.includes(emblem2)).length;
                if (r1Count + 1 < r1Req || r2Count + 1 < r2Req) continue;
                const carrier1 = teamUnits.find(u => !u.regions.includes(emblem1));
                const carrier2 = teamUnits.find(u => !u.regions.includes(emblem2));
                if (!carrier1 || !carrier2) continue;
                const { valid, activeRegions, emblemAssignments } = isValidComposition(teamUnits, emblem1, emblem2);
                if (valid) {
                  validCount++;
                  const compositionKey = teamUnits.map(u => u.id).sort().join(',');
                  if (!seenCompositions.has(compositionKey)) {
                    seenCompositions.add(compositionKey);
                    results.push({
                      composition: { units: teamUnits, emblemAssignments, activeRegions },
                      unitCount: teamUnits.length,
                      regionCount: activeRegions.length,
                    });
                    if (results.length <= 3) {
                      console.log(`  ✓ Found valid: ${teamUnits.map(u => u.name).join(', ')}`);
                    }
                  }
                }
              } else if (teamUnits.length < size) {
                const remainingUnits = filteredUnits.filter(u => !usedUnitIds.has(u.id));
                const remainingSlots = size - teamUnits.length;
                const fillCombos = generateCombinations(remainingUnits, remainingSlots, 50);
                for (const fillUnits of fillCombos) {
                  if (checkedCount >= maxForSize) break;
                  const fullTeam = uniqueUnits([...teamUnits, ...fillUnits]);
                  checkedCount++;
                  const r1Req = (getRegionById(emblem1)?.requiredUnits || 1);
                  const r2Req = (getRegionById(emblem2)?.requiredUnits || 1);
                  const r1Count = fullTeam.filter(u => u.regions.includes(emblem1)).length;
                  const r2Count = fullTeam.filter(u => u.regions.includes(emblem2)).length;
                  if (r1Count + 1 < r1Req || r2Count + 1 < r2Req) continue;
                  const carrier1 = fullTeam.find(u => !u.regions.includes(emblem1));
                  const carrier2 = fullTeam.find(u => !u.regions.includes(emblem2));
                  if (!carrier1 || !carrier2) continue;
                  const { valid, activeRegions, emblemAssignments } = isValidComposition(fullTeam, emblem1, emblem2);
                  if (valid) {
                    validCount++;
                    const compositionKey = fullTeam.map(u => u.id).sort().join(',');
                    if (!seenCompositions.has(compositionKey)) {
                      seenCompositions.add(compositionKey);
                      results.push({
                        composition: { units: fullTeam, emblemAssignments, activeRegions },
                        unitCount: fullTeam.length,
                        regionCount: activeRegions.length,
                      });
                      if (results.length <= 3) {
                        console.log(`  ✓ Found valid: ${fullTeam.map(u => u.name).join(', ')}`);
                      }
                    }
                  }
                }
              }
              if (checkedCount >= maxForSize) break;
            }
            
            // Try with Shadow Isles
            for (const shadowPair of shadowIslesPairs.slice(0, 10)) {
              if (checkedCount >= maxForSize) break;
              
              const usedUnitIds = new Set([...e1Group.map(u => u.id), ...e2Group.map(u => u.id), targonUnit.id, ...shadowPair.map(u => u.id)]);
              const teamUnits = uniqueUnits([...e1Group, ...e2Group, targonUnit, ...shadowPair]);
              
              if (teamUnits.length === size) {
                checkedCount++;
                const { valid, activeRegions, emblemAssignments } = isValidComposition(teamUnits, emblem1, emblem2);
                if (valid) {
                  validCount++;
                  const compositionKey = teamUnits.map(u => u.id).sort().join(',');
                  if (!seenCompositions.has(compositionKey)) {
                    seenCompositions.add(compositionKey);
                    results.push({
                      composition: { units: teamUnits, emblemAssignments, activeRegions },
                      unitCount: teamUnits.length,
                      regionCount: activeRegions.length,
                    });
                    if (results.length <= 3) {
                      console.log(`  ✓ Found valid: ${teamUnits.map(u => u.name).join(', ')}`);
                    }
                  }
                }
              } else if (teamUnits.length < size) {
                const remainingUnits = filteredUnits.filter(u => !usedUnitIds.has(u.id));
                const remainingSlots = size - teamUnits.length;
                const fillCombos = generateCombinations(remainingUnits, remainingSlots, 50);
                for (const fillUnits of fillCombos) {
                  if (checkedCount >= maxForSize) break;
                  const fullTeam = uniqueUnits([...teamUnits, ...fillUnits]);
                  checkedCount++;
                  const { valid, activeRegions, emblemAssignments } = isValidComposition(fullTeam, emblem1, emblem2);
                  if (valid) {
                    validCount++;
                    const compositionKey = fullTeam.map(u => u.id).sort().join(',');
                    if (!seenCompositions.has(compositionKey)) {
                      seenCompositions.add(compositionKey);
                      results.push({
                        composition: { units: fullTeam, emblemAssignments, activeRegions },
                        unitCount: fullTeam.length,
                        regionCount: activeRegions.length,
                      });
                      if (results.length <= 3) {
                        console.log(`  ✓ Found valid: ${fullTeam.map(u => u.name).join(', ')}`);
                      }
                    }
                  }
                }
              }
              if (checkedCount >= maxForSize) break;
            }
            
            // Try with Void
            for (const voidPair of voidPairs.slice(0, 10)) {
              if (checkedCount >= maxForSize) break;
              
              const usedUnitIds = new Set([...e1Group.map(u => u.id), ...e2Group.map(u => u.id), targonUnit.id, ...voidPair.map(u => u.id)]);
              const teamUnits = [...e1Group, ...e2Group, targonUnit, ...voidPair];
              
              if (teamUnits.length === size) {
                checkedCount++;
                const { valid, activeRegions, emblemAssignments } = isValidComposition(teamUnits, emblem1, emblem2);
                if (valid) {
                  validCount++;
                  const compositionKey = teamUnits.map(u => u.id).sort().join(',');
                  if (!seenCompositions.has(compositionKey)) {
                    seenCompositions.add(compositionKey);
                    results.push({
                      composition: { units: teamUnits, emblemAssignments, activeRegions },
                      unitCount: teamUnits.length,
                      regionCount: activeRegions.length,
                    });
                    if (results.length <= 3) {
                      console.log(`  ✓ Found valid: ${teamUnits.map(u => u.name).join(', ')}`);
                    }
                  }
                }
              } else if (teamUnits.length < size) {
                const remainingUnits = filteredUnits.filter(u => !usedUnitIds.has(u.id));
                const remainingSlots = size - teamUnits.length;
                const fillCombos = generateCombinations(remainingUnits, remainingSlots, 50);
                for (const fillUnits of fillCombos) {
                  if (checkedCount >= maxForSize) break;
                  const fullTeam = [...teamUnits, ...fillUnits];
                  checkedCount++;
                  const { valid, activeRegions, emblemAssignments } = isValidComposition(fullTeam, emblem1, emblem2);
                  if (valid) {
                    validCount++;
                    const compositionKey = fullTeam.map(u => u.id).sort().join(',');
                    if (!seenCompositions.has(compositionKey)) {
                      seenCompositions.add(compositionKey);
                      results.push({
                        composition: { units: fullTeam, emblemAssignments, activeRegions },
                        unitCount: fullTeam.length,
                        regionCount: activeRegions.length,
                      });
                      if (results.length <= 3) {
                        console.log(`  ✓ Found valid: ${fullTeam.map(u => u.name).join(', ')}`);
                      }
                    }
                  }
                }
              }
              if (checkedCount >= maxForSize) break;
            }
            
            if (checkedCount >= maxForSize) break;
          }
          if (checkedCount >= maxForSize) break;
        }
        if (checkedCount >= maxForSize) break;
      }
      
      console.log(`  Smart search: checked ${checkedCount}, found ${validCount} valid`);
    }
    
    // Fall back to brute force if smart search didn't find enough
    if (results.length < 10) {
      const combinationGenerator = generateCombinations(filteredUnits, size, maxForSize - checkedCount);
      
      for (const teamUnits of combinationGenerator) {
      checkedCount++;
      if (results.length >= MAX_TOTAL_RESULTS) break;
      
      // Early check: if we've checked too many, skip to next size
      if (checkedCount > maxForSize) break;
      
      const { valid, activeRegions, emblemAssignments } = isValidComposition(
        teamUnits,
        emblem1,
        emblem2
      );
      
      if (valid) {
        validCount++;
        // Create a unique key for this composition (sorted unit IDs)
        const compositionKey = teamUnits
          .map(u => u.id)
          .sort()
          .join(',');
        
        // Avoid duplicates
        if (!seenCompositions.has(compositionKey)) {
          seenCompositions.add(compositionKey);
          
          const composition: TeamComposition = {
            units: teamUnits,
            emblemAssignments,
            activeRegions,
          };
          
          results.push({
            composition,
            unitCount: teamUnits.length,
            regionCount: activeRegions.length,
            totalCost: teamUnits.reduce((sum, u) => sum + u.cost, 0),
          });
          
          if (results.length <= 5) {
            console.log(`  ✓ Valid composition #${results.length}:`, {
              units: teamUnits.map(u => u.name),
              activeRegions,
              unitCount: teamUnits.length
            });
          }
        }
      } else {
        invalidCount++;
        if (invalidCount <= 3) {
          // Get detailed info about why it's invalid - recreate the validation to see final counts
          const testRegionCounts = countRegionUnits(teamUnits);
          const testEmblem1Count = testRegionCounts.get(emblem1) || 0;
          const testEmblem2Count = testRegionCounts.get(emblem2) || 0;
          
          // Simulate emblem assignment
          const testUnitForEmblem1 = teamUnits.find(u => !u.regions.includes(emblem1));
          const testUnitForEmblem2 = teamUnits.find(u => !u.regions.includes(emblem2) && u.id !== testUnitForEmblem1?.id);
          
          if (testUnitForEmblem1) {
            testRegionCounts.set(emblem1, testEmblem1Count + 1);
          }
          if (testUnitForEmblem2) {
            testRegionCounts.set(emblem2, testEmblem2Count + 1);
          }
          
          // Check what would be active
          const testActive: string[] = [];
          const allTestRegions = new Set(testRegionCounts.keys());
          allTestRegions.add(emblem1);
          allTestRegions.add(emblem2);
          
          for (const regionId of allTestRegions) {
            const count = testRegionCounts.get(regionId) || 0;
            const region = getRegionById(regionId);
            const req = region?.requiredUnits ?? 0;
            if (region && count >= req) {
              testActive.push(regionId);
            }
          }
          
          console.log(`  ✗ Invalid #${invalidCount}:`, {
            units: teamUnits.map(u => `${u.name} [${u.regions.join(',')}]`),
            finalCounts: Array.from(testRegionCounts.entries())
              .map(([r, c]) => {
                const reg = getRegionById(r);
                const req = reg?.requiredUnits || 0;
                const active = c >= req ? '✓' : '✗';
                return `${r}:${c}/${req}${active}`;
              })
              .join(', '),
            activeAfterEmblems: testActive.length,
            activeRegions: testActive,
            reason: `Only ${testActive.length} active regions (need 4)`
          });
        }
      }
      
      // Log progress every 1000 checks
      if (checkedCount % 1000 === 0) {
        console.log(`  Checked ${checkedCount} combinations, found ${validCount} valid`);
      }
      }
    }
    
    console.log(`Size ${size} complete: checked ${checkedCount}, valid ${validCount}, total results ${results.length}`);
    
    // Update debug display if available
    if (typeof document !== 'undefined') {
      const debugEl = document.getElementById('solver-debug');
      if (debugEl) {
        debugEl.textContent = `Size ${size}: checked ${checkedCount}, valid ${validCount}, total ${results.length}`;
      }
    }
  }
  
  // Sort by unit count (ascending) then by region count (descending)
  results.sort((a, b) => {
    if (a.unitCount !== b.unitCount) {
      return a.unitCount - b.unitCount;
    }
    const aCost = a.totalCost ?? 0;
    const bCost = b.totalCost ?? 0;
    if (aCost !== bCost) {
      return aCost - bCost; // cheaper teams first
    }
    return b.regionCount - a.regionCount;
  });
  
  console.log('\n=== SOLVER COMPLETE ===');
  console.log('Total results:', results.length);
  if (results.length > 0) {
    console.log('First result:', {
      units: results[0].composition.units.map(u => u.name),
      activeRegions: results[0].composition.activeRegions,
      unitCount: results[0].unitCount
    });
  }
  
  return results;
}

