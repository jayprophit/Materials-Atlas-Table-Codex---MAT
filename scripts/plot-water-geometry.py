import json, sys
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Arc
from pathlib import Path
p=json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
g=p['calculations']['constructed_geometry']; m=p['compounds']['water']['geometry']
theta=m['bond_angle']['value']; points=[g['hydrogen_left'],g['oxygen'],g['hydrogen_right']]
plt.rcParams.update({'font.family':'DejaVu Sans','svg.hashsalt':'MAT-WATER-GEOMETRY-v1'})
fig,ax=plt.subplots(figsize=(8,6.7),facecolor='#f6fbff');ax.set_facecolor('#f6fbff')
ax.plot([v[0] for v in points],[v[1] for v in points],color='#537394',lw=3,zorder=1)
for label,(x,y),color in zip(['H','O','H'],points,['#d6e2ee','#c93d43','#d6e2ee']):
 ax.scatter([x],[y],s=1200,color=color,edgecolor='#243e59',zorder=3)
 ax.text(x,y,label,ha='center',va='center',fontsize=18,color='white' if label=='O' else '#132d49',zorder=4)
ax.add_patch(Arc((0,0),0.68,0.68,theta1=270-theta/2,theta2=270+theta/2,color='#173c61',lw=1.5))
ax.text(0,-0.40,'104.4776°',ha='center',fontsize=12,color='#173c61')
ax.text(-0.52,-0.20,'r = 0.9578 Å',rotation=38,ha='center',fontsize=11)
ax.text(0,-0.80,'Calculated H–H distance: '+format(g['hydrogen_separation'],'.6f')+' Å',ha='center',fontsize=11)
ax.set(xlim=(-1.15,1.15),ylim=(-1.0,0.42),xlabel='Chosen x coordinate / Å',ylabel='Chosen y coordinate / Å')
ax.set_aspect('equal');ax.grid(alpha=.22);ax.set_title('Water: symmetric equilibrium-coordinate construction',pad=18,fontsize=14)
fig.text(.5,.075,'NIST CCCBDB inputs • SRC-000308 • Isolated neutral H2O',ha='center',fontsize=10)
fig.text(.5,.042,'Derived orientation; atom markers not to scale. Input uncertainties unavailable.',ha='center',fontsize=9)
fig.subplots_adjust(bottom=.18,top=.90,left=.12,right=.96)
fig.savefig(sys.argv[2],metadata={'Date':None,'Creator':'MAT reproducible water geometry construction'})
svg=Path(sys.argv[2])
svg.write_bytes(('\n'.join(line.rstrip() for line in svg.read_text(encoding='utf-8').splitlines())+'\n').encode('utf-8'))
fig.savefig(Path(sys.argv[1]).parent / 'water-geometry-preview.png', dpi=130)
