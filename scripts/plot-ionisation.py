"""Source-bound scientific figures. Missing energies are never zero or interpolated."""
import json, sys, hashlib
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.ticker import MaxNLocator

rows=json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
root=Path(sys.argv[2]); manifest=[]
styles={'EVALUATED-UNBRACKETED':('#123c69','o'),'THEORETICAL':('#8b3fb0','^'),'SEMIEMPIRICAL':('#b35b00','s')}
for item in rows:
    numeric=[r for r in item['entries'] if r['value'] is not None]
    receipt={k:item[k] for k in ('record_id','input','input_sha256')}
    receipt.update(numeric_points=len(numeric),source_ids=['SRC-000005'],chart=None,status='INSUFFICIENT DATA')
    if numeric:
        unexpected={r['status'] for r in numeric}-set(styles)
        if unexpected: raise ValueError(f'Unsupported source status: {unexpected}')
        if any(r['value']<=0 for r in numeric): raise ValueError('Nonpositive energy cannot be placed on log axis')
        plt.rcParams.update({'font.family':'DejaVu Sans','svg.fonttype':'none','svg.hashsalt':item['stem']})
        fig,ax=plt.subplots(figsize=(10,6.8));fig.set_facecolor('#f6fbff');ax.set_facecolor('white')
        for status,(color,marker) in styles.items():
            group=[r for r in numeric if r['status']==status]
            if not group: continue
            ax.scatter([r['q'] for r in group],[r['value'] for r in group],c=color,marker=marker,label=status.capitalize(),s=26,zorder=3)
            known=[r for r in group if r['uncertainty'] is not None and 0<=r['uncertainty']<r['value']]
            if known: ax.errorbar([r['q'] for r in known],[r['value'] for r in known],yerr=[r['uncertainty'] for r in known],fmt='none',ecolor=color,capsize=2,linewidth=.7)
        missing=sorted(set(range(item['z']))-{r['q'] for r in numeric})
        if missing: ax.scatter(missing,[-.095]*len(missing),transform=ax.get_xaxis_transform(),clip_on=False,marker='x',c='#777777',s=16,label='Missing energy (below axis)')
        ax.set_yscale('log');ax.set_xlim(-.5,max(.5,item['z']-.5));ax.xaxis.set_major_locator(MaxNLocator(integer=True,nbins=12))
        ax.set_ylim(min(r['value'] for r in numeric)*.7,max(r['value'] for r in numeric)*1.5)
        if item['z']==1: ax.set_xticks([0])
        ax.set_xlabel('Initial ionic charge q / elementary charge',labelpad=30 if missing else 4);ax.set_ylabel('Ionisation energy / eV (logarithmic scale)')
        ax.set_title(item['stem'].split('-',1)[1].replace('-',' · ')+' — ionisation ladder',loc='left',fontsize=17,pad=18)
        ax.grid(True,which='major',alpha=.2);ax.legend(loc='best',fontsize=9)
        fig.text(.09,.08,'Isolated ground-state atom/ion: q → q + 1. Points are discrete thresholds; no interpolation.',fontsize=9)
        fig.text(.09,.055,'Source: NIST ASD 5.12 • SRC-000005 • snapshot 2026-09-14. Error bars: reported uncertainty.',fontsize=9)
        fig.text(.09,.03,'Small error bars may be hidden by markers. Unknown uncertainty is not zero. Not an emission spectrum.',fontsize=9)
        fig.subplots_adjust(left=.1,right=.97,bottom=.26 if missing else .2,top=.89)
        rel=f"records/{item['stem']}/graphs/{item['stem']}-GRAPH-NIST-Ionisation-Ladder.svg"
        path=root/rel;path.parent.mkdir(parents=True,exist_ok=True)
        fig.savefig(path,metadata={'Date':None,'Creator':'MAT plot-ionisation.py; matplotlib '+matplotlib.__version__})
        # Normalise our generated SVG, not the retained scientific source bytes.
        path.write_bytes(('\n'.join(line.rstrip() for line in path.read_text(encoding='utf-8').splitlines())+'\n').encode('utf-8'))
        if item['z'] in (1,13,92,110): fig.savefig(root/f".mat-local/ionisation-preview-{item['z']}.png",dpi=130)
        plt.close(fig)
        receipt.update(chart=rel,sha256=hashlib.sha256(path.read_bytes()).hexdigest(),status='GENERATED-DATA-CHART',missing_energies=len(missing),uncertainty_not_drawn=sum(r['uncertainty'] is None or r['uncertainty']>=r['value'] for r in numeric))
    manifest.append(receipt)
out={'schema_version':'1.0.0','generator':'scripts/plot-ionisation.py','matplotlib_version':matplotlib.__version__,'scope':'Supplemental quantitative charts; do not count as A/B poster panels or emission spectra.','elements':manifest}
(root/'data/quality/ionisation-chart-manifest.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf-8',newline='\n')
print(f"Generated {sum(bool(r['chart']) for r in manifest)} distinct ionisation charts; {sum(not r['chart'] for r in manifest)} elements explicitly lack numeric data.")
