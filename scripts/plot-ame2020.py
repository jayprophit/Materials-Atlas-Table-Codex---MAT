"""Plot published AME values; no fitting, interpolation or invented error bars."""
import json, sys, hashlib
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.ticker import MaxNLocator

items=json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
root=Path(sys.argv[2]); receipts=[]
for item in items:
    points=[r for r in item['entries'] if r['value'] is not None]
    if not points: raise ValueError('No numeric binding values for '+item['record_id'])
    plt.rcParams.update({'font.family':'DejaVu Sans','svg.fonttype':'none','svg.hashsalt':item['stem']+'AME2020'})
    fig,ax=plt.subplots(figsize=(10,6.6));fig.set_facecolor('#f6fbff');ax.set_facecolor('white')
    for estimate,color,marker,label in [(False,'#153f68','o','Evaluated'),(True,'#b16600','^','Estimated (# in source)')]:
        group=[r for r in points if r['estimated']==estimate]
        if not group: continue
        ax.scatter([r['A'] for r in group],[r['value'] for r in group],color=color,marker=marker,s=33,label=label,zorder=3)
        known=[r for r in group if r['uncertainty'] is not None]
        if known: ax.errorbar([r['A'] for r in known],[r['value'] for r in known],yerr=[r['uncertainty'] for r in known],fmt='none',ecolor=color,capsize=2,linewidth=.8)
    ax.set_xlim(min(r['A'] for r in points)-.5,max(r['A'] for r in points)+.5)
    ax.xaxis.set_major_locator(MaxNLocator(integer=True,nbins=10));ax.set_xlabel('Mass number A')
    ax.set_ylabel('AME binding energy per nucleon / keV')
    ax.set_title(item['stem'].split('-',1)[1].replace('-',' · ')+' — binding energy per nucleon',loc='left',fontsize=16,pad=16)
    ax.grid(alpha=.2);ax.legend(loc='best',fontsize=9)
    fig.text(.1,.095,'AME2020 • SRC-000304 • Ground-state atomic-mass convention; discrete isotope values.',fontsize=9)
    fig.text(.1,.065,'Error bars: source-reported uncertainty. Small bars may be hidden; missing uncertainty is not zero.',fontsize=9)
    fig.text(.1,.035,'No interpolation or abundance weighting. Evaluated/estimated energy does not establish observed decay.',fontsize=9)
    fig.subplots_adjust(left=.11,right=.97,bottom=.21,top=.89)
    path=root/item['chart'];path.parent.mkdir(parents=True,exist_ok=True)
    fig.savefig(path,metadata={'Date':None,'Creator':'MAT plot-ame2020.py; matplotlib '+matplotlib.__version__})
    path.write_bytes(('\n'.join(line.rstrip() for line in path.read_text(encoding='utf-8').splitlines())+'\n').encode('utf-8'))
    if item['z'] in (1,13,92,118): fig.savefig(root/f".mat-local/ame2020-preview-{item['z']}.png",dpi=130)
    plt.close(fig)
    receipts.append({k:item[k] for k in ('record_id','input','input_sha256','chart')}|{'numeric_points':len(points),'estimated_points':sum(r['estimated'] for r in points),'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'source_ids':['SRC-000304'],'status':'GENERATED-DATA-CHART'})
out={'schema_version':'1.0.0','generator':'scripts/plot-ame2020.py','matplotlib_version':matplotlib.__version__,'scope':'Supplemental quantitative charts; excluded from the 22 standalone illustrative panel count.','elements':receipts}
(root/'data/quality/ame2020-chart-manifest.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf-8',newline='\n')
print(f'Generated {len(receipts)} source-bound AME binding-energy charts.')
