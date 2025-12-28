export interface Unit {
  id: string;
  name: string;
  cost: number;
  regions: string[];
  imageUrl?: string;
  unlockable?: boolean;
}

export interface Region {
  id: string;
  name: string;
  color?: string;
  requiredUnits?: number; // Number of units needed to activate this region trait
}

export interface TeamComposition {
  units: Unit[];
  emblemAssignments: { unitId: string; region: string }[];
  activeRegions: string[];
}

export interface SolverConfig {
  maxBoardSize: number;
  minUnits: number;
  maxUnits: number;
  requiredUnits?: string[];
  excludedUnits?: string[];
}

export interface SolverResult {
  composition: TeamComposition;
  unitCount: number;
  regionCount: number;
  totalCost?: number;
}

