"""Plot only the source's valid Shomate intervals, preserving phase alternatives."""
import hashlib
import json
from pathlib import Path
import sys
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.ticker import MaxNLocator, StrMethodFormatter

ROOT = Path(__file__).resolve().parents[1]
items = json.loads((ROOT / '.mat-local/thermochemistry-plot-input.json').read_text(encoding='utf-8'))
receipts = []
for item in items:
    plt.rcParams.update({'font.family': 'DejaVu Sans', 'font.size': 10, 'svg.fonttype': 'none', 'svg.hashsalt': item['stem']})
    phases = [p for p in ('SOLID', 'LIQUID', 'GAS') if any(f['phase'] == p for f in item['series'])]
    fig, axes = plt.subplots(1, len(phases), figsize=(13, 5.8), squeeze=False)
    fig.set_facecolor('#f6fbff')
    palette = ['#125886', '#B34C16', '#367442', '#814BAD', '#B52051']
    for ax, phase in zip(axes[0], phases):
        series = [f for f in item['series'] if f['phase'] == phase]
        labels = list(dict.fromkeys(f['label'] for f in series))
        shown = set()
        for curve in series:
            label = curve['label']
            display = 'Published fit' if label == 'UNSPECIFIED-IN-FIT-TABLE' else label
            color = palette[labels.index(label) % len(palette)]
            points = curve['points']
            ax.plot([p['temperature_K'] for p in points], [p['heat_capacity_J_mol_K'] for p in points],
                    color=color, linewidth=2, label=display if label not in shown else None)
            ax.scatter([points[0]['temperature_K'], points[-1]['temperature_K']],
                       [points[0]['heat_capacity_J_mol_K'], points[-1]['heat_capacity_J_mol_K']], color=color, s=10, zorder=3)
            shown.add(label)
        ax.set_title(phase.capitalize(), loc='left', fontsize=13)
        ax.set_xlabel('Temperature / K')
        ax.set_ylabel('Molar heat capacity / J mol⁻¹ K⁻¹')
        ax.grid(alpha=.18)
        ax.ticklabel_format(useOffset=False)
        values = [p['heat_capacity_J_mol_K'] for curve in series for p in curve['points']]
        center = (min(values) + max(values)) / 2
        # Tiny residual coefficients in nominally constant fits must not become
        # a visually large effect through autoscaling or long floating-point ticks.
        half_span = max((max(values)-min(values))*.6, abs(center)*.05, .5)
        ax.set_ylim(center-half_span, center+half_span)
        ax.yaxis.set_major_locator(MaxNLocator(nbins=5))
        ax.yaxis.set_major_formatter(StrMethodFormatter('{x:g}'))
        ax.legend(fontsize=9, loc='best')
    fig.suptitle(item['name'] + ' — phase-specific heat capacity', fontsize=19, x=.06, ha='left')
    fig.text(.06,.13,'Basis: '+item['molar_basis']+'. Separate phase scales. Curves are calculated; dots mark fit limits, not phase boundaries.',fontsize=10)
    fig.text(.06,.083,'Source: NIST Chemistry WebBook / Chase (1998) • '+item['source_id']+' • retrieved 2026-09-28.',fontsize=10)
    fig.text(.06,.036,'No extrapolation or phase blending. Coefficient uncertainty: UNKNOWN. No equilibrium speciation is calculated.',fontsize=10)
    fig.subplots_adjust(left=.065,right=.985,bottom=.28,top=.83,wspace=.32)
    target=ROOT/item['chart'];target.parent.mkdir(parents=True,exist_ok=True)
    fig.savefig(target,metadata={'Date':None,'Creator':'MAT plot-thermochemistry.py; matplotlib '+matplotlib.__version__})
    target.write_bytes(('\n'.join(line.rstrip() for line in target.read_text(encoding='utf-8').splitlines())+'\n').encode('utf-8'))
    if item['name'] in ('Phosphorus','Calcium','Argon'):
        fig.savefig(ROOT/f".mat-local/thermochemistry-{item['stem'][:4]}.png",dpi=130)
    plt.close(fig)
    receipts.append({'record_id':item['record_id'],'source_id':item['source_id'],'input':item['input'],
                     'input_sha256':hashlib.sha256((ROOT/item['input']).read_bytes()).hexdigest(),
                     'csv':item['csv'],'csv_sha256':hashlib.sha256((ROOT/item['csv']).read_bytes()).hexdigest(),
                     'chart':item['chart'],'chart_sha256':hashlib.sha256(target.read_bytes()).hexdigest(),
                     'fit_count':len(item['series']),'calculated_rows':sum(len(s['points']) for s in item['series']),
                     'status':'CALCULATED-FROM-PUBLISHED-FIT'})
(ROOT/'data/quality/thermochemistry-chart-manifest.json').write_text(json.dumps({'generated_by':'scripts/plot-thermochemistry.py',
    'matplotlib_version':matplotlib.__version__,'scope':'Supplemental charts; not A/B illustration panels or phase diagrams.',
    'axis_policy':'Each panel has independent scales. Y-axis half-span is at least 5% of its centre value or 0.5 J mol^-1 K^-1 to avoid exaggerating near-constant fit residuals.',
    'elements':receipts},indent=2)+'\n',encoding='utf-8')
print('Generated',len(receipts),'source-specific charts.')
