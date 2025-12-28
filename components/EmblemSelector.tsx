'use client';

import { useState, useMemo } from 'react';
import { regions } from '@/lib/data';
import styles from './EmblemSelector.module.css';

interface EmblemSelectorProps {
  emblem1: string;
  emblem2: string;
  onEmblem1Change: (region: string) => void;
  onEmblem2Change: (region: string) => void;
}

const EMBLEM_REGIONS = regions.filter(r => r.id !== 'targon' && r.id !== 'shadow-isles');

const emblemSrc = (id: string) => `/data/emblems/tft16_item_${id}emblemitem.avif`;

export default function EmblemSelector({
  emblem1,
  emblem2,
  onEmblem1Change,
  onEmblem2Change,
}: EmblemSelectorProps) {
  const [open1, setOpen1] = useState(false);
  const [open2, setOpen2] = useState(false);
  const [search1, setSearch1] = useState('');
  const [search2, setSearch2] = useState('');

  const filtered1 = useMemo(() => {
    const term = search1.toLowerCase();
    return EMBLEM_REGIONS.filter(r => r.name.toLowerCase().includes(term));
  }, [search1]);

  const filtered2 = useMemo(() => {
    const term = search2.toLowerCase();
    return EMBLEM_REGIONS
      .filter(r => r.id !== emblem1) // exclude emblem1 selection
      .filter(r => r.name.toLowerCase().includes(term));
  }, [search2, emblem1]);

  const renderButton = (label: string, value: string, open: boolean, toggle: () => void) => {
    const region = EMBLEM_REGIONS.find(r => r.id === value);
    const disabled = label === 'Select Emblem 2' && !emblem1;
    return (
      <button
        type="button"
        className={`${styles.trigger} ${disabled ? styles.triggerDisabled : ''}`}
        onClick={() => {
          if (disabled) return;
          toggle();
        }}
      >
        {region ? (
          <>
            <img
              src={emblemSrc(region.id)}
              alt={region.name}
              className={styles.icon}
              onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
            />
            <span>{region.name}</span>
          </>
        ) : (
          <span className={styles.placeholderText}>{label}</span>
        )}
        <span className={styles.caret}>{open ? '▲' : '▼'}</span>
      </button>
    );
  };

  const renderMenu = (
    list: typeof EMBLEM_REGIONS,
    searchValue: string,
    onSearchChange: (v: string) => void,
    onSelect: (id: string) => void,
    close: () => void
  ) => (
    <div className={styles.menu}>
      <div className={styles.searchRow}>
        <input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search…"
        />
      </div>
      {list.map((region) => (
        <button
          key={region.id}
          type="button"
          className={styles.menuItem}
          onClick={() => {
            onSelect(region.id);
            close();
          }}
        >
          <img
            src={emblemSrc(region.id)}
            alt={region.name}
            className={styles.icon}
            onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
          />
          <span>{region.name}</span>
        </button>
      ))}
    </div>
  );

  return (
    <div className={styles.container}>
      <div className={styles.selector}>
        <label>Emblem 1</label>
        {renderButton('Select Emblem 1', emblem1, open1, () => setOpen1((v) => !v))}
        {open1 && renderMenu(filtered1, search1, setSearch1, onEmblem1Change, () => setOpen1(false))}
      </div>
      <div className={styles.selector}>
        <label>Emblem 2</label>
        {renderButton('Select Emblem 2', emblem2, open2, () => setOpen2((v) => !v))}
        {open2 && emblem1 && renderMenu(filtered2, search2, setSearch2, onEmblem2Change, () => setOpen2(false))}
      </div>
    </div>
  );
}

