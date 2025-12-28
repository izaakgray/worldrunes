'use client';

import { SolverConfig } from '@/lib/types';
import styles from './ConfigPanel.module.css';

interface ConfigPanelProps {
  config: SolverConfig;
  onConfigChange: (config: SolverConfig) => void;
}

export default function ConfigPanel({ config, onConfigChange }: ConfigPanelProps) {
  const updateConfig = (updates: Partial<SolverConfig>) => {
    onConfigChange({ ...config, ...updates });
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Configuration</h3>
      <div className={styles.grid}>
        <div className={styles.field}>
          <label htmlFor="minUnits">Min Units:</label>
          <input
            id="minUnits"
            type="number"
            min="1"
            max={config.maxBoardSize}
            value={config.minUnits}
            onChange={(e) => updateConfig({ minUnits: parseInt(e.target.value) || 5 })}
            className={styles.input}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="maxUnits">Max Units:</label>
          <input
            id="maxUnits"
            type="number"
            min={config.minUnits}
            max={config.maxBoardSize}
            value={config.maxUnits}
            onChange={(e) => {
              const value = parseInt(e.target.value) || config.maxBoardSize;
              const safeValue = Math.min(value, config.maxBoardSize);
              updateConfig({ maxUnits: safeValue });
            }}
            className={styles.input}
          />
          {config.maxUnits > 6 && (
            <span className={styles.warning}>
              ⚠️ Large values may be slow
            </span>
          )}
        </div>
        <div className={styles.field}>
          <label htmlFor="maxBoardSize">Max Board Size:</label>
          <input
            id="maxBoardSize"
            type="number"
            min="4"
            max="10"
            value={config.maxBoardSize}
            onChange={(e) => updateConfig({ maxBoardSize: parseInt(e.target.value) || 9 })}
            className={styles.input}
          />
        </div>
      </div>
    </div>
  );
}

