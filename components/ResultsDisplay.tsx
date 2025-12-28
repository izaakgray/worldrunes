'use client';

import { SolverResult, Unit } from '@/lib/types';
import { getRegionById } from '@/lib/data';
import UnitIcon from './UnitIcon';
import styles from './ResultsDisplay.module.css';

interface ResultsDisplayProps {
  results: SolverResult[];
  boardSize: number;
  unlockedIds?: string[];
}

export default function ResultsDisplay({ results, boardSize, unlockedIds }: ResultsDisplayProps) {
  if (results.length === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>🔍</div>
        <p>No valid combinations found.</p>
        <p className={styles.emptyHint}>
          Try adjusting your configuration or selecting different emblems.
        </p>
      </div>
    );
  }

  // Apply filters
  let filtered = [...results];
  const unlockedSet = new Set(unlockedIds || []);
  filtered = filtered.filter(r => !r.composition.units.some(u => u.unlockable && !unlockedSet.has(u.id)));

  // Deduplicate by unit set (ignore emblem placements)
  const dedupMap = new Map<string, SolverResult>();
  const targonSet = new Set(['aphelios', 'leona', 'zoe', 'taric']);
  const normalizeId = (id: string) => (targonSet.has(id) ? 'targon-1of4' : id);
  const unitSignature = (r: SolverResult) =>
    r.composition.units
      .map((u) => normalizeId(u.id))
      .sort()
      .join('|');
  for (const r of filtered) {
    const sig = unitSignature(r);
    if (!dedupMap.has(sig)) {
      dedupMap.set(sig, r);
    }
  }
  filtered = Array.from(dedupMap.values());
  
  // Compare minimal unit counts with and without unlockable filter
  const minimalAll = results.length ? Math.min(...results.map(r => r.unitCount)) : 0;
  const minimalFiltered = filtered.length ? Math.min(...filtered.map(r => r.unitCount)) : 0;
  const filteredHasHigherMin = minimalFiltered > minimalAll;

  // Identify which unlockables would enable the lower team size (from the best-all result)
  let unlockSuggestions: Unit[] = [];
  const minimalAllResults = results.filter(r => r.unitCount === minimalAll);

  if (filteredHasHigherMin && minimalAllResults.length) {
    // Pick the minimal-all result that requires the fewest locked units, to avoid suggesting unnecessary unlocks
    const sortedByLocked = [...minimalAllResults].sort((a, b) => {
      const aLocked = a.composition.units.filter(u => u.unlockable && !unlockedSet.has(u.id)).length;
      const bLocked = b.composition.units.filter(u => u.unlockable && !unlockedSet.has(u.id)).length;
      return aLocked - bLocked;
    });
    const bestForUnlocks = sortedByLocked[0];
    const lockedNeeded = bestForUnlocks.composition.units.filter(u => u.unlockable && !unlockedSet.has(u.id));
    const seen = new Set<string>();
    unlockSuggestions = lockedNeeded.filter(u => {
      if (seen.has(u.id)) return false;
      seen.add(u.id);
      return true;
    });
  }

  if (filtered.length === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>🤔</div>
        <p>No results match the current filters.</p>
      </div>
    );
  }

  const getTotalCost = (r: SolverResult) =>
    r.totalCost ??
    r.composition.units.reduce((sum, u) => sum + (u.cost || 0), 0);

  const getFourCostCount = (r: SolverResult) =>
    r.composition.units.filter(u => u.cost === 4).length;

  const signatureHash = (r: SolverResult) => {
    const sig = r.composition.units
      .map(u => u.id)
      .sort()
      .join('|');
    let hash = 0;
    for (let i = 0; i < sig.length; i++) {
      hash = (hash * 31 + sig.charCodeAt(i)) >>> 0;
    }
    return hash;
  };

  const unitIdSet = (r: SolverResult) => new Set(r.composition.units.map(u => u.id));
  const symmetricDiffSize = (a: Set<string>, b: Set<string>) => {
    let common = 0;
    for (const v of a) {
      if (b.has(v)) common++;
    }
    return a.size + b.size - 2 * common;
  };

  // Base sort: lowest units, then lowest total cost, then fewer 4-cost units
  const baseSorted = filtered.sort((a, b) => {
    if (a.unitCount !== b.unitCount) return a.unitCount - b.unitCount;

    const aCost = getTotalCost(a);
    const bCost = getTotalCost(b);
    if (aCost !== bCost) return aCost - bCost;

    const aFour = getFourCostCount(a);
    const bFour = getFourCostCount(b);
    if (aFour !== bFour) return aFour - bFour;

    // stable tie-break
    return signatureHash(a) - signatureHash(b);
  });

  // Within groups of same unitCount and totalCost (and 4-cost count), order to maximize difference from previous
  const regrouped: SolverResult[] = [];
  let i = 0;
  while (i < baseSorted.length) {
    const current = baseSorted[i];
    const keyUnit = current.unitCount;
    const keyCost = getTotalCost(current);
    const keyFour = getFourCostCount(current);
    const group: SolverResult[] = [];
    while (
      i < baseSorted.length &&
      baseSorted[i].unitCount === keyUnit &&
      getTotalCost(baseSorted[i]) === keyCost &&
      getFourCostCount(baseSorted[i]) === keyFour
    ) {
      group.push(baseSorted[i]);
      i++;
    }

    if (group.length <= 1) {
      regrouped.push(...group);
      continue;
    }

    // Greedy reordering for diversity
    const remaining = [...group];
    // start with the lowest hash for determinism
    remaining.sort((a, b) => signatureHash(a) - signatureHash(b));
    const ordered: SolverResult[] = [];
    ordered.push(remaining.shift() as SolverResult);
    while (remaining.length) {
      const prevSet = unitIdSet(ordered[ordered.length - 1]);
      let bestIdx = 0;
      let bestDiff = -1;
      for (let k = 0; k < remaining.length; k++) {
        const diff = symmetricDiffSize(prevSet, unitIdSet(remaining[k]));
        if (diff > bestDiff) {
          bestDiff = diff;
          bestIdx = k;
        }
      }
      ordered.push(remaining.splice(bestIdx, 1)[0]);
    }
    regrouped.push(...ordered);
  }

  const sortedResults = regrouped;

  const minimalUnitCount = sortedResults[0]?.unitCount ?? 0;

  return (
    <div className={styles.container}>
      {filteredHasHigherMin && unlockSuggestions.length > 0 && (
        <div className={styles.notice}>
          <div className={styles.noticeRow}>
            <span className={styles.noticeText}>
              Lowest team size with current unlocks: {minimalFiltered}. Unlock to reach {minimalAll}:
            </span>
            <div className={styles.unlockIcons}>
              {unlockSuggestions.map((u) => (
                <UnitIcon key={u.id} unit={u} size={32} />
              ))}
            </div>
          </div>
        </div>
      )}

      <div className={styles.section}>
        <div className={styles.tableWrapper}>
          {renderTable(sortedResults, boardSize, 1)}
        </div>
      </div>
    </div>
  );
}

function renderTable(results: SolverResult[], boardSize: number, startIndex: number) {
  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>Units</th>
          <th>Regions</th>
        </tr>
      </thead>
      <tbody>
        {results.map((result, idx) => {
          const { units, emblemAssignments, activeRegions } = result.composition;
          const sortedUnits = [...units].sort((a, b) => {
            if (a.cost !== b.cost) return a.cost - b.cost;
            return a.name.localeCompare(b.name);
          });
          const emblemMap = new Map<string, string>();
          emblemAssignments.forEach(({ unitId, region }) => {
            emblemMap.set(unitId, region);
          });

          const regionCounts = new Map<string, number>();
          sortedUnits.forEach((u) => u.regions.forEach((r) => regionCounts.set(r, (regionCounts.get(r) || 0) + 1)));
          emblemAssignments.forEach(({ region }) => {
            regionCounts.set(region, (regionCounts.get(region) || 0) + 1);
          });
          // Only show active regions (meeting requiredUnits)
          const activeRegionBadges = Array.from(regionCounts.entries())
            .filter(([regionId, count]) => {
              const region = getRegionById(regionId);
              const req = region?.requiredUnits || 1;
              return count >= req;
            });

          return (
            <tr key={idx}>
              <td className={styles.unitsCell}>
                <div className={styles.unitsRow}>
                  {sortedUnits.map((unit) => (
                    <UnitIcon
                      key={unit.id}
                      unit={unit}
                      size={50}
                      hasEmblem={emblemMap.has(unit.id)}
                      emblemRegion={emblemMap.get(unit.id)}
                    />
                  ))}
                </div>
              </td>
              <td className={styles.regionsCell}>
                <div className={styles.regionsList}>
                  {activeRegionBadges.map(([regionId, count]) => {
                    const region = getRegionById(regionId);
                    const iconSrc = `/data/traits/${regionId}.png`;
                    return (
                      <span
                        key={regionId}
                        className={styles.regionBadge}
                        title={`${region?.name || regionId}: ${count}`}
                      >
                        <img
                          src={iconSrc}
                          alt={region?.name || regionId}
                          className={styles.traitIcon}
                          onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                        />
                        <span className={styles.regionLabel}>
                          {region?.name || regionId} {count}/{region?.requiredUnits || ''}
                        </span>
                      </span>
                    );
                  })}
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

