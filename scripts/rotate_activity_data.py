"""Rotate published library activity workbooks into the dashboard data files.

Each financial year is configured in ``YEAR_SOURCES`` and normalised into a
common record schema before the output datasets are generated.
"""

import csv
import json
from datetime import datetime, timedelta
import openpyxl

ACTIVITY_WORKBOOK_2023_2024 = './data/Libraries Activity Data 2023-24 FINAL.xlsx'
ACTIVITY_WORKBOOK_2024_2026 = './data/Libraries Activity Data - official statistic release.xlsx'
POPULATION = './data/mye24tablesew.csv'
AUTHORITIES = './data/uk_local_authorities.csv'
LIBRARY_SERVICES = './data/library_authorities.json'
NEAREST_NEIGHBOURS = './data/localauthoritynearestneighboursengland.csv'

SERVICES = './data/services.csv'
LOANS = './data/loans.csv'
USERS = './data/users.csv'
VISITS = './data/visits.csv'
EVENTS = './data/events.csv'
ATTENDANCE = './data/event_attendance.csv'
COMPUTER_USAGE = './data/computers.csv'
WIFI_SESSIONS = './data/wifi.csv'
CLICK_COLLECT = './data/click_and_collect.csv'

SERVICES_JSON = './public/services.json'
LOANS_JSON = './public/loans.json'
USERS_JSON = './public/users.json'
VISITS_JSON = './public/visits.json'
EVENTS_JSON = './public/events.json'
ATTENDANCE_JSON = './public/attendance.json'
COMPUTER_USAGE_JSON = './public/computers.json'
WIFI_SESSIONS_JSON = './public/wifi.json'

MONTHS = ('april', 'may', 'june', 'july', 'august', 'september',
          'october', 'november', 'december', 'january', 'february', 'march')
AUTHORITY_ALIASES = {
    'Bristol, City of': 'City of Bristol',
    'Camridgeshire': 'Cambridgeshire',
    'Dorset': 'Dorset Council',
    'East Riding Of Yorkshire': 'East Riding of Yorkshire',
    'Herefordshire, County of': 'Herefordshire',
    'Kingston upon Hull, City of': 'Kingston upon Hull',
    'Kingston Upon Thames': 'Kingston upon Thames',
    'Middlesborough': 'Middlesbrough',
    'Newcastle Upon Tyne': 'Newcastle upon Tyne',
    'Richmond Upon Thames': 'Richmond upon Thames',
    'Southend': 'Southend-on-Sea',
}
YEAR_SOURCES = {
    '2023/2024': {
        'workbook': ACTIVITY_WORKBOOK_2023_2024,
        'worksheet': 'Activity Data 2024',
        'mapper': 'published_labels',
    },
    '2024/2025': {
        'workbook': ACTIVITY_WORKBOOK_2024_2026,
        'worksheet': 'Usable data 2425',
        'mapper': 'question_codes',
        'member_prefix': 'Q7',
        'metric_prefixes': {
            'events': 'Q4', 'attendance': 'Q12', 'loans': 'Q17',
            'digital_loans': 'Q21', 'visits': 'Q8', 'additional_lending': 'Q9',
            'computer_usage': 'Q10',
        },
        'month_codes': {
            'events': tuple(range(1, 13)),
            'attendance': (1, 2, 3, 4, 13, 14, 15, 16, 17, 18, 19, 20),
            'loans': (1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 12, 13),
            'digital_loans': tuple(range(1, 13)),
            'visits': (1, 2, 3, 4, 14, 15, 16, 17, 18, 19, 20, 21),
            'additional_lending': (1, 2, 3, 4, 13, 14, 15, 16, 17, 18, 19, 20),
            'computer_usage': (1, 2, 3, 4, 13, 14, 15, 16, 17, 18, 19, 20),
        },
    },
    '2025/2026': {
        'workbook': ACTIVITY_WORKBOOK_2024_2026,
        'worksheet': 'Usable data 2526',
        'mapper': 'question_codes',
        'member_prefix': 'Q3a',
        'metric_prefixes': {
            'events': 'Q5a', 'attendance': 'Q7a', 'loans': 'Q8a',
            'digital_loans': 'Q10a', 'visits': 'Q11a',
            'additional_lending': 'Q12a', 'computer_usage': 'Q14a',
        },
        'month_codes': {
            'events': tuple(range(1, 13)),
            'attendance': (1, 2, 3, 4, 13, 14, 15, 16, 17, 18, 19, 20),
            'loans': (1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 12),
            'digital_loans': tuple(range(1, 13)),
            'visits': (1, 2, 3, 4, 14, 15, 16, 17, 18, 19, 20, 21),
            'additional_lending': (1, 2, 3, 4, 13, 14, 15, 16, 17, 18, 19, 20),
            'computer_usage': (1, 2, 3, 4, 13, 14, 15, 16, 17, 18, 19, 20),
        },
    },
}
LEGACY_MONTH_NAMES = ('April', 'May', 'June', 'July', 'August', 'Sept',
                      'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'March')
MONTHLY_LABELS = {
    'total_physical_events': 'Total Number Of Physical Events',
    'physical_events_adults': 'Physical Events Adults Age 18',
    'physical_events_11_under': 'Physical Events Children 11 And Under',
    'physical_events_12_17': 'Physical Events Young People Between 12 And 17',
    'physical_events_all_ages': 'Physical Events All Age Groups',
    'total_digital_events': 'Total Number Of Digital Events',
    'digital_events_adults': 'Digital Events Adults Age 18',
    'digital_events_11_under': 'Digital Events Children 11 And Under',
    'digital_events_12_17': 'Digital Events Young People Between 12 And 17',
    'digital_events_all_ages': 'Digital Events All Age Groups',
    'total_attendees_physical_events': 'Total Attendees At Physical Events',
    'physical_attendees_adults': 'Physical Attendees Adults',
    'physical_attendees_11_under': 'Physical Attendees Children 11 And Under',
    'physical_attendees_12_17': 'Physical Attendees Young People Between 12 And 17',
    'total_attendees_digital_events': 'Total Attendees At Digital Events',
    'digital_attendees_adults': 'Digital Attendees Adults',
    'digital_attendees_11_under': 'Digital Attendees Children 11 And Under',
    'digital_attendees_12_17': 'Digital Attendees Young People Between 12 And 17',
    'total_physical_book_issues': 'Total Number Of Physical Book Issues',
    'loans_adult': 'Loans And Lending Adult 18',
    'loans_11_under': 'Loans And Lending Children Under 12',
    'loans_12_17': 'Loans And Lending Young People Under 12 17',
    'total_physical_audiobook_issues': 'Total Number Of Physical Audio Book Issues',
    'total_ebook_issues': 'Total Number Of Ebooks Issues',
    'ebooks_adult': 'Ebooks Adult 18',
    'ebooks_11_under': 'Ebooks Children Under 12',
    'ebooks_12_17': 'Ebooks Young People Under 12 17',
    'total_digital_audiobook_issues': 'Total Number Of Digital Audio Book Issues',
    'digital_audiobook_issues_adult': 'Digital Audio Book Issues Adult 18',
    'digital_audiobook_issues_11_under': 'Digital Audio Book Issues Children Under 12',
    'digital_audiobook_issues_12_17': 'Digital Audio Book Issues Young People Under 12 17',
    'physical_visits': 'Physical Visitors To Library Sites Where There Is No Co Location',
    'physical_visits_no_colocation': 'Physical Visitors Co Location',
    'mobile_libraries': 'Mobile Libraries',
    'home_delivery': 'Home Delivery',
    'click_and_collect': 'Click And Collect',
    'hours_public_computers': 'Number Of Hours Physical Public Pcs Library Issues Devices',
    'wifi_sessions': 'Number Of Sessions Of Wifi Access',
}
MEMBER_LABELS = {
    'total_active_members': 'Total Active Members',
    'active_members_11_under': 'Active Members - Children (≤11)',
    'active_members_adults': 'Active Members - Adults (18+)',
    'active_members_12_17': 'Active Members - Teens (12-17)',
}
QUESTION_CODE_GROUPS = {
    'events': (
        'total_physical_events', 'physical_events_11_under',
        'physical_events_12_17', 'physical_events_adults',
        'physical_events_all_ages', 'total_digital_events',
        'digital_events_11_under', 'digital_events_12_17',
        'digital_events_adults', 'digital_events_all_ages',
    ),
    'attendance': (
        'total_attendees_physical_events', 'physical_attendees_11_under',
        'physical_attendees_12_17', 'physical_attendees_adults',
        'total_attendees_digital_events',
        'digital_attendees_11_under', 'digital_attendees_12_17',
        'digital_attendees_adults',
    ),
    'loans': (
        'total_physical_book_issues', 'loans_11_under', 'loans_12_17',
        'loans_adult', 'total_physical_audiobook_issues',
        'loans_11_under_digital', 'loans_12_17_digital', 'loans_adult_digital',
    ),
    'digital_loans': (
        'total_ebook_issues', 'ebooks_11_under', 'ebooks_12_17', 'ebooks_adult',
        'total_digital_audiobook_issues', 'digital_audiobook_issues_11_under',
        'digital_audiobook_issues_12_17', 'digital_audiobook_issues_adult',
    ),
    'visits': ('physical_visits', 'physical_visits_no_colocation'),
    'additional_lending': ('click_and_collect', 'mobile_libraries', 'home_delivery'),
    'computer_usage': ('hours_public_computers', 'wifi_sessions'),
}
SERVICE_TOTAL_GROUPS = {
    'events': (('events', 1), ('events', 6)),
    'attendance': (('attendance', 1), ('attendance', 5)),
    'loans': (('loans', 1), ('loans', 5), ('digital_loans', 1), ('digital_loans', 5)),
    'computer_hours': (('computer_usage', 1),),
    'wifi_sessions': (('computer_usage', 2),),
}
DATA_QUALITY_EXCLUSIONS = {
    '2023/2024': {
        'users': {
            'authorities': {'E06000031', 'E06000036'},
        },
        'computer_usage': {
            'authorities': {'E08000021', 'E10000031'},
            'values': {'2236995718'},
        },
    },
}


def financial_year_start(year):
    """Return the calendar year in which a financial-year label starts."""
    return int(year.split('/')[0])


def financial_year_label(start_year):
    """Return the financial-year label beginning in ``start_year``."""
    return f'{start_year}/{start_year + 1}'


def financial_year_month_start(start_year, month_offset):
    """Return an ISO date for an April-to-March month offset."""
    month_number = month_offset + 4
    calendar_year = start_year + (month_number - 1) // 12
    return f'{calendar_year}-{(month_number - 1) % 12 + 1:02d}-01'


def string_values(row):
    """Convert source cell values to strings while preserving missing values."""
    return {key: '' if value is None else str(value) for key, value in row.items()}


def numeric_cell_value(value):
    """Return a count as text, converting Excel duration cells to numeric days."""
    if isinstance(value, timedelta):
        value = value.total_seconds() / 86400
    if isinstance(value, float) and value.is_integer():
        value = int(value)
    return str(value) if isinstance(value, (int, float)) or str(value).isdigit() else ''


def number_value(value):
    """Convert a numeric string to an integer when possible, otherwise a float."""
    number = float(value)
    return int(number) if number.is_integer() else number


def has_positive_count(row, fields):
    """Return whether any of the supplied canonical fields contains a positive count."""
    return any(int(row.get(field, 0) or 0) > 0 for field in fields)


def service_total(row, field, records):
    """Use a published service total when present, otherwise sum detailed records."""
    total = row.get(field)
    if total not in (None, ''):
        return number_value(total)
    return sum(int(record['Count']) for record in records)


def is_excluded(year, metric, authority_code, value):
    """Return whether a documented exceptional value must be omitted."""
    exclusions = DATA_QUALITY_EXCLUSIONS.get(year, {}).get(metric, {})
    return (authority_code in exclusions.get('authorities', set())
            or str(value) in exclusions.get('values', set()))


def published_label_rows(worksheet, year):
    """Translate the 2023/24 published labels into the common field names."""
    headers = [cell.value for cell in next(worksheet.iter_rows(max_row=1))]
    for values in worksheet.iter_rows(min_row=2, values_only=True):
        source = dict(zip(headers, values))
        authority = source.get('Library Authority (Upper Tier Local Authority)')
        if not authority:
            continue

        authority = AUTHORITY_ALIASES.get(authority, authority)
        row = {
            'authority': authority,
            'library_details': source.get('Library Details', authority),
            '_year': year,
        }

        for field, source_name in MEMBER_LABELS.items():
            row[field] = source.get(source_name, '')
        for field, source_name in MONTHLY_LABELS.items():
            for index, month_name in enumerate(MONTHS):
                calendar_year = financial_year_start(year) + (index + 3) // 12
                header = f'{source_name} - {LEGACY_MONTH_NAMES[index]} {calendar_year}'
                row[f'{field}_{month_name}'] = source.get(header, '')
        for field in ('loans_adult', 'loans_11_under', 'loans_12_17'):
            source_name = MONTHLY_LABELS[field]
            for index, month_name in enumerate(MONTHS):
                calendar_year = financial_year_start(year) + (index + 3) // 12
                header = f'{source_name} - {LEGACY_MONTH_NAMES[index]} {calendar_year}_digital'
                row[f'{field}_{month_name}_digital'] = source.get(header, '')

        yield string_values(row)


def question_code_rows(worksheet, year, source_config):
    """Translate later published Q-code columns into the common field names."""
    headers = [cell.value for cell in next(worksheet.iter_rows(max_row=1))]
    member_prefix = source_config['member_prefix']
    for values in worksheet.iter_rows(min_row=2, values_only=True):
        source = dict(zip(headers, values))
        authority = source.get('Q1')
        if (not authority or str(authority).lower().startswith('library service')
                or str(authority).startswith('{')):
            continue

        authority = AUTHORITY_ALIASES.get(authority, authority)
        row = {
            'authority': authority,
            'library_details': authority,
            '_year': year,
            'total_active_members': source.get(f'{member_prefix}_1_1', ''),
            'active_members_11_under': source.get(f'{member_prefix}_2_1', ''),
            'active_members_adults': source.get(f'{member_prefix}_3_1', ''),
            'active_members_12_17': source.get(f'{member_prefix}_4_1', ''),
        }
        for output_metric, groups in SERVICE_TOTAL_GROUPS.items():
            row[f'_service_{output_metric}'] = sum(
                number_value(numeric_cell_value(
                    source.get(f"{source_config['metric_prefixes'][metric]}_{group}_Total", '')) or 0)
                for metric, group in groups)
        for metric, fields in QUESTION_CODE_GROUPS.items():
            prefix = source_config['metric_prefixes'][metric]
            month_codes = source_config['month_codes'][metric]
            for group_number, field in enumerate(fields, 1):
                monthly_values = []
                for month_code, month_name in zip(month_codes, MONTHS):
                    value = numeric_cell_value(
                        source.get(f'{prefix}_{group_number}_{month_code}', ''))
                    row[f'{field}_{month_name}'] = value
                    monthly_values.append(value)

                annual_total = numeric_cell_value(
                    source.get(f'{prefix}_{group_number}_Total', ''))
                if annual_total not in (None, '') and not any(
                    int(value or 0) > 0 for value in monthly_values):
                    for month_name in MONTHS:
                        row[f'{field}_{month_name}'] = ''
                    row[field] = annual_total
        yield string_values(row)


def load_activity_rows():
    """Load every configured financial year into the common activity schema."""
    rows = []
    workbooks = {}
    for year, source_config in YEAR_SOURCES.items():
        required_config = {'workbook', 'worksheet', 'mapper'}
        missing_config = required_config - source_config.keys()
        if missing_config:
            raise ValueError(
                f"Source for {year} is missing: {', '.join(sorted(missing_config))}")

        workbook_path = source_config['workbook']
        if workbook_path not in workbooks:
            workbooks[workbook_path] = openpyxl.load_workbook(
                workbook_path, read_only=True, data_only=True)
        workbook = workbooks[workbook_path]
        worksheet_name = source_config['worksheet']
        if worksheet_name not in workbook.sheetnames:
            raise ValueError(
                f"Worksheet '{worksheet_name}' for {year} is not in {workbook_path}")

        worksheet = workbook[worksheet_name]
        if source_config['mapper'] == 'published_labels':
            rows.extend(published_label_rows(worksheet, year))
        elif source_config['mapper'] == 'question_codes':
            rows.extend(question_code_rows(worksheet, year, source_config))
        else:
            raise ValueError(
                f"Unknown mapper '{source_config['mapper']}' for {year}")
    return rows


def calculate_record_frequency(records):
    """Classify a metric's source records as monthly, quarterly, or yearly."""
    unique_periods = set()
    for record in records:
        if record.get('Period'):
            unique_periods.add(record['Period'])

    if not unique_periods or len(unique_periods) == 1:
        return 'Yearly'
    if len(unique_periods) == 4:
        return 'Quarterly'
    return 'Monthly'

def convert_date_to_quarterly(date_str):
    """Convert a quarter-ending month date to its ISO three-month period."""
    date_obj = datetime.strptime(date_str, "%Y-%m-%d")
    # Set to the first of the month
    new_date = date_obj.replace(day=1)
    # Subtract 2 months from the date
    current_month = new_date.month
    if current_month == 1 or current_month == 2:
        new_date = new_date.replace(
            year=new_date.year - 1, month=12 + (current_month - 2))
    new_date = new_date.replace(month=(current_month - 2) % 12 or 12)

    period = new_date.strftime("%Y-%m-%d") + '/P3M'

    return period


def convert_values_to_monthly(data):
    """Expand quarterly and annual records into evenly distributed monthly data."""
    for record in data:
        if 'Period' in record and 'P1M' in record['Period']:
            original_period = record['Period']
            original_date_obj = datetime.strptime(
                original_period.split('/')[0], "%Y-%m-%d")
            record['Period'] = original_date_obj.strftime("%Y-%m")
        elif 'Period' in record and 'P3M' in record['Period']:
            # We need to adjust the count to be a third and add two new records
            original_count = int(record['Count'])
            new_count = int(original_count / 3)
            # Round up to the nearest integer
            record['Count'] = new_count
            original_period = record['Period']
            original_date_obj = datetime.strptime(
                original_period.split('/')[0], "%Y-%m-%d")

            record['Period'] = original_date_obj.strftime("%Y-%m")

            original_date_month = original_date_obj.month
            original_date_year = original_date_obj.year

            first_new_month = None
            second_new_month = None
            if original_date_month == 11:
                first_new_month = original_date_obj.replace(
                    month=12, year=original_date_year + 1).strftime("%Y-%m")
                second_new_month = original_date_obj.replace(
                    month=1, year=original_date_year + 1).strftime("%Y-%m")
            elif original_date_month == 12:
                first_new_month = original_date_obj.replace(
                    month=1, year=original_date_year + 1).strftime("%Y-%m")
                second_new_month = original_date_obj.replace(
                    month=2, year=original_date_year + 1).strftime("%Y-%m")
            else:
                first_new_month = original_date_obj.replace(
                    month=original_date_month + 1, year=original_date_year).strftime("%Y-%m")
                second_new_month = original_date_obj.replace(
                    month=original_date_month + 2, year=original_date_year).strftime("%Y-%m")

            new_records = [
                {**record, 'Period': first_new_month, 'Count': new_count},
                {**record, 'Period': second_new_month, 'Count': new_count}
            ]
            data.extend(new_records)

        elif 'Period' in record and 'P1Y' in record['Period']:
            # We need to adjust the count to be each month and add 11 new records
            original_count = int(record['Count'])
            new_count = int(original_count / 12)
            # Round up to the nearest integer
            record['Count'] = new_count
            original_period = record['Period']
            start_year = int(original_period[:4])
            record['Period'] = f'{start_year}-04'

            new_records = []
            for i in range(1, 12):
                new_month = (4 + i - 1) % 12 + 1
                new_year = start_year + ((4 + i - 1) // 12)
                new_date_str = f"{new_year}-{new_month:02d}"
                new_records.append(
                    {**record, 'Period': new_date_str, 'Count': new_count})

            data.extend(new_records)

    return data

def convert_values_to_yearly(data):
    """Format annual records as financial-year labels for the service dataset."""
    for record in data:
        if 'Period' in record and 'P1Y' in record['Period']:
            start_year = int(record['Period'][:4])
            record['Period'] = f'{start_year}/{start_year + 1}'

    return data


def rotate_activity_data():
    """Generate all CSV and JSON dashboard datasets for configured financial years."""

    library_services = None
    # Read the library services json to create a dictionary of all english library services
    with open(LIBRARY_SERVICES, mode='r', encoding='utf-8') as lib_services_file:
        library_services_data = json.load(lib_services_file)
        library_services = {service['code']: service for service in library_services_data if service['nation'] == 'England'}

    activity_rows = load_activity_rows()
    reporting_years = sorted({financial_year_start(row['_year'])
                              for row in activity_rows})

    with open(POPULATION, mode='r', newline='', encoding='utf-8-sig') as population_file, \
            open(AUTHORITIES, mode='r', newline='', encoding='utf-8') as authorities_file, \
            open(NEAREST_NEIGHBOURS, mode='r', newline='', encoding='utf-8-sig') as nearest_neighbours_file, \
            open(USERS, mode='w', newline='', encoding='utf-8') as users_out, \
            open(EVENTS, mode='w', newline='', encoding='utf-8') as events_out, \
            open(ATTENDANCE, mode='w', newline='', encoding='utf-8') as attendance_out, \
            open(LOANS, mode='w', newline='', encoding='utf-8') as loans_out, \
            open(CLICK_COLLECT, mode='w', newline='', encoding='utf-8') as click_collect_out, \
            open(VISITS, mode='w', newline='', encoding='utf-8') as visits_out, \
            open(COMPUTER_USAGE, mode='w', newline='', encoding='utf-8') as computer_usage_out, \
            open(WIFI_SESSIONS, mode='w', newline='', encoding='utf-8') as wifi_sessions_out, \
            open(SERVICES, mode='w', newline='', encoding='utf-8') as services_out:

        # Create a lookup dictionary for population data
        population = {}
        population_reader = csv.DictReader(population_file)
        for row in population_reader:
            authority_code = row['Code']

            # The column headers are each age year e.g '0', '1', '2', ..., '90+'
            # Loop through the columns to calculate the population for each age group
            under_12 = 0
            age_12_17 = 0
            adult = 0
            for key in row:
                if key.isdigit():
                    age = int(key)
                    if age < 12:
                        under_12 = under_12 + int(row[key])
                    elif 12 <= age <= 17:
                        age_12_17 = age_12_17 + int(row[key])
                    else:
                        adult = adult + int(row[key])
                if key == '90+':
                    # Handle the '90+' case separately
                    adult = adult + int(row[key])

            population[authority_code] = {
                'under_12': under_12,
                '12_17': age_12_17,
                'adult': adult
            }

        # Create a lookup dictionary for nearest neighbours
        nearest_neighbours = {}
        empty_neighbours = [None, None, None, None, None]
        neighbours_reader = csv.DictReader(nearest_neighbours_file)
        for row in neighbours_reader:
            authority_code = row['Upper tier local authority code']
            neighbour_1 = row['Neighbour 1']
            neighbour_2 = row['Neighbour 2']
            neighbour_3 = row['Neighbour 3']
            neighbour_4 = row['Neighbour 4']
            neighbour_5 = row['Neighbour 5']
            if authority_code not in nearest_neighbours:
                nearest_neighbours[authority_code] = []
            nearest_neighbours[authority_code].extend([neighbour_1, neighbour_2, neighbour_3, neighbour_4, neighbour_5])

        # Create a lookup dictionary for authorities
        authorities = {}
        authorities_reader = csv.DictReader(authorities_file)
        for authority_row in authorities_reader:
            # If not a library service ignore
            if authority_row['gss-code'] not in library_services:
                continue
            auth_object = {
                'gss-code': authority_row['gss-code'],
                'official-name': authority_row['official-name'],
                'nice-name': authority_row['nice-name'],
            }
            # Add nice name and population to the library service
            if authority_row['gss-code'] in library_services:
                library_services[authority_row['gss-code']]['nice-name'] = authority_row['nice-name']
                library_services[authority_row['gss-code']]['population'] = population.get(
                    authority_row['gss-code'], {'under_12': 0, '12_17': 0, 'adult': 0, 'unknown': 0})

            # Add nearest neighbours to the library service
            if authority_row['gss-code'] in nearest_neighbours:
                library_services[authority_row['gss-code']]['nearest_neighbours'] = nearest_neighbours[authority_row['gss-code']]

            # Use both official name and nice name as keys for lookup
            authorities[authority_row['nice-name']] = auth_object
            authorities[authority_row['official-name']] = auth_object

        users_writer = csv.DictWriter(users_out, fieldnames=[
            'Authority', 'Period', 'Age group', 'Count'])
        users_writer.writeheader()
        users = []

        events_writer = csv.DictWriter(events_out, fieldnames=[
            'Authority', 'Event type', 'Age group', 'Period', 'Count'])
        events_writer.writeheader()
        events = []

        attendance_writer = csv.DictWriter(attendance_out, fieldnames=[
            'Authority', 'Event type', 'Age group', 'Period', 'Count'])
        attendance_writer.writeheader()
        attendance = []

        loans_writer = csv.DictWriter(loans_out, fieldnames=[
            'Authority', 'Format', 'Content age group', 'Period', 'Count'])
        loans_writer.writeheader()
        loans = []

        click_collect_writer = csv.DictWriter(click_collect_out, fieldnames=[
            'Authority', 'Period', 'Count'])
        click_collect_writer.writeheader()
        click_collect = []

        visits_writer = csv.DictWriter(visits_out, fieldnames=[
            'Authority', 'Location', 'Period', 'Count'])
        visits_writer.writeheader()
        visits = []

        computer_usage_writer = csv.DictWriter(computer_usage_out, fieldnames=[
            'Authority', 'Period', 'Count'])
        computer_usage_writer.writeheader()
        computer_usage = []

        wifi_sessions_writer = csv.DictWriter(wifi_sessions_out, fieldnames=[
            'Authority', 'Period', 'Count'])
        wifi_sessions_writer.writeheader()
        wifi_sessions = []

        service_writer = csv.DictWriter(services_out, fieldnames=['Authority code',
                                                                  'Authority nice name',
                                                                  'Library service',
                                                                  'Period', 'Users', 'Events',
                                                                  'Attendance', 'Loans', 'Visits',
                                                                  'Computer hours', 'Wifi sessions',
                                                                  'Population under 12',
                                                                  'Population 12-17',
                                                                  'Population adult', 'Nearest neighbour 1',
                                                                  'Nearest neighbour 2', 'Nearest neighbour 3',
                                                                  'Nearest neighbour 4', 'Nearest neighbour 5'])
        service_writer.writeheader()
        services = []

        # Each row is all the authority's activity data for the year
        for row in activity_rows:

            start_year = financial_year_start(row['_year'])
            authority = row['authority']
            library_service = row['library_details']
            authority_code = None
            authority_nice_name = None
            auth_pop = None
            auth_neighbours = None

            authority_users = []
            authority_events = []
            authority_attendance = []
            authority_loans = []
            authority_click_collect = []
            authority_visits = []
            authority_computer_usage = []
            authority_wifi_sessions = []

            # Check if the authority exists in the authorities data
            if authority in authorities:
                authority_code = authorities[authority]['gss-code']
                authority_nice_name = authorities[authority]['nice-name']
                auth_neighbours = nearest_neighbours.get(authority_code, empty_neighbours)
                auth_pop = population.get(authority_code, {'under_12': 0, '12_17': 0, 'adult': 0})
            else:
                # If the authority is not found, we skip this row.
                print(
                    f"Authority '{authority}' not found in authorities data.")
                continue

            # Each row is a single reading which could be a monthly count or other data point.
            for header, value in row.items():

                # Month is a common aspect of the header name e.g. 'september'.
                # We need to adjust the month to YYYY-MM-DD format and add the period
                period_start = None

                for month_offset, month_name in enumerate(MONTHS):
                    if month_name in header:
                        period_start = financial_year_month_start(
                            start_year, month_offset)
                        break

                # Age group is common in the header e.g. 'adults', '11_under', '12_17', 'all_ages'
                age_group = None

                if 'adult' in header:
                    age_group = 'Adult'
                elif '11_under' in header:
                    age_group = 'Under 12'
                elif '12_17' in header:
                    age_group = '12-17'
                elif 'all_ages' in header:
                    age_group = 'All ages'

                physical_digital = None
                if 'physical' in header:
                    physical_digital = 'Physical'
                elif 'digital' in header:
                    physical_digital = 'Digital'

                # Users: We want a schema of Authority, Age Group, Count
                if (header.startswith('active_members') and value.isdigit()
                    and not is_excluded(row['_year'], 'users', authority_code, value)):
                    authority_users.append({
                        'Authority': authority_code,
                        'Period': f'{start_year}-04-01/P1Y',
                        'Age group': age_group,
                        'Count': value
                    })

                if header.startswith('total_active_members'):
                    # We record the total users IF there is no data for the individual age groups.
                    if (row.get('active_members_11_under') == ""
                            and row.get('active_members_adults') == ""
                            and row.get('active_members_12_17') == ""
                            and value.isdigit()
                            and not is_excluded(row['_year'], 'users', authority_code, value)):
                        authority_users.append({
                            'Authority': authority_code,
                            'Period': f'{start_year}-04-01/P1Y',
                            'Age group': 'Unknown',
                            'Count': value
                        })

                # Events: We want a schema of Authority, Event type, Age Group, Period, Count
                if header.startswith('physical_events') or \
                        header.startswith('digital_events'):
                    if value is not None and value != "":
                        authority_events.append({
                            'Authority': authority_code,
                            'Event type': physical_digital,
                            'Age group': age_group,
                            'Period': period_start,
                            'Count': value
                        })
                if header.startswith('total_physical_events'):
                    # Record total physical events IF no data for the individual months.
                    if not has_positive_count(
                            row, [field for field in row
                                  if field.startswith('physical_events_')]):
                        if value is not None and value != "":
                            authority_events.append({
                                'Authority': authority_code,
                                'Event type': physical_digital,
                                'Age group': 'Unknown',
                                'Period': period_start,
                                'Count': value
                            })
                if header.startswith('total_digital_events'):
                    # Record the total digital events IF there is no data for the individual months.
                    if not has_positive_count(
                            row, [field for field in row
                                  if field.startswith('digital_events_')]):
                        if value is not None and value != "":
                            authority_events.append({
                                'Authority': authority_code,
                                'Event type': physical_digital,
                                'Age group': 'Unknown',
                                'Period': period_start,
                                'Count': value
                            })

                # Attendance
                if header.startswith('physical_attendees') or \
                        header.startswith('digital_attendees'):
                    if value is not None and value != "":
                        authority_attendance.append({
                            'Authority': authority_code,
                            'Event type': physical_digital,
                            'Age group': age_group,
                            'Period': period_start,
                            'Count': value
                        })
                if header.startswith('total_attendees_physical_events'):
                    # Record total physical attendance IF no data for the individual months.
                    if not has_positive_count(
                            row, [field for field in row
                                  if field.startswith('physical_attendees_')]):
                        if value is not None and value != "":
                            authority_attendance.append({
                                'Authority': authority_code,
                                'Event type': physical_digital,
                                'Age group': 'Unknown',
                                'Period': period_start,
                                'Count': value
                            })
                if header.startswith('total_attendees_digital_events'):
                    # Record total digital attendance IF no data for the individual months.
                    if not has_positive_count(
                            row, [field for field in row
                                  if field.startswith('digital_attendees_')]):
                        if value is not None and value != "":
                            authority_attendance.append({
                                'Authority': authority_code,
                                'Event type': physical_digital,
                                'Age group': 'Unknown',
                                'Period': period_start,
                                'Count': value
                            })

                # Click and collect: There are no totals for click and collect
                if header.startswith('click_and_collect'):
                    # Click and Collect: Authority, Period, Count
                    if value is not None and value != "":
                        authority_click_collect.append({
                            'Authority': authority_code,
                            'Period': period_start,
                            'Count': value
                        })

                # Loans: we want a schema of Authority, Format, Content age group, Period, Count
                # Formats are Physical book, Physical audiobook, Ebook, Eaudio
                format_type = 'Physical book'
                if '_digital' in header or 'physical_audiobook' in header:
                    format_type = 'Physical audiobook'
                elif 'ebook' in header:
                    format_type = 'Ebook'
                elif 'digital_audiobook' in header:
                    format_type = 'Eaudio'

                # Age category physical book and audiobook loans
                if header.startswith('loans_') or header.startswith('ebooks_') or \
                        header.startswith('digital_audiobook_issues_'):
                    if value is not None and value != "":
                        authority_loans.append({
                            'Authority': authority_code,
                            'Format': format_type,
                            'Content age group': age_group,
                            'Period': period_start,
                            'Count': value
                        })

                if header.startswith('total_physical_book_issues'):
                    # Record total physical book loans IF no data for the individual months.
                    if not has_positive_count(
                            row, [field for field in row
                                  if field.startswith('loans_')
                                  and not field.endswith('_digital')]):
                        if value is not None and value != "":
                            authority_loans.append({
                                'Authority': authority_code,
                                'Format': format_type,
                                'Content age group': 'Unknown',
                                'Period': period_start,
                                'Count': value
                            })

                if header.startswith('total_physical_audiobook_issues'):
                    # Record total physical audiobook loans IF no data for the individual months.
                    if not has_positive_count(
                            row, [field for field in row
                                  if field.startswith('loans_')
                                  and field.endswith('_digital')]):
                        if value is not None and value != "":
                            authority_loans.append({
                                'Authority': authority_code,
                                'Format': format_type,
                                'Content age group': 'Unknown',
                                'Period': period_start,
                                'Count': value
                            })

                if header.startswith('total_ebook_issues'):
                    # Record total ebook loans IF no data for the individual months.
                    if not has_positive_count(
                            row, [field for field in row
                                  if field.startswith('ebooks_')]):
                        if value is not None and value != "":
                            authority_loans.append({
                                'Authority': authority_code,
                                'Format': format_type,
                                'Content age group': 'Unknown',
                                'Period': period_start,
                                'Count': value
                            })

                if header.startswith('total_digital_audiobook_issues'):
                    # Record total digital audiobook loans IF no data for the individual months.
                    if not has_positive_count(
                            row, [field for field in row
                                  if field.startswith('digital_audiobook_issues_')]):
                        if value is not None and value != "":
                            authority_loans.append({
                                'Authority': authority_code,
                                'Format': format_type,
                                'Content age group': 'Unknown',
                                'Period': period_start,
                                'Count': value
                            })

                # Visits: Authority, Location, Period, Count
                if header.startswith('physical_visits'):
                    location = 'Library'
                    if 'no_colocation' in header:
                        location = 'Shared building'
                    if value is not None and value != "":
                        authority_visits.append({
                            'Authority': authority_code,
                            'Location': location,
                            'Period': period_start,
                            'Count': value
                        })

                if header.startswith('mobile_libraries'):
                    if value is not None and value != "":
                        authority_visits.append({
                            'Authority': authority_code,
                            'Location': 'Mobile library',
                            'Period': period_start,
                            'Count': value
                        })

                if header.startswith('home_delivery'):
                    if value is not None and value != "":
                        authority_visits.append({
                            'Authority': authority_code,
                            'Location': 'Home delivery',
                            'Period': period_start,
                            'Count': value
                        })

                # Computer usage: Authority, Period, Count (hours)
                if header.startswith('hours_public_computers'):
                    if (value is not None and value != ""
                            and not is_excluded(row['_year'], 'computer_usage', authority_code, value)):
                        authority_computer_usage.append({
                            'Authority': authority_code,
                            'Period': period_start,
                            'Count': value
                        })

                # Wifi sessions: Authority, Period, Sessions
                if header.startswith('wifi_sessions'):
                    if value is not None and value != "":
                        authority_wifi_sessions.append({
                            'Authority': authority_code,
                            'Period': period_start,
                            'Count': value
                        })

            # Add the authority's data to the services list
            users_count = sum(
                int(record['Count']) for record in authority_users)
            events_count = service_total(
                row, '_service_events', authority_events)
            attendance_count = service_total(
                row, '_service_attendance', authority_attendance)
            loans_count = service_total(row, '_service_loans', authority_loans)
            visits_count = sum(
                int(record['Count']) for record in authority_visits)
            computer_hours_count = service_total(
                row, '_service_computer_hours', authority_computer_usage)
            wifi_sessions_count = service_total(
                row, '_service_wifi_sessions', authority_wifi_sessions)

            # If any of the counts are 0 set to None``
            services.append({
                'Authority code': authority_code,
                'Authority nice name': authority_nice_name,
                'Library service': library_service,
                'Period': financial_year_label(start_year),
                'Users': users_count if users_count > 0 else None,
                'Events': events_count if events_count > 0 else None,
                'Attendance': attendance_count if attendance_count > 0 else None,
                'Loans': loans_count if loans_count > 0 else None,
                'Visits': visits_count if visits_count > 0 else None,
                'Computer hours': computer_hours_count if computer_hours_count > 0 else None,
                'Wifi sessions': wifi_sessions_count if wifi_sessions_count > 0 else None,
                'Population under 12': auth_pop['under_12'],
                'Population 12-17': auth_pop['12_17'],
                'Population adult': auth_pop['adult'],
                'Nearest neighbour 1': auth_neighbours[0],
                'Nearest neighbour 2': auth_neighbours[1],
                'Nearest neighbour 3': auth_neighbours[2],
                'Nearest neighbour 4': auth_neighbours[3],
                'Nearest neighbour 5': auth_neighbours[4]
            })

            users.extend(authority_users)

            # Events: split the array into arrays grouped by just event type and age group
            events_dict = {}
            for record in authority_events:
                key = (record['Event type'],
                       record['Age group'])
                if key not in events_dict:
                    events_dict[key] = []
                events_dict[key].append(record)

            # Then for each grouping we need to work out if the dates are monthly or quarterly
            event_frequency = None
            for (event_type, event_age), records in events_dict.items():
                event_frequency = calculate_record_frequency(records)

                for record in records:
                    period = None
                    if event_frequency == 'Monthly':
                        period = record['Period'] + '/P1M'
                    elif event_frequency == 'Quarterly':
                        period = convert_date_to_quarterly(record['Period'])
                    elif event_frequency == 'Yearly':
                        period = f'{start_year}-04-01/P1Y'

                    record['Period'] = period

            # Flatten the dictionary back into a list
            authority_events = [
                record for records in events_dict.values() for record in records]
            events.extend(authority_events)

            # Attendance: split the array into arrays grouped by just event type and age group
            attendance_dict = {}
            for record in authority_attendance:
                key = (record['Event type'],
                       record['Age group'])
                if key not in attendance_dict:
                    attendance_dict[key] = []
                attendance_dict[key].append(record)
            # Then for each grouping we need to work out if the dates are monthly or quarterly
            attendance_frequency = None
            for (event_type, event_age), records in attendance_dict.items():
                attendance_frequency = calculate_record_frequency(records)

                for record in records:
                    period = None
                    if attendance_frequency == 'Monthly':
                        period = record['Period'] + '/P1M'
                    elif attendance_frequency == 'Yearly':
                        period = f'{start_year}-04-01/P1Y'
                    elif attendance_frequency == 'Quarterly':
                        period = convert_date_to_quarterly(record['Period'])
                    record['Period'] = period

            # Flatten the dictionary back into a list
            authority_attendance = [
                record for records in attendance_dict.values() for record in records]
            attendance.extend(authority_attendance)

            # Loans: split the array into arrays grouped by just format and age group
            loans_dict = {}
            for record in authority_loans:
                key = (record['Format'],
                       record['Content age group'])
                if key not in loans_dict:
                    loans_dict[key] = []
                loans_dict[key].append(record)

            # For each grouping work out if the dates are monthly, quarterly, or yearly
            loans_frequency = None
            for (content_format, content_age_group), records in loans_dict.items():
                loans_frequency = calculate_record_frequency(records)
                if loans_frequency != 'Yearly':
                    records = [record for record in records if record.get('Period')]
                    loans_dict[(content_format, content_age_group)] = records

                for record in records:
                    period = None
                    if loans_frequency == 'Monthly':
                        period = record['Period'] + '/P1M'
                    elif loans_frequency == 'Quarterly':
                        period = convert_date_to_quarterly(record['Period'])
                    elif loans_frequency == 'Yearly':
                        period = f'{start_year}-04-01/P1Y'
                    record['Period'] = period

            # Flatten the dictionary back into a list
            authority_loans = [record for records in loans_dict.values()
                               for record in records]
            loans.extend(authority_loans)

            # Visits: split the array into arrays grouped by colocation
            visits_dict = {}
            for record in authority_visits:
                key = record['Location']
                if key not in visits_dict:
                    visits_dict[key] = []
                visits_dict[key].append(record)

            # Then for each grouping we need to work out if the dates are monthly or quarterly
            visits_frequency = None
            for (location), records in visits_dict.items():
                visits_frequency = calculate_record_frequency(records)

                for record in records:
                    period = None
                    if visits_frequency == 'Monthly':
                        period = record['Period'] + '/P1M'
                    elif visits_frequency == 'Quarterly':
                        period = convert_date_to_quarterly(record['Period'])
                    elif visits_frequency == 'Yearly':
                        period = f'{start_year}-04-01/P1Y'
                    record['Period'] = period

            # Flatten the dictionary back into a list
            authority_visits = [
                record for records in visits_dict.values() for record in records]
            visits.extend(authority_visits)

            # Click and collect: No need to group but do convert the period
            cc_visits_frequency = calculate_record_frequency(authority_click_collect)
            for record in authority_click_collect:
                period = None
                if cc_visits_frequency == 'Quarterly':
                    period = convert_date_to_quarterly(record['Period'])
                elif cc_visits_frequency == 'Yearly':
                    period = f'{start_year}-04-01/P1Y'
                else:
                    period = record['Period'] + '/P1M'
                record['Period'] = period
            click_collect.extend(authority_click_collect)

            # Computer usage: No need to group but convert the period
            computer_usage_frequency = calculate_record_frequency(authority_computer_usage)

            for record in authority_computer_usage:
                period = None
                if computer_usage_frequency == 'Quarterly':
                    period = convert_date_to_quarterly(record['Period'])
                elif computer_usage_frequency == 'Yearly':
                    period = f'{start_year}-04-01/P1Y'
                else:
                    period = record['Period'] + '/P1M'
                record['Period'] = period
            computer_usage.extend(authority_computer_usage)

            # Wifi sessions: No need to group but convert the period
            wifi_sessions_frequency = calculate_record_frequency(authority_wifi_sessions)

            for record in authority_wifi_sessions:
                period = None
                if wifi_sessions_frequency == 'Quarterly':
                    period = convert_date_to_quarterly(record['Period'])
                elif wifi_sessions_frequency == 'Yearly':
                    period = f'{start_year}-04-01/P1Y'
                else:
                    period = record['Period'] + '/P1M'
                record['Period'] = period
            wifi_sessions.extend(authority_wifi_sessions)

        # Extend the services data to include any library service not in the data
        existing_services = {(service['Authority code'], service['Period'])
                             for service in services}

        for lib_service in library_services.values():
            for start_year in reporting_years:
                period = financial_year_label(start_year)
                if (lib_service['code'], period) in existing_services:
                    continue
                services.append({
                    'Authority code': lib_service['code'],
                    'Authority nice name': lib_service['nice-name'],
                    'Library service': lib_service.get('name', 'Unknown'),
                    'Period': period,
                    'Users': None,
                    'Events': None,
                    'Attendance': None,
                    'Loans': None,
                    'Visits': None,
                    'Computer hours': None,
                    'Wifi sessions': None,
                    'Population under 12': lib_service['population']['under_12'],
                    'Population 12-17': lib_service['population']['12_17'],
                    'Population adult': lib_service['population']['adult'],
                    'Nearest neighbour 1': lib_service.get('nearest_neighbours', empty_neighbours)[0],
                    'Nearest neighbour 2': lib_service.get('nearest_neighbours', empty_neighbours)[1],
                    'Nearest neighbour 3': lib_service.get('nearest_neighbours', empty_neighbours)[2],
                    'Nearest neighbour 4': lib_service.get('nearest_neighbours', empty_neighbours)[3],
                    'Nearest neighbour 5': lib_service.get('nearest_neighbours', empty_neighbours)[4]
                })

        # Write the aggregated data to the respective CSV files
        attendance_writer.writerows(attendance)
        users_writer.writerows(users)
        events_writer.writerows(events)
        loans_writer.writerows(loans)
        visits_writer.writerows(visits)
        click_collect_writer.writerows(click_collect)
        computer_usage_writer.writerows(computer_usage)
        wifi_sessions_writer.writerows(wifi_sessions)
        service_writer.writerows(services)

        # Convert the services dictionary array to an array of array values
        service_values = [list(service.values()) for service in services]
        with open(SERVICES_JSON, 'w', encoding='utf-8') as f:
            json.dump(service_values, f)

        user_yearly = convert_values_to_yearly(users)
        user_values = [list(user.values())
                       for user in user_yearly]
        with open(USERS_JSON, 'w', encoding='utf-8') as f:
            json.dump(user_values, f)

        loans_monthly = convert_values_to_monthly(loans)
        loans_values = [list(loan.values()) for loan in loans_monthly]
        with open(LOANS_JSON, 'w', encoding='utf-8') as f:
            json.dump(loans_values, f)

        visits_monthly = convert_values_to_monthly(visits)
        visits_values = [list(visit.values()) for visit in visits_monthly]
        with open(VISITS_JSON, 'w', encoding='utf-8') as f:
            json.dump(visits_values, f)

        events_monthly = convert_values_to_monthly(events)
        events_values = [list(event.values()) for event in events_monthly]
        with open(EVENTS_JSON, 'w', encoding='utf-8') as f:
            json.dump(events_values, f)

        attendance_monthly = convert_values_to_monthly(attendance)
        attendance_values = [list(attend.values())
                             for attend in attendance_monthly]
        with open(ATTENDANCE_JSON, 'w', encoding='utf-8') as f:
            json.dump(attendance_values, f)

        computer_usage_monthly = convert_values_to_monthly(computer_usage)
        computer_usage_values = [list(cu.values())
                                 for cu in computer_usage_monthly]
        with open(COMPUTER_USAGE_JSON, 'w', encoding='utf-8') as f:
            json.dump(computer_usage_values, f)

        wifi_sessions_monthly = convert_values_to_monthly(wifi_sessions)
        wifi_sessions_values = [list(ws.values())
                                for ws in wifi_sessions_monthly]
        with open(WIFI_SESSIONS_JSON, 'w', encoding='utf-8') as f:
            json.dump(wifi_sessions_values, f)


rotate_activity_data()
