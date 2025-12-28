'use client';

import { TeamComposition } from '@/lib/types';
import { getRegionById } from '@/lib/data';
import UnitCard from './UnitCard';
import styles from './TeamBoard.module.css';

interface TeamBoardProps {
  composition: TeamComposition;
  boardSize?: number;
}

export default function TeamBoard({ composition, boardSize = 9 }: TeamBoardProps) {
  const { units, emblemAssignments, activeRegions } = composition;
  
  // Create a map of unit IDs to their emblem regions
  const emblemMap = new Map<string, string>();
  emblemAssignments.forEach(({ unitId, region }) => {
    emblemMap.set(unitId, region);
  });

  // Create grid cells (fill with units and empty slots)
  const cells: (typeof units[0] | null)[] = [];
  for (let i = 0; i < boardSize; i++) {
    cells.push(i < units.length ? units[i] : null);
  }

  // Calculate grid columns (3 columns for 9 slots, etc.)
  const cols = Math.ceil(Math.sqrt(boardSize));

  return (
    <div className={styles.container}>
      <div 
        className={styles.board}
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {cells.map((unit, index) => (
          <div key={index} className={styles.cell}>
            {unit ? (
              <UnitCard
                unit={unit}
                hasEmblem={emblemMap.has(unit.id)}
                emblemRegion={emblemMap.get(unit.id)}
              />
            ) : (
              <div className={styles.emptySlot} />
            )}
          </div>
        ))}
      </div>
      <div className={styles.summary}>
        <div className={styles.summaryItem}>
          <span className={styles.label}>Units:</span>
          <span className={styles.value}>{units.length}</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.label}>Active Regions:</span>
          <span className={styles.value}>{activeRegions.length}</span>
        </div>
        <div className={styles.regionsList}>
          {activeRegions.map((regionId) => {
            const region = getRegionById(regionId);
            return (
              <span
                key={regionId}
                className={styles.regionBadge}
                style={{ backgroundColor: region?.color || '#666' }}
              >
                {region?.name || regionId}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

