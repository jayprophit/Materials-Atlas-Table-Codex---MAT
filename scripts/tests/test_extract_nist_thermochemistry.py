"""Temporary-fixture checks for source identity and bounded thermal source gaps."""
import contextlib
import copy
import io
import json
from pathlib import Path
import shutil
import tempfile
import types
import unittest

REPO = Path(__file__).resolve().parents[2]
SCRIPT = REPO / 'scripts/extract-nist-thermochemistry.py'
extractor = types.ModuleType('mat_thermal_extractor_fixture')
extractor.__file__ = str(SCRIPT)
exec(compile(SCRIPT.read_text(encoding='utf-8'), str(SCRIPT), 'exec'), extractor.__dict__)


class ExtractionTests(unittest.TestCase):
    def setUp(self):
        self.saved = extractor.ROOT, extractor.INPUT, extractor.ACCESSIONS, extractor.BASELINE
        self.temp = tempfile.TemporaryDirectory(prefix='mat-thermal-extraction-')
        self.root = Path(self.temp.name)
        (self.root / 'data/catalog/sources').mkdir(parents=True)
        extractor.ROOT, extractor.INPUT = self.root, None
        extractor.ACCESSIONS = {'coverage_index': {'source_id': 'SRC-000341', 'retrieved': '2026-09-29',
                                'filename': 'index.txt', 'input_filename': 'index.html',
                                'url': 'https://fixture.invalid/index'}, 'accessions': []}
        extractor.BASELINE = {35: {'z': 35, 'name': 'Bromine', 'symbol': 'Br'},
                              53: {'z': 53, 'name': 'Iodine', 'symbol': 'I'},
                              108: {'z': 108, 'name': 'Hassium', 'symbol': 'Hs'}}
        self.write('index.txt', '<html>NIST <td><a href="Br.pdf">35<br>Br</a></td></html>')

    def tearDown(self):
        extractor.ROOT, extractor.INPUT, extractor.ACCESSIONS, extractor.BASELINE = self.saved
        self.temp.cleanup()

    def write(self, filename, body):
        (self.root / 'data/catalog/sources' / filename).write_text(body, encoding='utf-8')

    def item(self, z=35, formula='Br2', result='NO-SHOMATE-IN-RETAINED-PAGE'):
        return {'z': z, 'name': extractor.BASELINE[z]['name'], 'formula': formula,
                'cas_digits': 'fixture', 'source_id': 'SRC-000999', 'retrieved': '2026-10-05',
                'comparison_table_type': None, 'expected_content': result}

    def build(self, items):
        extractor.ACCESSIONS['accessions'] = items
        with contextlib.redirect_stdout(io.StringIO()):
            extractor.build()
        return json.loads((self.root / 'data/catalog/thermochemistry-evaluation-index.json').read_text(encoding='utf-8'))

    def curated_published_fixture(self, z, phases):
        """Synthetic constant-Cp tables only; never canonical scientific data."""
        name, symbol, formula, namespace, pointer = {
            1: ('Hydrogen', 'H', 'H2', 'MOL', '/molecular_states/H2'),
            2: ('Helium', 'He', 'He', 'ATOM', '/atomic_states/0'),
            3: ('Lithium', 'Li', 'Li', 'ATOM', '/states/0'),
        }[z]
        extractor.BASELINE[z] = {'z': z, 'name': name, 'symbol': symbol}
        coefficients = ''.join(f'<tr><th>{k}</th><td>{30 if k == "A" else 0}</td></tr>' for k in 'ABCDEFGH')
        fits = ''.join('<table aria-label="' + phase + ' Phase Heat Capacity (Shomate Equation)">'
                       '<tr><th>Temperature (K)</th><td>300 to 600</td></tr>' + coefficients +
                       '<tr><th>Reference</th><td>Synthetic fixture; no scientific claim</td></tr>'
                       '<tr><th>Comment</th><td>Test only</td></tr></table>' for phase in phases)
        self.write(f'nist-thermochemistry-{z:04}-2026-10-05.html.txt',
                   '<html>NIST <li><strong><a>Formula</a>:</strong> ' + formula +
                   '</li><p>J/mol*K kJ/mol</p>' + fits + '</html>')
        self.write(f'nist-thermochemistry-{z:04}-2026-10-05-table.html.txt',
                   '<html>NIST <table aria-label="Data from Shomate Coefficients">'
                   '<tr><th>T</th><th>J/mol*K</th><th>S</th><th>G</th><th>kJ/mol</th></tr>'
                   '<tr><td>300</td><td>30</td><td>-36.119184</td><td>0</td><td>9</td></tr></table></html>')
        item = self.item(z, formula, 'PUBLISHED-SHOMATE')
        item.update(comparison_table_type='JANAFG', parent_integration='CURATED-APPEND-ONLY',
                    subject={'object_ref': f'MAT:{z:04}:{namespace}:{formula}',
                             'object_class': 'MOLECULE' if namespace == 'MOL' else 'ATOM',
                             'owner': {'path': f'records/{z:04}-{name}-{symbol}/data/structured/{z:04}-{name}-{symbol}.yaml',
                                       'pointer': pointer, 'sha256': 'a' * 64},
                             'spin_isomer_scope': 'UNSPECIFIED-IN-RETAINED-FIT' if namespace == 'MOL' else 'NOT-APPLICABLE-TO-MONATOMIC-SPECIES',
                             'isotopic_composition': 'UNSPECIFIED-IN-RETAINED-FIT'})
        return item

    def test_strict_elemental_formula_and_exact_index_identity(self):
        for formula, symbol, count in [('Cl2', 'Cl', 2), ('Br2', 'Br', 2), ('I2', 'I', 2), ('P4', 'P', 4), ('Kr', 'Kr', 1)]:
            self.assertEqual(extractor.elemental_formula_atoms(formula, symbol), count)
        for formula in ['H2O', 'NaCl', 'br2', 'Br02', 'Br0', 'Br1', 'Br2+', '79Br', 'Br9007199254740992']:
            with self.assertRaises(AssertionError):
                extractor.elemental_formula_atoms(formula, 'Br')
        index = '<td>5<br>B</td><td>35<br>Br</td><td>53<br>I</td>'
        self.assertEqual(extractor.index_cell(index, 35, 'Br'), '<td>35<br>Br</td>')
        self.assertIsNone(extractor.index_cell(index, 108, 'Hs'))

    def test_linked_index_gap_keeps_actual_cell_without_claiming_inactivity(self):
        self.write('nist-thermochemistry-0035-2026-10-05.html.txt', '<html>NIST <li><strong><a>Formula</a>:</strong> Br<sub>2</sub></li></html>')
        output = self.build([self.item()])
        self.assertEqual(output['fit_count'], 0)
        gap = output['source_gaps'][0]
        self.assertEqual(gap['source_formula'], 'Br2')
        self.assertEqual(gap['coverage_index']['element_cell_status'], 'LINKED-REQUIRES-SEPARATE-REVIEW')
        self.assertIn('<a href=', gap['coverage_index']['element_cell_as_reported'])
        self.assertNotIn('has no linked table', gap['scope'])

    def test_no_match_and_unretrieved_lookups_do_not_assert_returned_species(self):
        self.write('nist-thermochemistry-0108-2026-10-05.html.txt', '<html><title>NIST Name Not Found</title></html>')
        gap = self.build([self.item(108, 'Hs', 'NO-MATCH-IN-RETAINED-PAGE')])['source_gaps'][0]
        self.assertIsNone(gap['source_formula'])
        self.assertEqual(gap['requested_formula'], 'Hs')
        self.assertEqual(gap['coverage_index']['element_cell_status'], 'ABSENT')
        self.assertIsNotNone(gap['snapshot'])
        item = self.item(108, 'Hs', 'LOOKUP-NOT-RETRIEVED')
        item.update(source_id=None, cas_digits=None)
        gap = self.build([item])['source_gaps'][0]
        self.assertIsNone(gap['snapshot'])
        self.assertIsNone(gap['retrieved'])
        self.assertIsNone(gap['source_id'])
        self.assertEqual(gap['reviewed'], '2026-10-05')
        self.assertEqual(gap['retrieval_status'], 'NOT-RETRIEVED')

    def test_no_match_cannot_hide_a_returned_identity_or_a_wrong_species(self):
        self.write('nist-thermochemistry-0035-2026-10-05.html.txt', '<html>NIST Species not found <li><strong><a>Formula</a>:</strong> Br<sub>2</sub></li></html>')
        with self.assertRaises(AssertionError):
            self.build([self.item(result='NO-MATCH-IN-RETAINED-PAGE')])
        with self.assertRaises(AssertionError):
            self.build([self.item(formula='I2')])

    def test_molecular_publisher_fit_retains_coefficients_and_formula_basis(self):
        for z, symbol in [(35, 'Br'), (53, 'I')]:
            coefficients = ''.join(f'<tr><th>{k}</th><td>{30 if k == "A" else 0}</td></tr>' for k in 'ABCDEFGH')
            fit = '<table aria-label="Gas Phase Heat Capacity (Shomate Equation)"><tr><th>Temperature (K)</th><td>300 to 600</td></tr>' + coefficients + '<tr><th>Reference</th><td>Synthetic fixture</td></tr><tr><th>Comment</th><td>Test only</td></tr></table>'
            self.write(f'nist-thermochemistry-{z:04}-2026-10-05.html.txt', '<html>NIST <li><strong><a>Formula</a>:</strong> ' + symbol + '<sub>2</sub></li><p>J/mol*K kJ/mol</p>' + fit + '</html>')
            self.write(f'nist-thermochemistry-{z:04}-2026-10-05-table.html.txt', '<html>NIST <table aria-label="Data from Shomate Coefficients"><tr><th>T</th><th>J/mol*K</th><th>S</th><th>G</th><th>kJ/mol</th></tr><tr><td>300</td><td>30</td><td>-36.119184</td><td>0</td><td>9</td></tr></table></html>')
            item = self.item(z, symbol + '2', 'PUBLISHED-SHOMATE')
            item['comparison_table_type'] = 'JANAFG'
            element = self.build([item])['elements'][0]
            self.assertEqual(element['molar_basis'], 'mol ' + symbol + '2')
            self.assertEqual(element['atoms_per_source_formula'], 2)
            self.assertEqual(element['heat_capacity_fits'][0]['coefficients']['A']['value'], 30)

    def test_preexisting_catalogue_owners_extract_identically(self):
        _, _, original_accessions, original_baseline = self.saved
        extractor.ACCESSIONS = copy.deepcopy(original_accessions)
        extractor.ACCESSIONS['accessions'] = [item for item in extractor.ACCESSIONS['accessions'] if 13 <= item['z'] <= 34]
        extractor.BASELINE = original_baseline
        index = extractor.ACCESSIONS['coverage_index']
        shutil.copyfile(REPO / 'data/catalog/sources' / index['filename'], self.root / 'data/catalog/sources' / index['filename'])
        old = json.loads((REPO / 'data/catalog/thermochemistry-evaluation-index.json').read_text(encoding='utf-8'))
        elements = [item for item in old['elements'] if 13 <= item['z'] <= 34]
        gaps = [item for item in old['source_gaps'] if 13 <= item['z'] <= 34]
        for item in elements + gaps:
            for key in ['snapshot', 'publisher_table_snapshot']:
                snapshot = item.get(key)
                if snapshot:
                    shutil.copyfile(REPO / snapshot['path'], self.root / snapshot['path'])
        output = self.build(extractor.ACCESSIONS['accessions'])
        self.assertEqual(output['elements'], elements)
        self.assertEqual(output['source_gaps'], gaps)

    def test_curated_gas_rejects_mixed_condensed_and_unknown_retained_phases_without_catalogue_write(self):
        catalogue = self.root / 'data/catalog/thermochemistry-evaluation-index.json'
        previous = b'{"previous_catalogue":"retained exactly"}\r\n'
        for z in [1, 2, 3]:
            for phase in ['Solid', 'Liquid', 'Unknown']:
                for phases in [[phase], ['Gas', phase]]:
                    with self.subTest(z=z, phases=phases):
                        item = self.curated_published_fixture(z, phases)
                        catalogue.write_bytes(previous)
                        with self.assertRaisesRegex(AssertionError, 'Curated thermochemistry GAS-only.*phase binding'):
                            self.build([item])
                        self.assertEqual(catalogue.read_bytes(), previous)

    def test_curated_gas_requires_JANAFG_comparison_without_catalogue_write(self):
        catalogue = self.root / 'data/catalog/thermochemistry-evaluation-index.json'
        previous = b'{"previous_catalogue":"retained exactly"}\r\n'
        for z in [1, 2, 3]:
            for comparison in ['JANAFS', 'JANAFL', None, 'UNREVIEWED']:
                with self.subTest(z=z, comparison=comparison):
                    item = self.curated_published_fixture(z, ['Gas'])
                    item['comparison_table_type'] = comparison
                    catalogue.write_bytes(previous)
                    with self.assertRaisesRegex(AssertionError, 'Curated thermochemistry GAS-only.*JANAFG'):
                        self.build([item])
                    self.assertEqual(catalogue.read_bytes(), previous)

    def test_legacy_all_phase_extraction_retains_every_fit_without_a_curated_subject(self):
        item = self.curated_published_fixture(3, ['Gas', 'Liquid', 'Solid'])
        del item['parent_integration']
        del item['subject']
        output = self.build([item])
        element = output['elements'][0]
        self.assertEqual(output['fit_count'], 3)
        self.assertEqual([fit['phase'] for fit in element['heat_capacity_fits']], ['GAS', 'LIQUID', 'SOLID'])
        self.assertEqual([fit['fit_id'] for fit in element['heat_capacity_fits']],
                         [f'MAT:0003:THERMO:SHOMATE:{phase}:01' for phase in ['GAS', 'LIQUID', 'SOLID']])
        self.assertNotIn('parent_integration', element)
        self.assertNotIn('subject', element)

    def test_preexisting_curated_H2_and_He_gas_owners_extract_identically(self):
        _, _, original_accessions, original_baseline = self.saved
        extractor.ACCESSIONS = copy.deepcopy(original_accessions)
        extractor.ACCESSIONS['accessions'] = [item for item in extractor.ACCESSIONS['accessions'] if item['z'] in [1, 2]]
        extractor.BASELINE = original_baseline
        index = extractor.ACCESSIONS['coverage_index']
        shutil.copyfile(REPO / 'data/catalog/sources' / index['filename'], self.root / 'data/catalog/sources' / index['filename'])
        old = json.loads((REPO / 'data/catalog/thermochemistry-evaluation-index.json').read_text(encoding='utf-8'))
        elements = [item for item in old['elements'] if item['z'] in [1, 2]]
        self.assertEqual(len(elements), 2)
        for item in elements:
            for key in ['snapshot', 'publisher_table_snapshot']:
                snapshot = item[key]
                shutil.copyfile(REPO / snapshot['path'], self.root / snapshot['path'])
        output = self.build(extractor.ACCESSIONS['accessions'])
        self.assertEqual(output['elements'], elements)
        self.assertEqual(output['source_gaps'], [])

    def test_curated_hydrogen_subject_and_exact_publisher_link_are_retained_additively(self):
        extractor.BASELINE[1] = {'z': 1, 'name': 'Hydrogen', 'symbol': 'H'}
        coefficients = ''.join(f'<tr><th>{k}</th><td>{30 if k == "A" else 0}</td></tr>' for k in 'ABCDEFGH')
        fit = '<table aria-label="Gas Phase Heat Capacity (Shomate Equation)"><tr><th>Temperature (K)</th><td>300 to 600</td></tr>' + coefficients + '<tr><th>Reference</th><td>Synthetic fixture</td></tr><tr><th>Comment</th><td>Test only</td></tr></table>'
        self.write('nist-thermochemistry-0001-2026-10-05.html.txt', '<html>NIST <li><strong><a>Formula</a>:</strong> H<sub>2</sub></li><p>J/mol*K kJ/mol</p>' + fit + '</html>')
        self.write('nist-thermochemistry-0001-2026-10-05-table.html.txt', '<html>NIST <table aria-label="Data from Shomate Coefficients"><tr><th>T</th><th>J/mol*K</th><th>S</th><th>G</th><th>kJ/mol</th></tr><tr><td>300</td><td>30</td><td>-36.119184</td><td>0</td><td>9</td></tr></table></html>')
        item = self.item(1, 'H2', 'PUBLISHED-SHOMATE')
        item.update(comparison_table_type='JANAFG', parent_integration='CURATED-APPEND-ONLY',
                    subject={'object_ref': 'MAT:0001:MOL:H2', 'object_class': 'MOLECULE',
                             'owner': {'path': 'records/0001-Hydrogen-H/data/structured/0001-Hydrogen-H.yaml', 'pointer': '/molecular_states/H2', 'sha256': 'a' * 64},
                             'spin_isomer_scope': 'UNSPECIFIED-IN-RETAINED-FIT', 'isotopic_composition': 'UNSPECIFIED-IN-RETAINED-FIT'},
                    publisher_table_url='https://fixture.invalid/?ID=H2&Mask=1&Type=JANAFG&Table=on')
        element = self.build([item])['elements'][0]
        self.assertEqual(element['subject'], item['subject'])
        self.assertEqual(element['parent_integration'], 'CURATED-APPEND-ONLY')
        self.assertEqual(element['publisher_table_snapshot']['url'], item['publisher_table_url'])
        self.assertEqual(element['source_formula'], 'H2')
        self.assertEqual(element['atoms_per_source_formula'], 2)
        del item['subject']
        with self.assertRaises(AssertionError):
            self.build([item])

    def test_publisher_temperature_rounding_resolves_only_unique_matching_fit_endpoints(self):
        fit = {'fit_id': 'SYNTHETIC:ROUNDING:FIXTURE', 'temperature_range': {'min': 332.503, 'max': 400},
               'coefficients': {k: {'value': 30 if k == 'A' else 0} for k in 'ABCDEFGH'}}
        # Synthetic constant-Cp coefficients isolate formatting from species science.
        import math
        row = ['333.', '30.0000', f'{30*math.log(332.503/1000):.6f}', '0', f'{30*332.503/1000:.6f}']
        resolved = extractor.publisher_temperature_resolution(fit, row)
        self.assertEqual(resolved['calculation_temperature_K'], 332.503)
        self.assertEqual(resolved['calculation_temperature_basis'], 'SOURCE-FIT-BOUNDARY-WITHIN-PRINTED-TEMPERATURE-ROUNDING-CELL')
        self.assertEqual(resolved['calculation_temperature_evidence'], 'INTERPRETATION')
        self.assertEqual(resolved['printed_temperature_rounding_interval_K'], {'min': 332.5, 'max': 333.5})
        self.assertEqual(row[0], '333.')
        with self.assertRaises(AssertionError):
            extractor.publisher_temperature_resolution(fit, ['333.', '29.0000', row[2], '0', row[4]])
        ambiguous = copy.deepcopy(fit)
        # Both endpoints match the coarse printed properties and formatting
        # interval, while nominal T is outside the fit: reject ambiguity.
        ambiguous['coefficients'] = {k: {'value': 0} for k in 'ABCDEFGH'}
        ambiguous['coefficients']['A']['value'] = .01
        ambiguous_row = ['333.', '0', '0', '0', '0']
        # Force nominal T outside this source range so the endpoint gate is used.
        ambiguous['temperature_range'] = {'min': 332.6, 'max': 332.9}
        with self.assertRaises(AssertionError):
            extractor.publisher_temperature_resolution(ambiguous, ambiguous_row)
        outside = copy.deepcopy(fit)
        outside['temperature_range']['min'] = 332.4
        outside_row = ['333.', '30.0000', f'{30*math.log(332.4/1000):.6f}', '0', f'{30*332.4/1000:.6f}']
        with self.assertRaises(AssertionError):
            extractor.publisher_temperature_resolution(outside, outside_row)
        exact = ['333.', '30.0000', f'{30*math.log(333/1000):.6f}', '0', f'{30*333/1000:.6f}']
        self.assertEqual(extractor.publisher_temperature_resolution(fit, exact), {})

    def test_curated_monatomic_helium_retains_reviewed_slots_and_rejects_invalid_allocations(self):
        extractor.BASELINE[2] = {'z': 2, 'name': 'Helium', 'symbol': 'He'}
        coefficients = ''.join(f'<tr><th>{k}</th><td>{30 if k == "A" else 0}</td></tr>' for k in 'ABCDEFGH')
        fit = '<table aria-label="Gas Phase Heat Capacity (Shomate Equation)"><tr><th>Temperature (K)</th><td>300 to 600</td></tr>' + coefficients + '<tr><th>Reference</th><td>Synthetic fixture</td></tr><tr><th>Comment</th><td>Test only</td></tr></table>'
        self.write('nist-thermochemistry-0002-2026-10-05.html.txt', '<html>NIST <li><strong><a>Formula</a>:</strong> He</li><p>J/mol*K kJ/mol</p>' + fit + '</html>')
        self.write('nist-thermochemistry-0002-2026-10-05-table.html.txt', '<html>NIST <table aria-label="Data from Shomate Coefficients"><tr><th>T</th><th>J/mol*K</th><th>S</th><th>G</th><th>kJ/mol</th></tr><tr><td>300</td><td>30</td><td>-36.119184</td><td>0</td><td>9</td></tr></table></html>')
        item = self.item(2, 'He', 'PUBLISHED-SHOMATE')
        item.update(comparison_table_type='JANAFG', parent_integration='CURATED-APPEND-ONLY', asset_slots={'table': 10, 'graph': 10},
                    subject={'object_ref': 'MAT:0002:ATOM:He', 'object_class': 'ATOM',
                             'owner': {'path': 'records/0002-Helium-He/data/structured/0002-Helium-He.yaml', 'pointer': '/atomic_states/0', 'sha256': 'a' * 64},
                             'spin_isomer_scope': 'NOT-APPLICABLE-TO-MONATOMIC-SPECIES', 'isotopic_composition': 'UNSPECIFIED-IN-RETAINED-FIT'})
        element = self.build([item])['elements'][0]
        self.assertEqual(element['asset_slots'], {'table': 10, 'graph': 10})
        self.assertEqual(element['subject'], item['subject'])
        self.assertEqual(element['atoms_per_source_formula'], 1)
        for slots in [None, {}, {'table': 10}, {'table': 10, 'graph': 10, 'extra': 1},
                      *({'table': 10, 'graph': value} for value in [0, -1, 1.5, '10', True, 9007199254740992])]:
            item['asset_slots'] = slots
            with self.assertRaises(AssertionError):
                self.build([item])
        item['asset_slots'] = {'table': 10.0, 'graph': 10.0}
        self.assertEqual(self.build([item])['elements'][0]['asset_slots'], {'table': 10, 'graph': 10})
        del item['asset_slots']
        self.assertNotIn('asset_slots', self.build([item])['elements'][0])


if __name__ == '__main__':
    unittest.main()
