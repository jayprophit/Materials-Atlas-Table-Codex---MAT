import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {prepareInlinePanels} from './inline-panels';
describe('inline scientific section placements',()=>{it('preserves canonical prose while assigning all 22 Hydrogen slots once',()=>{
 const path='records/0001-Hydrogen-H/0001-Hydrogen-H.md';const body=readFileSync('../'+path,'utf8').replace(/\r\n/g,'\n');const output=prepareInlinePanels(body,path);const slots=[...output.matchAll(/```mat-panels\n([^`]+)```/g)].flatMap(m=>m[1].trim().split(/\s+/));expect(slots).toHaveLength(22);expect(new Set(slots).size).toBe(22);expect(output).toContain('## Source-bound water molecular geometry\n\n```mat-panels\nA06');expect(output).toContain('SRC-000308');expect(body).not.toContain('```mat-panels');
});it('leaves other canonical text unchanged',()=>{expect(prepareInlinePanels('text UNKNOWN','records/0013-Aluminium-Al/0013-Aluminium-Al.md')).toBe('text UNKNOWN')})});
