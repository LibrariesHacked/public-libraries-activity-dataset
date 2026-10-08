"""Focused regression checks for the source audit and its anomaly rules."""

import csv
from collections import defaultdict
from datetime import timedelta
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import audit_activity_data as audit
import rotate_activity_data as rotation


class AuditTests(unittest.TestCase):
    def test_annual_formula_evidence_distinguishes_cached_and_manual_totals(self):
        expected = '=SUM(G37:R37)'
        self.assertIn('cached result', audit.annual_formula_evidence(expected, expected))
        self.assertIn('cached result', audit.annual_formula_evidence('=ROUND(SUM(G37:R37),0)', expected))
        self.assertIn('directly entered', audit.annual_formula_evidence(11061, expected))
        self.assertIn('inspect its references', audit.annual_formula_evidence('=SUM(G36:R36)', expected))
        evidence = audit.annual_formula_evidence(expected, expected, numeric_text_sum=950, difference=950)
        self.assertIn('ignores numeric text', evidence)
        self.assertNotIn('stale', evidence)

    def test_numeric_source_strings_preserve_whitespace_padded_counts(self):
        for source, expected in [('950\t', '950'), (' 1689 ', '1689'), ('1945\n', '1945'), ('0\t', '0')]:
            self.assertEqual(rotation.numeric_cell_value(source), expected)
        for source in ['n/a', '-', 'not collected']:
            self.assertEqual(rotation.numeric_cell_value(source), '')

    def test_missing_and_nonfinite_values_are_not_zero(self):
        for value in (None, '', 'n/a', 'nan', 'inf', True):
            self.assertIsNone(audit.numeric(value))
        self.assertEqual(audit.numeric(0), 0)
        self.assertEqual(audit.numeric(timedelta(days=150)), 150)

    def test_four_sparse_months_are_not_assumed_to_be_quarters(self):
        records = [{'Period': f'2023-{month:02d}-01', 'Count': '1'} for month in (4, 5, 6, 7)]
        self.assertEqual(rotation.calculate_record_frequency(records), 'Monthly')
        standardized = rotation.standardize_period_records(records, 2023)
        self.assertEqual([record['Period'] for record in standardized], [
            '2023-04-01/P1M', '2023-05-01/P1M', '2023-06-01/P1M', '2023-07-01/P1M'])
        quarters = [{'Period': date, 'Count': '1'} for date in (
            '2023-06-01', '2023-09-01', '2023-12-01', '2024-03-01')]
        self.assertEqual(rotation.calculate_record_frequency(quarters), 'Quarterly')

    def test_only_documented_service_change_explains_fall(self):
        row = {'name': 'Rutland', 'year': '2024/2025',
               'outreach_explanation': 'Village deliveries ended in October.'}
        severity, notes = audit.respondent_context(row, 'home_delivery', 'monthly_outlier', 'suspicious', 'Unusual fall.')
        self.assertEqual(severity, 'information')
        self.assertIn('explains the fall', notes)
        row = {'name': 'North Yorkshire', 'year': '2025/2026',
               'outreach_explanation': "We don't operate click and collect."}
        severity, notes = audit.respondent_context(row, 'home_delivery', 'monthly_outlier', 'suspicious', 'Unusual spike.')
        self.assertEqual(severity, 'suspicious')
        self.assertIn(row['outreach_explanation'], notes)
        self.assertNotIn('explains the fall', notes)
        severity, notes = audit.respondent_context(row, 'hours_public_computers', 'monthly_outlier', 'suspicious', 'Unusual spike.')
        self.assertNotIn('Respondent explanation', notes)

    @unittest.skipUnless(all(Path(config['workbook']).exists() for config in rotation.YEAR_SOURCES.values()),
                         'Original workbooks are not available')
    def test_complete_column_inventory(self):
        annual_label_mismatches = 0
        for year, config in rotation.YEAR_SOURCES.items():
            columns = audit.column_mappings(year, config)
            self.assertEqual(len(columns), len({column[3] for column in columns}))
            workbook = rotation.openpyxl.load_workbook(config['workbook'], read_only=True, data_only=True)
            rows = list(workbook[config['worksheet']].iter_rows(max_row=2, values_only=True))
            headers = rows[0]
            for _, field, month, header in columns:
                self.assertIn(header, headers)
                if config['mapper'] == 'question_codes' and field not in audit.AUXILIARY:
                    description = str(rows[1][headers.index(header)]).lower()
                    category = ' - '.join(description.split(' - ')[-3:])
                    annual_demographic_label_error = year == '2024/2025' and header.endswith('_Total') and any(
                        token in field for token in ('adult', '11_under', '12_17'))
                    if annual_demographic_label_error:
                        annual_label_mismatches += 1
                        continue
                    if 'adult' in field:
                        self.assertIn('adult', category, (year, field, header))
                    if '11_under' in field:
                        self.assertTrue('under 12' in category or '11 and under' in category, (year, field, header))
                    if '12_17' in field:
                        self.assertTrue('12-17' in category or '12 and 17' in category, (year, field, header))
                    if month != 'Annual':
                        self.assertTrue(description.rsplit(' - ', 1)[-1].startswith(month[:3]), (year, field, header))
            workbook.close()
        self.assertEqual(annual_label_mismatches, 24)

    @unittest.skipUnless(all(Path(config['workbook']).exists() for config in rotation.YEAR_SOURCES.values()),
                         'Original workbooks are not available')
    def test_annual_total_formulas_follow_monthly_groups(self):
        for year, config in rotation.YEAR_SOURCES.items():
            if config['mapper'] != 'question_codes':
                continue
            workbook = rotation.openpyxl.load_workbook(config['workbook'], read_only=True, data_only=False)
            rows = list(workbook[config['worksheet']].iter_rows(values_only=True))
            headers = rows[0]
            formula_count = 0
            for row_number, row in enumerate(rows[3:], 4):
                if not row[0]:
                    continue
                for dataset, groups in config['question_code_groups'].items():
                    for group in range(1, len(groups) + 1):
                        prefix = config['metric_prefixes'][dataset]
                        month_columns = [headers.index(f'{prefix}_{group}_{code}') + 1 for code in config['month_codes'][dataset]]
                        formula = row[headers.index(f'{prefix}_{group}_Total')]
                        if isinstance(formula, str) and formula.startswith('='):
                            formula_count += 1
                            start = rotation.openpyxl.utils.get_column_letter(min(month_columns))
                            end = rotation.openpyxl.utils.get_column_letter(max(month_columns))
                            expected = f'=SUM({start}{row_number}:{end}{row_number})'
                            self.assertIn(formula, (expected, f'=ROUND({expected[1:]},0)'),
                                          (year, row[0], prefix, group))
            self.assertGreater(formula_count, 0)
            workbook.close()

    def test_exported_records_are_unique_and_counts_are_nonnegative(self):
        for filename in ('services', 'users', 'loans', 'events', 'event_attendance', 'visits',
                         'computers', 'wifi', 'click_and_collect', 'computer_inventory'):
            with open(f'data/{filename}.csv', newline='', encoding='utf-8') as source:
                rows = list(csv.DictReader(source))
            keys = ('Authority code', 'Period') if filename == 'services' else tuple(
                field for field in rows[0] if field not in ('Count', 'Estimated count', 'Status', 'Notes'))
            identifiers = [tuple(row[field] for field in keys) for row in rows]
            self.assertEqual(len(identifiers), len(set(identifiers)), filename)
            for row in rows:
                for field in ('Count', 'Estimated count'):
                    if row.get(field) not in (None, ''):
                        self.assertTrue(row[field].isdigit(), (filename, field, row[field]))

    def test_csv_and_json_totals_agree(self):
        datasets = {
            'users': ('users', 1, 4, 3, [('Age group', 2)]),
            'loans': ('loans', 3, 5, 4, [('Format', 1), ('Content age group', 2)]),
            'events': ('events', 3, 5, 4, [('Event type', 1), ('Age group', 2)]),
            'event_attendance': ('attendance', 3, 5, 4, [('Event type', 1), ('Age group', 2)]),
            'visits': ('visits', 2, 4, 3, [('Location', 1)]),
            'computers': ('computers', 1, 3, 2, []),
            'wifi': ('wifi', 1, 3, 2, []),
            'click_and_collect': ('click_and_collect', 1, 3, 2, []),
        }

        def year_start(period):
            year = int(period[:4])
            return year - (period[4] == '-' and int(period[5:7]) < 4)

        for filename, (json_name, period_index, original_index, effective_index, dimensions) in datasets.items():
            csv_totals, json_totals = defaultdict(lambda: [0, 0]), defaultdict(lambda: [0, 0])
            with open(f'data/{filename}.csv', newline='', encoding='utf-8') as source:
                for row in csv.DictReader(source):
                    key = (row['Authority'], year_start(row['Period']), *(row[field] for field, _ in dimensions))
                    original = int(row['Count'])
                    effective = 0 if row['Status'] == 'excluded' else (
                        int(row['Estimated count']) if row['Status'] == 'replaced' and row['Estimated count'] else original)
                    csv_totals[key][0] += original
                    csv_totals[key][1] += effective
            with open(f'public/{json_name}.json', encoding='utf-8') as source:
                records = json.load(source)
            if filename == 'loans':
                records = records['records']
            for row in records:
                key = (row[0], year_start(row[period_index]), *(row[index] for _, index in dimensions))
                json_totals[key][0] += int(row[original_index] or 0)
                json_totals[key][1] += int(row[effective_index] or 0)
            self.assertEqual(dict(csv_totals), dict(json_totals), filename)

    def test_public_register_matches_csv_without_duplicate_rules(self):
        with open(rotation.ERRORS_CSV, newline='', encoding='utf-8') as source:
            rows = list(csv.DictReader(source))
        keys = [(row['Period'], row['Dataset'], row['Authority code'], row['Scope'], row['Match']) for row in rows]
        self.assertEqual(len(keys), len(set(keys)))
        with open(rotation.ERRORS_JSON, encoding='utf-8') as source:
            self.assertEqual(rows, json.load(source))

    def test_series_scope_does_not_bleed_between_formats(self):
        key = ('2023/2024', 'loans', 'TEST')
        rule = {'series': {'loans_adult': {'status': 'suspicious', 'notes': 'Books only'}}}
        with patch.dict(rotation.DATA_QUALITY_ANOMALIES, {key: rule}):
            self.assertEqual(rotation.get_anomaly_info(*key, 123, 'loans_adult_april')[0], 'suspicious')
            self.assertIsNone(rotation.get_anomaly_info(*key, 123, 'loans_adult_april_digital')[0])
            self.assertIsNone(rotation.get_anomaly_info(*key, 123, 'loans_adult_digital_april')[0])

    def test_existing_corrections_take_precedence(self):
        key = ('2023/2024', 'loans', 'TEST')
        rule = {'values': {'123': {'status': 'replaced', 'estimate': 12, 'notes': 'Known correction'}},
                'series': {'loans_adult': {'status': 'suspicious', 'notes': 'Audit'}}}
        with patch.dict(rotation.DATA_QUALITY_ANOMALIES, {key: rule}):
            self.assertEqual(rotation.get_anomaly_info(*key, 123, 'loans_adult_april')[:2], ('replaced', 12))
        rule = {'fields': {'loans_adult_april': {'status': 'replaced', 'estimate': 12, 'notes': 'Known correction'}},
                'series': {'loans_adult': {'status': 'suspicious', 'notes': 'Audit'}}}
        with patch.dict(rotation.DATA_QUALITY_ANOMALIES, {key: rule}):
            self.assertEqual(rotation.get_anomaly_info(*key, 123, 'loans_adult_april')[:2], ('replaced', 12))

    def test_register_keeps_corrections_and_attaches_explanations(self):
        with tempfile.TemporaryDirectory() as directory:
            register_path = Path(directory) / 'errors.csv'
            explanation_path = Path(directory) / 'explanations.csv'
            fields = ['Period', 'Dataset', 'Authority code', 'Authority name', 'Scope', 'Match',
                      'Status', 'Estimated count', 'Notes']
            rotation.write_csv(register_path, fields, [dict(zip(fields, [
                '2024/2025', 'visits', 'TEST', 'Test service', 'total', '', 'replaced', '100', 'Existing correction']))])
            rotation.write_csv(explanation_path, ['Period', 'Authority code', 'Source column', 'Explanation'], [
                {'Period': '2024/2025', 'Authority code': 'TEST', 'Source column': 'Q22', 'Explanation': 'Estimated from users.'}])
            finding = {'Period': '2024/2025', 'Authority code': 'TEST', 'Authority name': 'Test service',
                       'Dataset': 'visits', 'Field': 'home_delivery', 'Severity': 'suspicious',
                       'Known issue': '', 'Check': 'monthly_outlier', 'Reported': '9000',
                       'Comparator': '1000', 'Notes': 'Unusual return.'}
            with patch.object(rotation, 'ERRORS_CSV', register_path), patch.object(audit, 'EXPLANATIONS', explanation_path):
                audit.update_register([finding])
                audit.update_register([finding])
            with open(register_path, newline='', encoding='utf-8') as source:
                rows = list(csv.DictReader(source))
            self.assertEqual(len(rows), 2)
            self.assertEqual(rows[0]['Status'], 'replaced')
            self.assertEqual(rows[0]['Estimated count'], '100')
            self.assertIn('Estimated from users.', rows[0]['Notes'])


if __name__ == '__main__':
    unittest.main()