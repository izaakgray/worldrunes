import { Unit, Region } from './types';
import regionsData from '../data/regions.json';
import unitsData from '../data/units.json';

export const regions: Region[] = regionsData as Region[];
export const units: Unit[] = unitsData as Unit[];

export function getRegionById(id: string): Region | undefined {
  return regions.find(r => r.id === id);
}

export function getUnitById(id: string): Unit | undefined {
  return units.find(u => u.id === id);
}

export function getUnitsByRegion(regionId: string): Unit[] {
  return units.filter(u => u.regions.includes(regionId));
}

export function getAllRegionIds(): string[] {
  return regions.map(r => r.id);
}

export function getUnitsByRegions(regionIds: string[]): Unit[] {
  return units.filter(u => u.regions.some(r => regionIds.includes(r)));
}

