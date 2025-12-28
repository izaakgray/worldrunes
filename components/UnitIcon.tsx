'use client';

import { Unit } from '@/lib/types';
import { getRegionById } from '@/lib/data';
import styles from './UnitIcon.module.css';

interface UnitIconProps {
  unit: Unit;
  hasEmblem?: boolean;
  emblemRegion?: string;
  size?: number; // override size in px
}

export default function UnitIcon({ unit, hasEmblem, emblemRegion, size }: UnitIconProps) {
  const emblemRegionData = emblemRegion ? getRegionById(emblemRegion) : null;
  const primaryRegion = unit.regions[0] ? getRegionById(unit.regions[0]) : null;
  const slug = unit.name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const iconSrc = `/data/units/tft16_${slug}.avif`;
  const costClass = unit.cost === 1 ? 'cost1' : unit.cost === 2 ? 'cost2' : unit.cost === 3 ? 'cost3' : 'cost4';
  const emblemRing = hasEmblem && emblemRegionData ? `0 0 0 2px ${emblemRegionData.color}` : undefined;
  const costColors: Record<number, string> = { 1: '#b0b0b0', 2: '#34d399', 3: '#60a5fa', 4: '#f472b6' };
  const finalSize = size ?? 40;
  const radius = Math.round(finalSize * 0.2);

  const splitIds = new Set(['aphelios', 'leona', 'zoe', 'taric']);
  const isSplit = splitIds.has(unit.id);
  const targonQuad = isSplit;
  const quadIcons = [
    { id: 'aphelios', src: `/data/units/tft16_aphelios.avif` },
    { id: 'leona', src: `/data/units/tft16_leona.avif` },
    { id: 'zoe', src: `/data/units/tft16_zoe.avif` },
    { id: 'taric', src: `/data/units/tft16_taric.avif` },
  ];
  const apheliosSlug = 'aphelios';
  const apheliosSrc = `/data/units/tft16_${apheliosSlug}.avif`;
  const apheliosCostColor = costColors[2];
  const leonaSlug = 'leona';
  const leonaSrc = `/data/units/tft16_${leonaSlug}.avif`;
  const leonaCostColor = costColors[3];

  const baseVars = {
    ['--iconSize' as any]: `${finalSize}px`,
    ['--iconRadius' as any]: `${radius}px`,
  };

  return (
    <div
      className={`${styles.icon} ${isSplit ? styles.split : styles[costClass]}`}
      style={
        isSplit
          ? {
              ...baseVars,
              ['--splitA' as any]: apheliosCostColor,
              ['--splitB' as any]: leonaCostColor,
              boxShadow: emblemRing,
            }
          : {
              ...baseVars,
              backgroundColor: primaryRegion?.color || '#666',
              boxShadow: emblemRing,
            }
      }
      title={`${unit.name} (${unit.regions.map(r => getRegionById(r)?.name || r).join(', ')})${hasEmblem ? ` + ${emblemRegionData?.name} Emblem` : ''}`}
    >
      <div className={`${styles.portrait} ${isSplit ? styles.splitPortrait : ''}`}>
        {targonQuad ? (
          <>
            <img
              src={quadIcons[0].src}
              alt="Aphelios"
              loading="lazy"
              className={`${styles.quad} ${styles.quadTL}`}
              onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
            />
            <img
              src={quadIcons[1].src}
              alt="Leona"
              loading="lazy"
              className={`${styles.quad} ${styles.quadTR}`}
              onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
            />
            <img
              src={quadIcons[2].src}
              alt="Zoe"
              loading="lazy"
              className={`${styles.quad} ${styles.quadBL}`}
              onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
            />
            <img
              src={quadIcons[3].src}
              alt="Taric"
              loading="lazy"
              className={`${styles.quad} ${styles.quadBR}`}
              onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
            />
          </>
        ) : (
          <img
            src={iconSrc}
            alt={unit.name}
            loading="lazy"
            className={styles.single}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        )}
      </div>
      <div className={styles.name}>{unit.name}</div>
    </div>
  );
}

