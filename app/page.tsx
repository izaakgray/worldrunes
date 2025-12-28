'use client';

import { useState, useMemo } from 'react';
import EmblemSelector from '@/components/EmblemSelector';
import ResultsDisplay from '@/components/ResultsDisplay';
import UnitIcon from '@/components/UnitIcon';
import { solveWorldRunes } from '@/lib/solver';
import { SolverConfig, SolverResult } from '@/lib/types';
import { units } from '@/lib/data';
import styles from './page.module.css';

export default function Home() {
  const [emblem1, setEmblem1] = useState('');
  const [emblem2, setEmblem2] = useState('');
  const [unlockedIds, setUnlockedIds] = useState<string[]>([]);
  
  const toggleUnlocked = (id: string) => {
    setUnlockedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };
  
  // Fixed config - search from 5 to 8 units
  const config: SolverConfig = {
    maxBoardSize: 9,
    minUnits: 5,
    maxUnits: 8,
  };

  const results: SolverResult[] = useMemo(() => {
    console.log('useMemo triggered, emblem1:', emblem1, 'emblem2:', emblem2);
    
    if (!emblem1 || !emblem2) {
      console.log('Missing emblems, returning empty');
      return [];
    }
    
    console.log('Calling solveWorldRunes...');
    try {
      const result = solveWorldRunes(emblem1, emblem2, config);
      console.log('solveWorldRunes returned:', result.length, 'results');
      return result;
    } catch (error) {
      console.error('Error solving:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
      return [];
    }
  }, [emblem1, emblem2, config]);
  
  // Debug: log when results change
  console.log('Current results count:', results.length);

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>TFT World Runes Solver</h1>
          <p className={styles.subtitle}>
            Find all valid team compositions for &ldquo;The World Runes&rdquo; augment
          </p>
          <p className={styles.description}>
            Select two region emblems to find all combinations of units that activate 4 unique regions.
          </p>
        </header>

        <div className={styles.content}>
          <div className={styles.inputStack}>
            <div className={styles.emblemBlock}>
              <EmblemSelector
                emblem1={emblem1}
                emblem2={emblem2}
                onEmblem1Change={setEmblem1}
                onEmblem2Change={setEmblem2}
              />
            </div>
            <div className={`${styles.panel} ${styles.unlockPanel}`}>
              <div className={styles.panelTitle}>Unlocked Units</div>
              <div className={styles.unlockRows}>
                <div className={styles.unlockRow}>
                  <div className={styles.unlockRowLabel}>2 Cost</div>
                  <div className={styles.unlockRowGrid}>
                    {units.filter(u => u.unlockable && u.cost === 2).map((u) => {
                      const active = unlockedIds.includes(u.id);
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => toggleUnlocked(u.id)}
                          className={`${styles.unlockIcon} ${active ? styles.unlockOn : styles.unlockOff}`}
                          title={u.name}
                        >
                          <UnitIcon unit={u} size={25} />
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className={styles.unlockRow}>
                  <div className={styles.unlockRowLabel}>3 Cost</div>
                  <div className={styles.unlockRowGrid}>
                    {units.filter(u => u.unlockable && u.cost === 3).map((u) => {
                      const active = unlockedIds.includes(u.id);
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => toggleUnlocked(u.id)}
                          className={`${styles.unlockIcon} ${active ? styles.unlockOn : styles.unlockOff}`}
                          title={u.name}
                        >
                          <UnitIcon unit={u} size={25} />
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className={styles.unlockRow}>
                  <div className={styles.unlockRowLabel}>4 Cost</div>
                  <div className={styles.unlockRowGrid}>
                    {units.filter(u => u.unlockable && u.cost === 4).map((u) => {
                      const active = unlockedIds.includes(u.id);
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => toggleUnlocked(u.id)}
                          className={`${styles.unlockIcon} ${active ? styles.unlockOn : styles.unlockOff}`}
                          title={u.name}
                        >
                          <UnitIcon unit={u} size={25} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.resultsSection}>
            {emblem1 && emblem2 ? (
              <ResultsDisplay
                results={results}
                boardSize={config.maxBoardSize}
                unlockedIds={unlockedIds}
              />
            ) : (
              <div className={styles.placeholder}>
                <p>Select two region emblems to find valid team compositions</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

