"""Deterministic source-data plots; no scientific values originate in this renderer."""
import json
import sys
from pathlib import Path
import textwrap
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Patch, FancyBboxPatch, FancyArrowPatch

COLORS = {'CERTIFIED': '#17689c', 'REFERENCE': '#ab6500', 'INFORMATION': '#74589b'}
plt.rcParams.update({'font.family': 'DejaVu Sans', 'svg.hashsalt': 'MAT-SRM126c-v1',
                     'svg.fonttype': 'none', 'font.size': 10})


def save_figure(fig, directory, name, title, description):
    destination = directory / (name + '.svg')
    fig.savefig(destination, metadata={'Date': None, 'Creator': 'MAT source-bound material renderer',
                                      'Title': title, 'Description': description})
    destination.write_bytes(('\n'.join(line.rstrip() for line in
                            destination.read_text(encoding='utf-8').splitlines()) + '\n').encode('utf-8'))
    fig.savefig(directory / (name + '-preview.png'), dpi=125)
    plt.close(fig)


def composition(d, output):
    rows = d['rows']
    # A separate detail scale repeats all rows except the largest; no values are re-normalised.
    largest = max(rows, key=lambda r: r['value'])
    minor = [r for r in rows if r is not largest]
    fig = plt.figure(figsize=(16, 10), facecolor='#f6faff')
    overview = fig.add_axes([.115, .25, .275, .52], facecolor='white')
    detail = fig.add_axes([.605, .25, .225, .52], facecolor='white')
    for ax, selected, heading in [(overview, rows, 'All 11 reported constituents'),
                                  (detail, minor, 'Minor constituents - separate scale')]:
        for i, row in enumerate(selected):
            ax.barh(i, row['value'], height=.57, color=COLORS[row['status']],
                    hatch='//' if row['status'] == 'INFORMATION' else None, edgecolor='#344c61', linewidth=.4)
            if row['uncertainty'] is not None:
                ax.errorbar(row['value'], i, xerr=row['uncertainty'], fmt='none',
                            ecolor='#172f44', capsize=3, elinewidth=1.1)
            if ax is overview:
                annotation = row['value_text'] + ' wt%'
                if row is largest:
                    annotation += '\nU = ' + row['uncertainty_text'] + '; k = ' + row['coverage_factor_text']
            else:
                annotation = row['value_text'] + (' ± ' + row['uncertainty_text'] +
                                                 '; k = ' + row['coverage_factor_text']
                                                 if row['uncertainty_text'] is not None else '; U, k UNKNOWN')
            ax.text(1.035, i, annotation, transform=ax.get_yaxis_transform(), va='center', fontsize=9.3,
                    color='#18364c', clip_on=False)
        ax.set_yticks(range(len(selected)), [r['name'] + ' (' + r['symbol'] + ')' for r in selected])
        ax.set_ylim(len(selected) - .35, -.65)
        ax.set_xlim(0, max(r['value'] + (r['uncertainty'] or 0) for r in selected) * 1.10)
        ax.set_xlabel('Mass fraction / wt% (linear)', labelpad=10)
        ax.set_title(heading, fontsize=12, loc='left', pad=17)
        ax.grid(axis='x', color='#d8e2eb', linewidth=.65)
        ax.set_axisbelow(True)
        ax.spines[['top', 'right']].set_visible(False)
        ax.tick_params(axis='y', length=0, pad=9)
    fig.text(.055, .949, 'NIST SRM 126c | High-nickel steel, chip form', fontsize=22, color='#17394e', weight='bold')
    fig.text(.055, .911, 'Source-reported mass fractions; material ' + d['material_ref'], fontsize=11.5, color='#3b596c')
    fig.legend(handles=[Patch(facecolor=COLORS[s], label=s + (' (noncertified)' if s == 'REFERENCE' else
                           ' (uncertainty unknown)' if s == 'INFORMATION' else '')) for s in COLORS],
               loc='upper left', bbox_to_anchor=(.05, .881), ncol=3, frameon=False, fontsize=10.5)
    fig.text(.055, .16, 'PARTIAL composition | Reported sum = ' + d['reported_sum_text'] +
             ' wt% | Unreported balance: unassigned', fontsize=13, weight='bold', color='#17394e')
    fig.text(.055, .123, 'Bars show the listed assignments, not a complete alloy recipe. The right panel repeats minor constituents on a different scale.', fontsize=10)
    fig.text(.055, .096, 'Error bars: reported expanded U at 95% confidence. Each reported k is retained; reference uncertainties may omit contributions.', fontsize=10)
    fig.text(.055, .069, 'Information uncertainty is UNKNOWN; no error bar is drawn. No Iron remainder or combined uncertainty is inferred.', fontsize=10)
    fig.text(.055, .042, d['source']['source_id'] + ' | Certificate issued ' + d['source']['certificate_issue'] +
             ' | Retained PDF SHA-256: ' + d['source']['sha256'], fontsize=8.2, color='#3b596c').set_url(d['source']['url'])
    fig.text(.055, .018, 'Source transcription and rendering checks are not independent laboratory replication. Not a pure-Iron property chart or standalone element illustration.', fontsize=9, color='#3b596c')
    save_figure(fig, output, 'composition', 'NIST SRM 126c source-reported partial composition',
                'All eleven source assignments; CERTIFIED, REFERENCE and INFORMATION statuses; expanded uncertainty where reported. '
                'Distinct overview/detail linear scales, no composition normalisation or inferred Iron balance. ' + d['source']['source_id'])


def preparation(d, output):
    fig, ax = plt.subplots(figsize=(15, 7.8), facecolor='#f6faff')
    ax.set(xlim=(0, 1), ylim=(0, 1))
    ax.axis('off')
    boxes = [.035, .285, .535, .785]
    for x, step in zip(boxes, d['steps']):
        ax.add_patch(FancyBboxPatch((x, .39), .18, .40, boxstyle='round,pad=0.012',
                                   facecolor='white', edgecolor='#47728b', linewidth=1.3))
        ax.text(x + .016, .742, str(step['order']) + '. ' + step['label'].title(),
                fontsize=13.5, weight='bold', color='#17394e', va='top')
        description = step['description']
        ax.text(x + .016, .666, '\n'.join(textwrap.wrap(description, width=26)),
                fontsize=10.5, color='#17394e', va='top', linespacing=1.5)
        ax.text(x + .016, .447, 'Output: ' + ', '.join(step['output_states']),
                fontsize=8.3, color='#496579', va='top', wrap=True)
    for left, right in zip(boxes, boxes[1:]):
        ax.add_patch(FancyArrowPatch((left + .195, .59), (right - .018, .59),
                                    arrowstyle='-|>', mutation_scale=16, color='#47728b', lw=1.2))
        ax.text((left + .195 + right - .018) / 2, .63, 'then', ha='center', fontsize=9.5, color='#496579')
    geometry = [(step['order'], p) for step in d['steps'] for p in step['parameters']]
    for index, (order, parameter) in enumerate(geometry):
        label = parameter['metric'].replace('_', ' ').capitalize() + ': ' + parameter['display']
        ax.text(.54, .315 - index * .047, str(order) + '. ' + label + ' | uncertainty UNKNOWN',
                fontsize=11, color='#17394e')
    fig.text(.055, .925, 'NIST SRM 126c | Reported preparation sequence', fontsize=21, color='#17394e', weight='bold')
    fig.text(.055, .88, 'Material ' + d['material_ref'] + ' | Arrows show reported order; no quantified causal effects or execution instructions.', fontsize=10.7, color='#3b596c')
    fig.text(.055, .153, 'Source: certificate page 2, Preparation and Analysis. Only selected cast sections are reported to follow the rolling route.', fontsize=10.5)
    fig.text(.055, .12, 'Remaining rods were used for SRM 1158; quantities, phase fractions, process temperatures and durations are not reported.', fontsize=10.5)
    fig.text(.055, .087, 'This source-reported history does not establish a complete process recipe, mass balance, property prediction or circular-recovery performance.', fontsize=10.5)
    fig.text(.055, .051, d['source']['source_id'] + ' | Certificate issued ' + d['source']['certificate_issue'] +
             ' | Retained PDF SHA-256: ' + d['source']['sha256'], fontsize=8.1, color='#3b596c').set_url(d['source']['url'])
    fig.text(.055, .019, 'Data-derived diagram. No independent MAT sample or laboratory execution is asserted. Zero standalone element-panel credit.', fontsize=9.3, color='#3b596c')
    fig.subplots_adjust(left=.025, right=.985, bottom=.09, top=.91)
    save_figure(fig, output, 'preparation', 'NIST SRM 126c ordered source-reported preparation',
                'Four ordered source-reported steps, vacuum melting, casting, rolling selected sections and lathe cutting. '
                'Approximate diameters retain unknown uncertainty; no quantified causal or execution claim. ' + d['source']['source_id'])


if __name__ == '__main__':
    data = json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
    destination = Path(sys.argv[2])
    if data['coverage'] != 'PARTIAL' or data['combined_uncertainty'] is not None or data['unassigned_identity'] != 'UNKNOWN':
        raise ValueError('Reviewed partial-composition scope required')
    if data['process_arrow_meaning'] != 'ORDERED-SOURCE-REPORTED-SEQUENCE':
        raise ValueError('Source-reported arrow semantics required')
    composition(data, destination)
    preparation(data, destination)
