"""Plot source-valid Shomate intervals; scoped runs preserve other chart owners."""
import argparse
import csv
import hashlib
import json
import math
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
RECEIPT_PATH = 'data/quality/thermochemistry-chart-manifest.json'


def parse_elements(raw):
    if raw is None:
        return None
    if not re.fullmatch(r'[1-9]\d*(?:,[1-9]\d*)*', raw):
        raise ValueError('Element selection must be comma-separated positive atomic numbers.')
    values = [int(part) for part in raw.split(',')]
    if len(values) != len(set(values)):
        raise ValueError('Duplicate selected element.')
    return values


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def asset_slots(item):
    if 'asset_slots' not in item:
        return {'table': 10, 'graph': 9}
    slots = item['asset_slots']
    if item.get('parent_integration') != 'CURATED-APPEND-ONLY' or not isinstance(slots, dict) or set(slots) != {'table', 'graph'}:
        raise ValueError('Invalid reviewed plot asset slots.')
    if any(isinstance(value, bool) or not isinstance(value, int) or not 0 < value <= 9007199254740991 for value in slots.values()):
        raise ValueError('Invalid reviewed plot asset slot number.')
    return slots


def item_paths(item):
    """Require generated paths to belong to this exact canonical element owner."""
    record_id, stem = item['record_id'], item['stem']
    if not re.fullmatch(r'MAT:\d{4}', record_id) or not re.fullmatch(r'\d{4}-[A-Za-z0-9-]+', stem) or stem[:4] != record_id[4:]:
        raise ValueError('Invalid plot owner identity.')
    folder = 'records/' + stem
    slots = asset_slots(item)
    expected = {
        'input': f'{folder}/data/structured/{stem}-NIST-Thermochemistry.yaml',
        'csv': f"{folder}/tables/{stem}-TABLE-{slots['table']:03d}-Thermodynamic-Functions.csv",
        'chart': f"{folder}/graphs/{stem}-GRAPH-{slots['graph']:03d}-Heat-Capacity.svg",
    }
    if any(item.get(key) != value for key, value in expected.items()):
        raise ValueError('Plot path does not belong to its canonical owner.')
    return expected


def validate_plot_series(root, item, owner):
    """Bind private rendering points to retained fit metadata and canonical CSV."""
    fits, series = owner.get('heat_capacity_fits'), item.get('series')
    if not isinstance(fits, list) or not fits or not isinstance(series, list) or len(series) != len(fits):
        raise ValueError('Plot series count differs from retained fits.')
    expected_columns = ['fit_id', 'source_id', 'source_formula', 'phase', 'phase_variant',
                        'temperature_K', 'heat_capacity_J_mol_K', 'entropy_J_mol_K',
                        'enthalpy_increment_kJ_mol', 'uncertainty', 'evidence_status']
    fit_ids, groups = [], {}
    for fit, curve in zip(fits, series):
        if not isinstance(fit, dict) or not isinstance(curve, dict):
            raise ValueError('Invalid retained fit or plot series.')
        fit_id = fit.get('fit_id')
        if not isinstance(fit_id, str) or fit_id in groups:
            raise ValueError('Duplicate or missing retained fit identity.')
        if (curve.get('fit_id') != fit_id or curve.get('phase') != fit.get('phase')
                or curve.get('label') != fit.get('phase_label_as_reported')
                or curve.get('temperature_range') != fit.get('temperature_range')
                or curve.get('source_id') != fit.get('source_id')
                or fit.get('source_id') != owner['source_id']):
            raise ValueError('Plot series metadata differs from retained fit.')
        bounds = fit.get('temperature_range')
        if (not isinstance(bounds, dict) or bounds.get('unit') != 'K'
                or any(isinstance(bounds.get(key), bool) or not isinstance(bounds.get(key), (int, float))
                       or not math.isfinite(bounds[key]) or bounds[key] <= 0 for key in ('min', 'max'))
                or bounds['min'] >= bounds['max']):
            raise ValueError('Invalid retained plot interval.')
        fit_ids.append(fit_id)
        groups[fit_id] = []
    csv_fit_order = []
    with (root / item['csv']).open(encoding='utf-8', newline='') as stream:
        reader = csv.DictReader(stream)
        if reader.fieldnames != expected_columns:
            raise ValueError('Canonical plot CSV columns differ from the retained format.')
        for row in reader:
            fit_id = row.get('fit_id')
            if set(row) != set(expected_columns) or any(value is None for value in row.values()) or fit_id not in groups:
                raise ValueError('Invalid or unknown fit in canonical plot CSV.')
            if not csv_fit_order or csv_fit_order[-1] != fit_id:
                if fit_id in csv_fit_order:
                    raise ValueError('Canonical plot CSV fit rows are out of order.')
                csv_fit_order.append(fit_id)
            fit = fits[fit_ids.index(fit_id)]
            if (row['source_id'] != owner['source_id'] or row['source_formula'] != owner['source_formula']
                    or row['phase'] != fit['phase'] or row['phase_variant'] != fit['phase_label_as_reported']
                    or row['uncertainty'] != 'UNKNOWN' or row['evidence_status'] != 'CALCULATED-FROM-PUBLISHED-FIT'):
                raise ValueError('Canonical plot CSV source, state or evidence differs from its owner.')
            try:
                values = {key: float(row[key]) for key in expected_columns[5:9]}
            except (TypeError, ValueError):
                raise ValueError('Invalid numeric value in canonical plot CSV.') from None
            temperature, cp = values['temperature_K'], values['heat_capacity_J_mol_K']
            bounds = fit['temperature_range']
            if (not all(math.isfinite(value) for value in values.values()) or temperature <= 0 or cp <= 0
                    or not bounds['min'] <= temperature <= bounds['max']
                    or groups[fit_id] and temperature <= groups[fit_id][-1]['temperature_K']):
                raise ValueError('Canonical plot CSV points are nonfinite, unordered or outside the retained interval.')
            groups[fit_id].append(values)
    if csv_fit_order != fit_ids:
        raise ValueError('Canonical plot CSV fit count or order differs from the retained fits.')
    for fit, curve in zip(fits, series):
        rows, points = groups[fit['fit_id']], curve.get('points')
        if (not isinstance(points, list) or len(points) != len(rows) or len(rows) < 2
                or rows[0]['temperature_K'] != fit['temperature_range']['min']
                or rows[-1]['temperature_K'] != fit['temperature_range']['max']):
            raise ValueError('Plot point count or endpoints differ from canonical CSV and retained interval.')
        for point, row in zip(points, rows):
            if not isinstance(point, dict):
                raise ValueError('Invalid private plot point.')
            for key in ('temperature_K', 'heat_capacity_J_mol_K'):
                value = point.get(key)
                if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or value != row[key]:
                    raise ValueError('Private plot points differ from canonical CSV float roundtrips.')
            if point.get('uncertainty') != 'UNKNOWN' or point.get('evidence_status') != 'CALCULATED-FROM-PUBLISHED-FIT':
                raise ValueError('Private plot point evidence differs from canonical CSV.')


def prepare_plot_plan(root, elements=None):
    """Read and preflight every selected chart before any asset or receipt writes."""
    catalogue = json.loads((root / 'data/catalog/thermochemistry-evaluation-index.json').read_text(encoding='utf-8'))
    accessions = json.loads((root / 'data/catalog/nist-thermochemistry-accessions.json').read_text(encoding='utf-8'))['accessions']
    configured = {}
    for accession in accessions:
        z = accession['z']
        if isinstance(z, bool) or not isinstance(z, int) or z <= 0 or z in configured:
            raise ValueError('Duplicate or invalid configured thermal accession.')
        configured[z] = accession
    owners = {}
    for owner in catalogue['elements'] + catalogue.get('source_gaps', []):
        z = owner['z']
        if isinstance(z, bool) or not isinstance(z, int) or z <= 0 or z in owners or owner['record_id'] != f'MAT:{z:04d}':
            raise ValueError('Duplicate or invalid thermochemistry accession identity.')
        owners[z] = owner
    if elements is not None:
        if not elements or len(elements) != len(set(elements)) or any(isinstance(z, bool) or not isinstance(z, int) or z <= 0 for z in elements):
            raise ValueError('Duplicate or invalid selected element.')
        for z in elements:
            if z not in owners:
                raise ValueError(f'No thermochemistry accession for selected element {z}')
    selected = set(owners) if elements is None else set(elements)
    expected_ids = {owner['record_id'] for owner in catalogue['elements'] if owner['z'] in selected}
    items = json.loads((root / '.mat-local/thermochemistry-plot-input.json').read_text(encoding='utf-8'))
    seen, planned = set(), []
    fit_ids = {owner['record_id'] for owner in catalogue['elements']}
    for item in items:
        record_id = item['record_id']
        if record_id in seen:
            raise ValueError('Duplicate plot input owner.')
        seen.add(record_id)
        if record_id not in expected_ids:
            if elements is None or record_id not in fit_ids:
                raise ValueError('Unrecognised plot input owner.')
            continue
        paths = item_paths(item)
        owner = owners[int(record_id[4:])]
        accession = configured.get(int(record_id[4:]))
        if accession is None or accession.get('source_id') != owner.get('source_id'):
            raise ValueError('Plot owner differs from configured accession.')
        if (accession.get('name') != owner.get('name') or accession.get('retrieved') != owner.get('retrieved')
                or accession.get('formula') != owner.get('source_formula')
                or owner.get('molar_basis') != 'mol ' + str(accession.get('formula'))):
            raise ValueError('Plot formula, basis or retrieval differs from configured accession.')
        if any(accession.get(key) != owner.get(key) for key in ('asset_slots', 'subject', 'parent_integration')) or asset_slots(accession) != asset_slots(owner):
            raise ValueError('Plot context differs from configured accession.')
        if item.get('asset_slots') != owner.get('asset_slots') or asset_slots(item) != asset_slots(owner):
            raise ValueError('Plot asset slots differ from reviewed accession.')
        if item.get('subject') != owner.get('subject') or (item.get('parent_integration') is not None and item['parent_integration'] != owner.get('parent_integration')):
            raise ValueError('Plot subject differs from reviewed accession.')
        if item['name'] != owner['name'] or item['source_id'] != owner['source_id'] or not item.get('series'):
            raise ValueError('Plot identity or source differs from accession.')
        if item.get('molar_basis') != owner['molar_basis'] or item.get('retrieved') != owner['retrieved']:
            raise ValueError('Plot basis or retrieval label differs from its retained owner.')
        for key in ('input', 'csv'):
            if not (root / paths[key]).is_file():
                raise ValueError('Missing generated chart input: ' + paths[key])
        validate_plot_series(root, item, owner)
        planned.append(item)
    if {item['record_id'] for item in planned} != expected_ids:
        raise ValueError('Requested fit owners are absent from plot input; run scoped sync first.')
    receipt_file = root / RECEIPT_PATH
    prior = json.loads(receipt_file.read_text(encoding='utf-8')) if receipt_file.exists() else None
    receipts = {}
    if prior is not None:
        if prior.get('generated_by') != 'scripts/plot-thermochemistry.py' or not isinstance(prior.get('elements'), list):
            raise ValueError('Unrecognised chart receipt manifest.')
        for receipt in prior['elements']:
            if receipt['record_id'] in receipts or receipt['record_id'] not in fit_ids:
                raise ValueError('Duplicate or unrecognised chart receipt owner.')
            receipts[receipt['record_id']] = receipt
    for item in planned:
        target = root / item['chart']
        receipt = receipts.get(item['record_id'])
        if target.exists() and (receipt is None or receipt.get('chart') != item['chart'] or digest(target) != receipt.get('chart_sha256')):
            raise ValueError('Refusing to overwrite unrecognised or edited chart: ' + item['chart'])
        if receipt is not None and not target.is_file():
            raise ValueError('Recorded chart is missing: ' + item['chart'])
    return planned, prior


def merge_receipts(prior, generated):
    merged = {receipt['record_id']: receipt for receipt in (prior or {}).get('elements', [])}
    for receipt in generated:
        merged[receipt['record_id']] = receipt
    return sorted(merged.values(), key=lambda receipt: receipt['record_id'])


def render_chart(root, item, preview=False):
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    from matplotlib.ticker import MaxNLocator, StrMethodFormatter

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
        # Keep tiny residuals in near-constant source fits visually proportionate.
        half_span = max((max(values)-min(values))*.6, abs(center)*.05, .5)
        ax.set_ylim(center-half_span, center+half_span)
        ax.yaxis.set_major_locator(MaxNLocator(nbins=5))
        ax.yaxis.set_major_formatter(StrMethodFormatter('{x:g}'))
        ax.legend(fontsize=9, loc='best')
    subject = item.get('subject')
    title = item['name'] + (' ' + item['molar_basis'].removeprefix('mol ') if subject else '')
    fig.suptitle(title + ' — phase-specific heat capacity', fontsize=19, x=.06, ha='left')
    fig.text(.06,.13,'Basis: '+item['molar_basis']+'. Separate phase scales. Curves are calculated; dots mark fit limits, not phase boundaries.',fontsize=10)
    fig.text(.06,.083,'Source: NIST Chemistry WebBook / Chase (1998) • '+item['source_id']+' • retrieved '+item['retrieved']+'.',fontsize=10)
    if subject and subject['object_class'] == 'ATOM':
        footer = subject['object_ref'] + ' · Monatomic species; isotope composition UNSPECIFIED. No extrapolation; uncertainty UNKNOWN.'
    else:
        footer = (subject['object_ref'] + ' · Spin/isotope populations: UNSPECIFIED. No extrapolation or equilibrium speciation; uncertainty UNKNOWN.'
                  if subject else 'No extrapolation or phase blending. Coefficient uncertainty: UNKNOWN. No equilibrium speciation is calculated.')
    fig.text(.06,.036,footer,fontsize=9 if subject else 10)
    # Measure each axis' labels/ticks rather than allocating a fixed gap. The
    # reserved rectangle keeps all axis text above the scientific footer and
    # below the title, including panels with long decimal tick labels.
    fig.tight_layout(rect=(.02, .22, .99, .87), pad=1.2, w_pad=2.7, h_pad=1.2)
    target=root/item['chart'];target.parent.mkdir(parents=True,exist_ok=True)
    fig.savefig(target,metadata={'Date':None,'Creator':'MAT plot-thermochemistry.py; matplotlib '+matplotlib.__version__})
    target.write_bytes(('\n'.join(line.rstrip() for line in target.read_text(encoding='utf-8').splitlines())+'\n').encode('utf-8'))
    if preview or item['name'] in ('Phosphorus','Calcium','Argon','Titanium','Iron','Manganese','Nickel'):
        preview_target=root/f".mat-local/thermochemistry-{item['stem'][:4]}.png"
        preview_target.parent.mkdir(parents=True,exist_ok=True)
        fig.savefig(preview_target,dpi=130)
    plt.close(fig)
    return {'record_id':item['record_id'],'source_id':item['source_id'],'input':item['input'],
            'input_sha256':digest(root/item['input']), 'csv':item['csv'],'csv_sha256':digest(root/item['csv']),
            'chart':item['chart'],'chart_sha256':digest(target), 'fit_count':len(item['series']),
            'calculated_rows':sum(len(s['points']) for s in item['series']),
            'status':'CALCULATED-FROM-PUBLISHED-FIT','matplotlib_version':matplotlib.__version__}


def plot_thermochemistry(root=ROOT, elements=None, renderer=render_chart):
    items, prior = prepare_plot_plan(root, elements)
    generated = [renderer(root, item, preview=elements is not None) for item in items]
    if not generated:
        return 0  # Source-gap selections have no numeric chart or receipt to invent.
    manifest = dict(prior) if prior else {
        'generated_by':'scripts/plot-thermochemistry.py',
        'matplotlib_version':generated[0]['matplotlib_version'],
        'scope':'Supplemental charts; not A/B illustration panels or phase diagrams.',
        'axis_policy':'Each panel has independent scales. Y-axis half-span is at least 5% of its centre value or 0.5 J mol^-1 K^-1 to avoid exaggerating near-constant fit residuals.',
    }
    manifest['elements'] = merge_receipts(prior, generated)
    (root/RECEIPT_PATH).parent.mkdir(parents=True,exist_ok=True)
    (root/RECEIPT_PATH).write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
    return len(generated)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--elements', action='append', help='Existing accession atomic numbers, e.g. 29,30; omit for all.')
    options = parser.parse_args()
    if options.elements is not None and len(options.elements) != 1:
        parser.error('--elements must be supplied only once.')
    selected = parse_elements(options.elements[0] if options.elements else None)
    print('Generated',plot_thermochemistry(elements=selected),'source-specific charts.')
