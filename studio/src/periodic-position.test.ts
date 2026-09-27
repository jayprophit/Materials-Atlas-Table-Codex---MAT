import {describe,it,expect} from 'vitest';
import nav from '../../data/navigation/periodic-table.json';
import {periodicPosition} from './periodic-position';
describe('canonical periodic navigation',()=>{it('places every recognised identity exactly once without cell collisions',()=>{
expect(nav.elements).toHaveLength(118);const cells=nav.elements.map(periodicPosition);expect(cells.every(Boolean)).toBe(true);expect(new Set(cells.map(String)).size).toBe(118);
expect(periodicPosition(nav.elements[1])).toEqual([1,18]);expect(periodicPosition(nav.elements[56])).toEqual([9,3]);expect(periodicPosition(nav.elements[88])).toEqual([10,3]);expect(periodicPosition(nav.elements[117])).toEqual([7,18]);
});});
