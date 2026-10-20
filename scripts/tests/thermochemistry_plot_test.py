"""Scoped plotting tests use temporary ownership fixtures, never canonical science."""
import copy
import csv
import importlib.util
import io
import json
import math
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('thermal_plot', Path(__file__).parents[1] / 'plot-thermochemistry.py')
plot = importlib.util.module_from_spec(spec)
spec.loader.exec_module(plot)


class ScopedPlotTests(unittest.TestCase):
    def fixture(self):
        temporary = tempfile.TemporaryDirectory(prefix='mat-thermal-plot-')
        self.addCleanup(temporary.cleanup)
        root = Path(temporary.name)
        def write(path, value):
            target = root / path
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(value, encoding='utf-8', newline='')
        items, owners, accessions = [], [], []
        for z, name, symbol in [(13, 'Aluminium', 'Al'), (29, 'Copper', 'Cu')]:
            stem = f'{z:04d}-{name}-{symbol}'
            folder = 'records/' + stem
            source_id, fits, series = f'TEST-SOURCE-{z}', [], []
            for index, (minimum, maximum) in enumerate(((300,450),(450,600)),1):
                bounds = {'min':minimum,'max':maximum,'unit':'K','raw':'MOCK-INTERVAL; NOT SCIENTIFIC DATA'}
                fit_id, label = f'MAT:{z:04d}:THERMO:SHOMATE:GAS:{index:02d}', f'MOCK-FIT-ONLY-{index}'
                fits.append({'fit_id':fit_id,'phase':'GAS','phase_label_as_reported':label,
                             'temperature_range':bounds,'source_id':source_id,
                             'comment_as_reported':'Synthetic ownership/arithmetic fixture; never scientific evidence.'})
                points = [{'temperature_K':temperature,'heat_capacity_J_mol_K':30+index,
                           'entropy_J_mol_K':0,'enthalpy_increment_kJ_mol':0,'uncertainty':'UNKNOWN',
                           'evidence_status':'CALCULATED-FROM-PUBLISHED-FIT'}
                          for temperature in (minimum,(minimum+maximum)/2,maximum)]
                series.append({'fit_id':fit_id,'phase':'GAS','label':label,'temperature_range':bounds,
                               'source_id':source_id,'points':points})
            item = {'record_id': f'MAT:{z:04d}', 'name':name, 'source_id':source_id, 'stem':stem,
                    'retrieved':'2000-01-01','molar_basis':'mol '+symbol,
                    'input':f'{folder}/data/structured/{stem}-NIST-Thermochemistry.yaml',
                    'csv':f'{folder}/tables/{stem}-TABLE-010-Thermodynamic-Functions.csv',
                    'chart':f'{folder}/graphs/{stem}-GRAPH-009-Heat-Capacity.svg','series':series}
            write(item['input'],'Temporary ownership fixture, not scientific data.\n')
            rows = [['fit_id','source_id','source_formula','phase','phase_variant','temperature_K',
                     'heat_capacity_J_mol_K','entropy_J_mol_K','enthalpy_increment_kJ_mol','uncertainty','evidence_status']]
            for curve in series:
                rows.extend([[curve['fit_id'],source_id,symbol,curve['phase'],curve['label'],
                              point['temperature_K'],point['heat_capacity_J_mol_K'],point['entropy_J_mol_K'],
                              point['enthalpy_increment_kJ_mol'],point['uncertainty'],point['evidence_status']]
                             for point in curve['points']])
            stream = io.StringIO(newline='');csv.writer(stream).writerows(rows);write(item['csv'],stream.getvalue())
            items.append(item)
            owners.append({'z':z,'record_id':item['record_id'],'name':name,'source_id':source_id,
                           'retrieved':item['retrieved'],'source_formula':symbol,'molar_basis':item['molar_basis'],
                           'heat_capacity_fits':fits})
            accessions.append({'z':z,'name':name,'source_id':source_id,'retrieved':item['retrieved'],'formula':symbol})
        write('data/catalog/thermochemistry-evaluation-index.json', json.dumps({
            'elements':owners,
            'source_gaps':[{'z':21,'record_id':'MAT:0021'}]}))
        write('data/catalog/nist-thermochemistry-accessions.json',json.dumps({'accessions':accessions}))
        write('.mat-local/thermochemistry-plot-input.json',json.dumps(items))
        write(items[0]['chart'],'Existing chart bytes.\n')
        receipt = {**{key:items[0][key] for key in ('record_id','input','csv','chart')},
                   'chart_sha256':plot.digest(root/items[0]['chart']), 'preserved_metadata':'Keep this exact receipt.'}
        manifest = {'generated_by':'scripts/plot-thermochemistry.py','matplotlib_version':'PRIOR',
                    'scope':'Existing scope.','elements':[receipt]}
        write(plot.RECEIPT_PATH,json.dumps(manifest))
        return root, items, manifest, write

    def test_parse_selection(self):
        self.assertIsNone(plot.parse_elements(None))
        self.assertEqual(plot.parse_elements('29,13'),[29,13])
        for value in ('', '0', '029','29,','29, 13','29.5','29,29'):
            with self.assertRaises(ValueError):plot.parse_elements(value)

    def test_reviewed_slots_require_curated_ownership_and_reject_forged_paths(self):
        root, items, _, _ = self.fixture()
        item = dict(items[1], parent_integration='CURATED-APPEND-ONLY', asset_slots={'table':10,'graph':10})
        item['chart'] = item['chart'].replace('GRAPH-009','GRAPH-010')
        self.assertEqual(plot.item_paths(item)['chart'], item['chart'])
        for bad in (None,{'table':0,'graph':10},{'table':True,'graph':10},{'table':10,'graph':10.5},{'table':10,'graph':10,'extra':1},{'table':10,'graph':9007199254740992}):
            with self.assertRaises(ValueError):plot.item_paths(dict(item,asset_slots=bad))
        with self.assertRaises(ValueError):plot.item_paths(dict(item,parent_integration=None))
        with self.assertRaisesRegex(ValueError,'canonical owner'):plot.item_paths(dict(item,chart=item['chart'].replace('GRAPH-010','GRAPH-009')))

    def test_unreviewed_slot_override_cannot_enter_plot_plan(self):
        root, items, _, write = self.fixture()
        item = dict(items[1], parent_integration='CURATED-APPEND-ONLY', asset_slots={'table':10,'graph':10})
        item['chart'] = item['chart'].replace('GRAPH-009','GRAPH-010')
        write('.mat-local/thermochemistry-plot-input.json',json.dumps([items[0],item]))
        before = (root/plot.RECEIPT_PATH).read_bytes()
        with self.assertRaisesRegex(ValueError,'slots differ'):plot.prepare_plot_plan(root,[29])
        self.assertEqual((root/plot.RECEIPT_PATH).read_bytes(),before)

    def test_agreeing_derived_slot_forgery_fails_against_configured_accession(self):
        root, items, _, write = self.fixture()
        item = dict(items[1],parent_integration='CURATED-APPEND-ONLY',asset_slots={'table':10,'graph':10})
        item['chart'] = item['chart'].replace('GRAPH-009','GRAPH-010')
        write('.mat-local/thermochemistry-plot-input.json',json.dumps([items[0],item]))
        owners = json.loads((root/'data/catalog/thermochemistry-evaluation-index.json').read_text())
        owners['elements'][1].update(parent_integration=item['parent_integration'],asset_slots=item['asset_slots'])
        write('data/catalog/thermochemistry-evaluation-index.json',json.dumps(owners))
        before = (root/plot.RECEIPT_PATH).read_bytes()
        with self.assertRaisesRegex(ValueError,'configured accession'):plot.prepare_plot_plan(root,[29])
        self.assertEqual((root/plot.RECEIPT_PATH).read_bytes(),before)

    def test_plot_basis_and_date_labels_cannot_drift_from_the_retained_owner(self):
        for key, value in (('molar_basis','mol TEST-MOLECULE'),('retrieved','2001-01-01')):
            with self.subTest(key=key):
                root, items, _, write = self.fixture()
                changed=copy.deepcopy(items);changed[1][key]=value
                write('.mat-local/thermochemistry-plot-input.json',json.dumps(changed))
                before=(root/plot.RECEIPT_PATH).read_bytes()
                calls=[]
                with self.assertRaisesRegex(ValueError,'basis or retrieval label'):
                    plot.plot_thermochemistry(root,[29],lambda *args,**kwargs:calls.append(args))
                self.assertEqual(calls,[]);self.assertEqual((root/plot.RECEIPT_PATH).read_bytes(),before)
                self.assertFalse((root/items[1]['chart']).exists())

    def test_agreeing_derived_formula_or_date_forgery_cannot_bypass_source_configuration(self):
        for key, value in (('source_formula','TEST-FORMULA'),('retrieved','2001-01-01')):
            with self.subTest(key=key):
                root, items, _, write = self.fixture()
                owners=json.loads((root/'data/catalog/thermochemistry-evaluation-index.json').read_text())
                owners['elements'][1][key]=value
                changed=copy.deepcopy(items)
                if key=='retrieved':changed[1][key]=value
                else:
                    owners['elements'][1]['molar_basis']='mol '+value
                    changed[1]['molar_basis']='mol '+value
                write('data/catalog/thermochemistry-evaluation-index.json',json.dumps(owners))
                write('.mat-local/thermochemistry-plot-input.json',json.dumps(changed))
                with self.assertRaisesRegex(ValueError,'configured accession'):plot.prepare_plot_plan(root,[29])
                self.assertFalse((root/items[1]['chart']).exists())

    def test_private_series_metadata_order_and_points_cannot_replace_canonical_csv(self):
        mutations = [
            lambda item:item['series'][0].update(fit_id='UNKNOWN-FIT'),
            lambda item:item['series'][0].update(phase='SOLID'),
            lambda item:item['series'][0].update(label='FORGED-LABEL'),
            lambda item:item['series'][0].update(source_id='FORGED-SOURCE'),
            lambda item:item['series'][0]['temperature_range'].update(min=301),
            lambda item:item['series'].reverse(),
            lambda item:item['series'].append(copy.deepcopy(item['series'][0])),
            lambda item:item['series'].pop(),
            lambda item:item['series'][0]['points'].pop(),
            lambda item:item['series'][0]['points'].reverse(),
            lambda item:item['series'][0]['points'][1].update(temperature_K=376),
            lambda item:item['series'][0]['points'][1].update(heat_capacity_J_mol_K=math.nextafter(31,math.inf)),
            lambda item:item['series'][0]['points'][1].update(heat_capacity_J_mol_K=math.inf),
            lambda item:item['series'][0]['points'][1].update(heat_capacity_J_mol_K=0),
            lambda item:item['series'][0]['points'][1].update(temperature_K=True),
            lambda item:item['series'][0]['points'][1].update(uncertainty=0),
            lambda item:item['series'][0]['points'][1].update(evidence_status='MEASURED'),
        ]
        for index, mutate in enumerate(mutations):
            with self.subTest(index=index):
                root, items, _, write = self.fixture()
                changed=copy.deepcopy(items);mutate(changed[1])
                write('.mat-local/thermochemistry-plot-input.json',json.dumps(changed))
                before={file:(root/file).read_bytes() for file in (plot.RECEIPT_PATH,items[0]['chart'],items[1]['csv'],items[1]['input'])}
                calls=[]
                with self.assertRaisesRegex(ValueError,'Plot|Private plot'):
                    plot.plot_thermochemistry(root,[29],lambda *args,**kwargs:calls.append(args))
                self.assertEqual(calls,[])
                for file, data in before.items():self.assertEqual((root/file).read_bytes(),data)
                self.assertFalse((root/items[1]['chart']).exists())

    def test_canonical_csv_source_state_evidence_numeric_and_order_gates_precede_rendering(self):
        mutations = [
            lambda rows:rows[1].__setitem__(0,'UNKNOWN-FIT'),
            lambda rows:rows[1].__setitem__(1,'FORGED-SOURCE'),
            lambda rows:rows[1].__setitem__(2,'TEST-MOLECULE'),
            lambda rows:rows[1].__setitem__(3,'SOLID'),
            lambda rows:rows[1].__setitem__(4,'FORGED-VARIANT'),
            lambda rows:rows[1].__setitem__(5,'299'),
            lambda rows:rows[1].__setitem__(6,'NaN'),
            lambda rows:rows[1].__setitem__(6,'0'),
            lambda rows:rows[1].__setitem__(9,'0'),
            lambda rows:rows[1].__setitem__(10,'MEASURED'),
            lambda rows:rows.__setitem__(slice(1,None),rows[4:]+rows[1:4]),
            lambda rows:rows.__setitem__(slice(1,4),list(reversed(rows[1:4]))),
            lambda rows:rows.append(rows[1]),
            lambda rows:rows[0].__setitem__(6,'wrong-column'),
        ]
        for index, mutate in enumerate(mutations):
            with self.subTest(index=index):
                root, items, _, write = self.fixture()
                rows=list(csv.reader(io.StringIO((root/items[1]['csv']).read_text())))
                mutate(rows);stream=io.StringIO(newline='');csv.writer(stream).writerows(rows)
                write(items[1]['csv'],stream.getvalue())
                before=(root/plot.RECEIPT_PATH).read_bytes();calls=[]
                with self.assertRaisesRegex(ValueError,'CSV'):
                    plot.plot_thermochemistry(root,[29],lambda *args,**kwargs:calls.append(args))
                self.assertEqual(calls,[]);self.assertEqual((root/plot.RECEIPT_PATH).read_bytes(),before)
                self.assertFalse((root/items[1]['chart']).exists())

    def test_scoped_merge_preserves_other_receipts_and_asset_bytes(self):
        root, items, prior, write = self.fixture()
        before = (root/items[0]['chart']).read_bytes()
        calls = []
        def renderer(repo, item, preview):
            calls.append((item['record_id'],preview))
            write(item['chart'],'New temporary chart bytes.\n')
            return {'record_id':item['record_id'],'chart':item['chart'],'chart_sha256':plot.digest(repo/item['chart']),
                    'matplotlib_version':'CURRENT'}
        self.assertEqual(plot.plot_thermochemistry(root,[29],renderer),1)
        merged=json.loads((root/plot.RECEIPT_PATH).read_text(encoding='utf-8'))
        self.assertEqual(calls,[('MAT:0029',True)])
        self.assertEqual(merged['elements'][0],prior['elements'][0])
        self.assertEqual(merged['matplotlib_version'],'PRIOR')
        self.assertEqual((root/items[0]['chart']).read_bytes(),before)
        self.assertEqual([r['record_id'] for r in merged['elements']],['MAT:0013','MAT:0029'])

    def test_invalid_selection_or_edited_target_preflights_without_mutation(self):
        root, items, _, write = self.fixture()
        receipt_bytes=(root/plot.RECEIPT_PATH).read_bytes()
        for selected in ([29,30], [29,29], [], [False]):
            with self.assertRaises(ValueError):plot.prepare_plot_plan(root,selected)
        write(items[1]['chart'],'Unrecognised existing target.\n')
        with self.assertRaisesRegex(ValueError,'unrecognised or edited'):plot.prepare_plot_plan(root,[29])
        write(items[0]['chart'],'Edited previously owned chart.\n')
        with self.assertRaisesRegex(ValueError,'unrecognised or edited'):plot.prepare_plot_plan(root,[13])
        self.assertEqual((root/plot.RECEIPT_PATH).read_bytes(),receipt_bytes)

    def test_missing_selection_input_and_wrong_owner_paths_are_rejected(self):
        root, items, _, write = self.fixture()
        write('.mat-local/thermochemistry-plot-input.json',json.dumps(items[:1]))
        with self.assertRaisesRegex(ValueError,'absent'):plot.prepare_plot_plan(root,[29])
        changed=dict(items[1]);changed['chart']=items[0]['chart']
        write('.mat-local/thermochemistry-plot-input.json',json.dumps([items[0],changed]))
        with self.assertRaisesRegex(ValueError,'canonical owner'):plot.prepare_plot_plan(root,[29])

    def test_source_gap_selection_preserves_manifest_and_generates_nothing(self):
        root, _, _, _ = self.fixture()
        before=(root/plot.RECEIPT_PATH).read_bytes()
        def forbidden(*args,**kwargs):raise AssertionError('A source gap must not render a numeric chart.')
        self.assertEqual(plot.plot_thermochemistry(root,[21],forbidden),0)
        self.assertEqual((root/plot.RECEIPT_PATH).read_bytes(),before)

    def test_default_run_plans_all_fit_owners_and_keeps_default_preview_policy(self):
        root, _, _, write = self.fixture()
        calls=[]
        def renderer(repo,item,preview):
            calls.append((item['record_id'],preview))
            write(item['chart'],'Default temporary chart bytes.\n')
            return {'record_id':item['record_id'],'chart':item['chart'],'chart_sha256':plot.digest(repo/item['chart']),
                    'matplotlib_version':'CURRENT'}
        self.assertEqual(plot.plot_thermochemistry(root,renderer=renderer),2)
        self.assertEqual(calls,[('MAT:0013',False),('MAT:0029',False)])
        manifest=json.loads((root/plot.RECEIPT_PATH).read_text(encoding='utf-8'))
        self.assertEqual(len(manifest['elements']),2)


if __name__ == '__main__':
    unittest.main()
