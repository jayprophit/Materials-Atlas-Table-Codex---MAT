// Display-only placement: canonical prose and data are never rewritten.
export function prepareInlinePanels(body:string,path:string){
 if(path!=='records/0001-Hydrogen-H/0001-Hydrogen-H.md')return body;
 const placements:Record<string,string[]>={
 '# 1. Elemental Identity':['A01','B02'],
 '## 11.1 Ground State':['A02','B04'],
 '# 17. Molecular Hydrogen — H₂':['A03','B03'],
 '# 7. Complete Evaluated Isotope Branch':['A04','B05'],
 '# 15. Electronic Spectrum':['A05','B06'],
 '## Source-bound water molecular geometry':['A06'],
 '# 10. Fusion Relationship Branch':['A07'],
 '## 38.4 Fuel-Cell Conversion':['A08'],
 '# 20. Phase Branch':['B01','A09','B07'],
 '# 40. Frequency / Field Response Engine':['B08'],
 '# 53. Hydrogen State Cloud':['B09','B10','B11'],
 '# 52. Primary Hydrogen Relationship Vector':['B12'],
 '# 55. Current Record Status':['B13']};
 let text=body.replace(/```html\s*\n(?:(?!```)[\s\S])*MAT-VISUAL:(?:(?!```)[\s\S])*```/g,'Image placeholders are displayed with their corresponding subject sections.');
 for(const [heading,panels]of Object.entries(placements)){if(!text.includes(heading+'\n'))continue;text=text.replace(heading+'\n',heading+'\n\n```mat-panels\n'+panels.join(' ')+'\n```\n');}return text;
}
