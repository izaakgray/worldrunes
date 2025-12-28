'use client';

import { Unit } from '@/lib/types';
import { getRegionById } from '@/lib/data';
import styles from './UnitCard.module.css';

interface UnitCardProps {
  unit: Unit;
  hasEmblem?: boolean;
  emblemRegion?: string;
}

export default function UnitCard({ unit, hasEmblem, emblemRegion }: UnitCardProps) {
  const emblemRegionData = emblemRegion ? getRegionById(emblemRegion) : null;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.name}>{unit.name}</div>
        <div className={styles.cost}>Cost: {unit.cost}</div>
      </div>
      <div className={styles.regions}>
        {unit.regions.map((regionId) => {
          const region = getRegionById(regionId);
          return (
            <span
              key={regionId}
              className={styles.regionTag}
              style={{ backgroundColor: region?.color || '#666' }}
            >
              {region?.name || regionId}
            </span>
          );
        })}
        {hasEmblem && emblemRegionData && (
          <span
            className={`${styles.regionTag} ${styles.emblemTag}`}
            style={{ backgroundColor: emblemRegionData.color || '#666' }}
            title={`Emblem: ${emblemRegionData.name}`}
          >
            {emblemRegionData.name} ⭐
          </span>
        )}
      </div>
    </div>
  );
}

