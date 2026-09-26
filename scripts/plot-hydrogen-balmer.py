"""A deterministic line-position figure, not a measured intensity spectrum."""
import json, sys, hashlib
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.ticker import ScalarFormatter
root=Path(sys.argv[1]); data=json.loads(Path(sys.argv[2]).read_text(encoding='utf-8'))
plt.rcParams.update({'font.family':'DejaVu Sans','svg.fonttype':'none','svg.hashsalt':'MAT-H-BALMER-AIR'})
fig=plt.figure(figsize=(11,7.4));fig.set_facecolor('#f6fbff')
grid=fig.add_gridspec(2,2,hspace=.58,wspace=.3)
top=fig.add_subplot(grid[0,:]); beta=fig.add_subplot(grid[1,0]); alpha=fig.add_subplot(grid[1,1])
colours={'delta':'#794bc4','gamma':'#354dc4','beta':'#1386ab','alpha':'#c9344a'}
entries=data['entries']
for ax, subset, bounds, title in [
(top,entries,(400,700),'Selected visible H I entries'),
(beta,[e for e in entries if e['member']=='beta'],(486.115,486.145),'H-beta: three selected entries'),
(alpha,[e for e in entries if e['member']=='alpha'],(656.260,656.295),'H-alpha: three selected entries')]:
    ax.set_facecolor('white')
    for e in subset: ax.vlines(e['wavelength']['value'],0,1,color=colours[e['member']],linewidth=1.8)
    ax.set_xlim(*bounds);ax.set_ylim(0,1.7);ax.set_yticks([]);ax.set_xlabel('Air wavelength / nm')
    ax.set_title(title,loc='left',fontsize=12);ax.grid(axis='x',alpha=.15)
    ax.ticklabel_format(useOffset=False,style='plain',axis='x')
    if ax is top:
        for member,label,y,dx in [('delta','Hδ 410.2',1.5,0),('gamma','Hγ 434.0',1.18,8),('beta','Hβ 486.1',1.5,0),('alpha','Hα 656.3',1.5,0)]:
            x=next(e['wavelength']['value'] for e in entries if e['member']==member)
            ax.annotate(label,(x,1),xytext=(x+dx,y),ha='center',fontsize=10,arrowprops={'arrowstyle':'-','color':colours[member]})
    else:
        for i,e in enumerate(subset):
            x=e['wavelength']['value'];ax.annotate(f"{x:.5f}",(x,1),xytext=(x,1.25+i%2*.26),ha='center',fontsize=9,arrowprops={'arrowstyle':'-','color':'#53667d'})
fig.suptitle('Hydrogen · Balmer air-wavelength reference',x=.075,ha='left',fontsize=18)
fig.text(.075,.07,'NIST Handbook • SRC-000305 • Equal stick heights locate wavelengths; they are not intensities.',fontsize=10)
fig.text(.075,.035,'Source uncertainty: UNKNOWN. No vacuum conversion, line-width model or component averaging.',fontsize=10)
fig.subplots_adjust(left=.075,right=.97,top=.87,bottom=.18)
path=root/data['chart'];fig.savefig(path,metadata={'Date':None,'Creator':'MAT plot-hydrogen-balmer.py'})
path.write_bytes(('\n'.join(l.rstrip() for l in path.read_text(encoding='utf-8').splitlines())+'\n').encode('utf-8'))
fig.savefig(root/'.mat-local/hydrogen-balmer-preview.png',dpi=140);plt.close(fig)
manifest={'schema_version':'1.0.0','record_id':'MAT:0001','source_ids':['SRC-000305'],'chart':data['chart'],'input':data['input'],'input_sha256':data['input_sha256'],'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'generator':'scripts/plot-hydrogen-balmer.py','matplotlib_version':matplotlib.__version__,'status':'GENERATED-DATA-CHART','points':len(entries),'intensity_semantics':'NONE; unit-height wavelength markers'}
(root/'data/quality/hydrogen-balmer-chart.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8',newline='\n')
print('Generated Hydrogen wavelength-position chart.')
