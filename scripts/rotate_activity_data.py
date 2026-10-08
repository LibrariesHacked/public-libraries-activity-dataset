"""Rotate published library activity workbooks into dashboard data files.

This script ingests public library activity data published by DCMS / Arts Council
England across multiple financial years and normalises them into unified datasets.
Outputs include both CSV files in ``./data/`` and web-ready JSON files in ``./public/``.

Supported financial years and their specific workbook formats are configured in
the ``YEAR_SOURCES`` dictionary.
"""

import csv
from datetime import datetime, timedelta
import json
import openpyxl

# =============================================================================
# INPUT FILE PATHS
# =============================================================================

# Primary library activity workbooks
# 2023/24 was published as a standalone workbook with descriptive text column headers.
ACTIVITY_WORKBOOK_2023_2024 = './data/Libraries Activity Data 2023-24 FINAL.xlsx'
# 2024/25 and 2025/26 were published in an official statistics release using survey question codes.
ACTIVITY_WORKBOOK_2024_2026 = './data/Libraries Activity Data - official statistic release.xlsx'

# Demographic and geographic reference data
# ONS mid-year 2024 population estimates by single year of age for England and Wales
POPULATION = './data/mye24tablesew.csv'
# Register of UK local authorities with GSS codes, official names, and friendly display names
AUTHORITIES = './data/uk_local_authorities.csv'
# Master registry of English library authorities
LIBRARY_SERVICES = './data/library_authorities.json'
# ONS Nearest Neighbours model mappings (5 statistical comparator authorities per English council)
NEAREST_NEIGHBOURS = './data/localauthoritynearestneighboursengland.csv'

# =============================================================================
# OUTPUT FILE PATHS (CSV DATASETS)
# =============================================================================

# Annual headline summary table per library authority
SERVICES = './data/services.csv'
# Detailed book, audiobook, ebook, and e-audiobook lending counts
LOANS = './data/loans.csv'
# Active library borrowers categorized by demographic age group
USERS = './data/users.csv'
# Physical and outreach (mobile / home delivery) library visits
VISITS = './data/visits.csv'
# Counts of physical and digital events hosted by libraries
EVENTS = './data/events.csv'
# Counts of attendees at physical and digital library events
ATTENDANCE = './data/event_attendance.csv'
# Public computer and device usage hours
COMPUTER_USAGE = './data/computers.csv'
# Public Wi-Fi access session counts
WIFI_SESSIONS = './data/wifi.csv'
# Click and collect lending order counts
CLICK_COLLECT = './data/click_and_collect.csv'
COMPUTER_INVENTORY = './data/computer_inventory.csv'
# Master log of reporting errors and data quality corrections
ERRORS_CSV = './data/errors.csv'

# =============================================================================
# OUTPUT FILE PATHS (DASHBOARD JSON DATASETS)
# =============================================================================

# Web-ready JSON files consumed by the frontend dashboard (in ./public/)
SERVICES_JSON = './public/services.json'
LOANS_JSON = './public/loans.json'
USERS_JSON = './public/users.json'
VISITS_JSON = './public/visits.json'
EVENTS_JSON = './public/events.json'
ATTENDANCE_JSON = './public/attendance.json'
COMPUTER_USAGE_JSON = './public/computers.json'
WIFI_SESSIONS_JSON = './public/wifi.json'
CLICK_COLLECT_JSON = './public/click_and_collect.json'
COMPUTER_INVENTORY_JSON = './public/computer_inventory.json'
ERRORS_JSON = './public/errors.json'

# =============================================================================
# CSV FIELDNAMES / SCHEMAS
# =============================================================================

SERVICE_FIELDNAMES = [
    'Authority code', 'Authority nice name', 'Library service', 'Period',
    'Users', 'Users estimated', 'Users status', 'Users notes',
    'Events', 'Events estimated', 'Events status', 'Events notes',
    'Attendance', 'Attendance estimated', 'Attendance status', 'Attendance notes',
    'Loans', 'Loans estimated', 'Loans status', 'Loans notes',
    'Visits', 'Visits estimated', 'Visits status', 'Visits notes',
    'Computer hours', 'Computer hours estimated', 'Computer hours status', 'Computer hours notes',
    'Wifi sessions', 'Wifi sessions estimated', 'Wifi sessions status', 'Wifi sessions notes',
    'Population under 12', 'Population 12-17', 'Population adult',
    'Nearest neighbour 1', 'Nearest neighbour 2', 'Nearest neighbour 3',
    'Nearest neighbour 4', 'Nearest neighbour 5',
]
USER_FIELDNAMES = ['Authority', 'Period', 'Age group', 'Count', 'Estimated count', 'Status', 'Notes']
EVENT_FIELDNAMES = ['Authority', 'Event type', 'Age group', 'Period', 'Count', 'Estimated count', 'Status', 'Notes']
ATTENDANCE_FIELDNAMES = ['Authority', 'Event type', 'Age group', 'Period', 'Count', 'Estimated count', 'Status', 'Notes']
LOAN_FIELDNAMES = ['Authority', 'Format', 'Content age group', 'Period', 'Count', 'Estimated count', 'Status', 'Notes']
VISIT_FIELDNAMES = ['Authority', 'Location', 'Period', 'Count', 'Estimated count', 'Status', 'Notes']
CLICK_COLLECT_FIELDNAMES = ['Authority', 'Period', 'Count', 'Estimated count', 'Status', 'Notes']
COMPUTER_INVENTORY_FIELDNAMES = ['Authority', 'Measure', 'Period', 'Count']
COMPUTER_USAGE_FIELDNAMES = ['Authority', 'Period', 'Count', 'Estimated count', 'Status', 'Notes']
WIFI_SESSIONS_FIELDNAMES = ['Authority', 'Period', 'Count', 'Estimated count', 'Status', 'Notes']

COMPUTER_INVENTORY_METRICS = {
    'inventory_computers_in_service': 'Computers and devices in service',
    'inventory_devices_for_loan': 'Devices available to borrow',
    'inventory_device_loan_issues': 'Issues of loanable devices',
}

# =============================================================================
# CALENDAR & AUTHORITY NORMALIZATION
# =============================================================================

# Months in UK local government financial year order (April to March)
MONTHS = (
    'april', 'may', 'june', 'july', 'august', 'september',
    'october', 'november', 'december', 'january', 'february', 'march',
)

# Normalizes spelling variations and naming discrepancies in survey submissions
# to canonical local authority names present in AUTHORITIES
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

# =============================================================================
# MULTI-YEAR SURVEY CONFIGURATION (YEAR_SOURCES)
# =============================================================================

# Central registry defining how each financial year is parsed:
# - workbook: Path to Excel workbook file
# - worksheet: Sheet/tab name containing usable survey data
# - mapper: Parser strategy ('published_labels' for 23/24, 'question_codes' for 24/25+)
# - member_prefix: Questionnaire code prefix for active borrowers
# - member_groups: Sub-question indices for active member demographics.
#   NOTE: The survey order swapped adults and 12-17 between 24/25 and 25/26:
#     - 2024/25: 1=Total, 2=Children (<=11), 3=Adults (18+), 4=Teens (12-17)
#     - 2025/26: 1=Total, 2=Children (<=11), 3=Teens (12-17), 4=Adults (18+)
# - metric_prefixes: Questionnaire question code prefix per metric domain
# - question_code_groups: Canonical field names mapped to sub-question indices 1..N.
#   NOTE: Demographic order in events, attendance, and loans also reflects this shift.
# - month_codes: Column suffix codes for the 12 financial year months (April..March).
#   NOTE: Book loans skip code 4 and use codes 1..3, 5..13 (where 13 = March).
YEAR_SOURCES = {
    '2023/2024': {
        'workbook': ACTIVITY_WORKBOOK_2023_2024,
        'worksheet': 'Activity Data 2024',
        'mapper': 'published_labels',
        'inventory_fields': {
            'inventory_computers_in_service': 'Pcs & Devices In Service (31/03)',
            'inventory_devices_for_loan': 'Devices Loan (31/03)',
            'inventory_device_loan_issues': 'Device Loan Issues (31/03)',
        },
    },
    '2024/2025': {
        'workbook': ACTIVITY_WORKBOOK_2024_2026,
        'worksheet': 'Usable data 2425',
        'mapper': 'question_codes',
        'member_prefix': 'Q7',
        'member_groups': {
            'total_active_members': 1,
            'active_members_11_under': 2,
            'active_members_adults': 3,
            'active_members_12_17': 4,
        },
        'metric_prefixes': {
            'events': 'Q4',
            'attendance': 'Q12',
            'loans': 'Q17',
            'digital_loans': 'Q21',
            'visits': 'Q8',
            'additional_lending': 'Q9',
            'computer_usage': 'Q10',
        },
        'question_code_groups': {
            'events': (
                'total_physical_events', 'physical_events_adults',
                'physical_events_11_under', 'physical_events_12_17',
                'physical_events_all_ages', 'total_digital_events',
                'digital_events_adults', 'digital_events_11_under',
                'digital_events_12_17', 'digital_events_all_ages',
            ),
            'attendance': (
                'total_attendees_physical_events', 'physical_attendees_adults',
                'physical_attendees_11_under', 'physical_attendees_12_17',
                'total_attendees_digital_events',
                'digital_attendees_adults', 'digital_attendees_11_under',
                'digital_attendees_12_17',
            ),
            'loans': (
                'total_physical_book_issues', 'loans_adult', 'loans_11_under',
                'loans_12_17', 'total_physical_audiobook_issues',
                'loans_adult_digital', 'loans_11_under_digital', 'loans_12_17_digital',
            ),
            'digital_loans': (
                'total_ebook_issues', 'ebooks_adult', 'ebooks_11_under', 'ebooks_12_17',
                'total_digital_audiobook_issues', 'digital_audiobook_issues_adult',
                'digital_audiobook_issues_11_under', 'digital_audiobook_issues_12_17',
            ),
            'visits': ('physical_visits', 'physical_visits_no_colocation'),
            'additional_lending': ('click_and_collect', 'mobile_libraries', 'home_delivery'),
            'computer_usage': ('hours_public_computers', 'wifi_sessions'),
        },
        'inventory_fields': {
            'inventory_computers_in_service': 'Q13_1_1',
            'inventory_devices_for_loan': 'Q13_2_1',
            'inventory_device_loan_issues': 'Q13_3_1',
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
        'member_groups': {
            'total_active_members': 1,
            'active_members_11_under': 2,
            'active_members_12_17': 3,
            'active_members_adults': 4,
        },
        'metric_prefixes': {
            'events': 'Q5a',
            'attendance': 'Q7a',
            'loans': 'Q8a',
            'digital_loans': 'Q10a',
            'visits': 'Q11a',
            'additional_lending': 'Q12a',
            'computer_usage': 'Q14a',
        },
        'question_code_groups': {
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
        },
        'inventory_fields': {
            'inventory_computers_in_service': 'Q16_1_1',
            'inventory_devices_for_loan': 'Q16_2_1',
            'inventory_device_loan_issues': 'Q16_3_1',
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
}

# =============================================================================
# LEGACY 2023/24 COLUMN HEADER MAPPINGS
# =============================================================================

# Month abbreviations used in 2023/24 workbook header strings
LEGACY_MONTH_NAMES = (
    'April', 'May', 'June', 'July', 'August', 'Sept',
    'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'March',
)

# Text header prefixes in the 2023/24 published workbook mapped to internal field names
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

# Header strings for annual active borrower questions in 2023/24
MEMBER_LABELS = {
    'total_active_members': 'Total Active Members',
    'active_members_11_under': 'Active Members - Children (≤11)',
    'active_members_adults': 'Active Members - Adults (18+)',
    'active_members_12_17': 'Active Members - Teens (12-17)',
}

# Default question code groupings (used as fallback)
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

# =============================================================================
# SUMMARY METRIC MAPPINGS & DATA QUALITY EXCLUSIONS
# =============================================================================

# Maps headline service totals in services.csv to the specific question group totals to sum.
# For example, total loans sums physical books (group 1), physical audiobooks (group 5),
# ebooks (digital loans group 1), and digital audiobooks (digital loans group 5).
SERVICE_TOTAL_GROUPS = {
    'events': (('events', 1), ('events', 6)),
    'attendance': (('attendance', 1), ('attendance', 5)),
    'loans': (('loans', 1), ('loans', 5), ('digital_loans', 1), ('digital_loans', 5)),
    'computer_hours': (('computer_usage', 1),),
    'wifi_sessions': (('computer_usage', 2),),
}

# =============================================================================
# DATA QUALITY ANOMALIES & CORRECTIONS LOADER
# =============================================================================

def load_data_quality_anomalies(file_path=ERRORS_CSV):
    """Load known reporting anomalies from errors.csv into the lookup dictionary.

    Each rule is keyed by (period, dataset, authority_code) with scopes:
    - 'values': matched against specific numeric strings (e.g. typos)
    - 'fields': matched against column name substrings
    - 'total': applied to annual headline service totals
    - 'all': applied to all rows for that authority and dataset
    """
    anomalies = {}
    with open(file_path, mode='r', newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            key = (row['Period'], row['Dataset'], row['Authority code'])
            if key not in anomalies:
                anomalies[key] = {}
            scope = row['Scope']
            match_val = row.get('Match', '')
            status = row['Status']
            est_str = row.get('Estimated count', '').strip()

            # Parse estimate (can be integer, division formula e.g. '// 60', or None)
            if not est_str:
                est = None
            elif est_str.startswith('//'):
                div = int(est_str.lstrip('/').strip())
                est = (lambda d: lambda v: int(v) // d if str(v).isdigit() else None)(div)
            elif est_str.startswith('/'):
                div = float(est_str.lstrip('/').strip())
                est = (lambda d: lambda v: int(float(v) / d) if str(v).replace('.', '', 1).isdigit() else None)(div)
            else:
                try:
                    est = int(est_str)
                except ValueError:
                    est = est_str

            notes = row.get('Notes', '')
            rule_entry = {'status': status, 'estimate': est, 'notes': notes}

            if scope == 'values':
                if 'values' not in anomalies[key]:
                    anomalies[key]['values'] = {}
                anomalies[key]['values'][match_val] = rule_entry
            elif scope == 'fields':
                if 'fields' not in anomalies[key]:
                    anomalies[key]['fields'] = {}
                anomalies[key]['fields'][match_val] = rule_entry
            elif scope == 'series':
                anomalies[key].setdefault('series', {})[match_val] = rule_entry
            elif scope == 'total':
                anomalies[key]['total'] = rule_entry
            elif scope == 'all':
                anomalies[key]['all'] = rule_entry
    return anomalies


DATA_QUALITY_ANOMALIES = load_data_quality_anomalies(ERRORS_CSV)

# =============================================================================
# DATE & UTILITY FUNCTIONS
# =============================================================================

def financial_year_start(year_label):
    """Return the calendar year in which a financial-year label starts.
    
    Example: '2023/2024' -> 2023
    """
    return int(year_label.split('/')[0])


def financial_year_label(start_year):
    """Return the standard financial-year label beginning in ``start_year``.
    
    Example: 2023 -> '2023/2024'
    """
    return f'{start_year}/{start_year + 1}'


def financial_year_month_start(start_year, month_offset):
    """Return an ISO date (YYYY-MM-01) for an April-to-March month offset.
    
    month_offset=0 corresponds to April in start_year,
    month_offset=11 corresponds to March in start_year + 1.
    """
    month_number = month_offset + 4
    calendar_year = start_year + (month_number - 1) // 12
    calendar_month = (month_number - 1) % 12 + 1
    return f'{calendar_year}-{calendar_month:02d}-01'


def convert_date_to_quarterly(date_str):
    """Convert a quarter-ending month date (YYYY-MM-01) to an ISO 8601 3-month period.
    
    Example: '2023-06-01' (June, end of Q1) -> '2023-04-01/P3M' (April start)
    """
    date_obj = datetime.strptime(date_str, "%Y-%m-%d").replace(day=1)
    current_month = date_obj.month
    if current_month <= 2:
        quarter_start = date_obj.replace(year=date_obj.year - 1, month=current_month + 10)
    else:
        quarter_start = date_obj.replace(month=current_month - 2)
    return f"{quarter_start.strftime('%Y-%m-%d')}/P3M"


def string_values(row):
    """Convert source dictionary values to strings, replacing None with empty strings."""
    return {key: '' if value is None else str(value) for key, value in row.items()}


def numeric_cell_value(value):
    """Return an Excel cell value as text, converting timedelta durations to day counts."""
    if isinstance(value, timedelta):
        value = value.total_seconds() / 86400
    if isinstance(value, float) and value.is_integer():
        value = int(value)
    if isinstance(value, (int, float)):
        return str(value)
    text = str(value).strip()
    return text if text.isdigit() else ''


def number_value(value):
    """Convert a numeric string to an int when whole, otherwise a float. Return 0 if None or non-numeric."""
    if value in (None, ''):
        return 0
    try:
        number = float(value)
        return int(number) if number.is_integer() else number
    except (ValueError, TypeError):
        return 0


def get_anomaly_info(year, metric, authority_code, value, field=None):
    """Return (status, estimated_count, notes) for a record, or (None, None, None) if normal."""
    rule = DATA_QUALITY_ANOMALIES.get((year, metric, authority_code))
    if not rule:
        return (None, None, None)

    str_val = str(value) if value is not None else ''

    # 1. Match specific value
    if 'values' in rule and str_val in rule['values']:
        info = rule['values'][str_val]
        est = info.get('estimate')
        if callable(est):
            est = est(value)
        return (info.get('status'), est, info.get('notes'))

    # 2. Match specific field substring
    if field and 'fields' in rule:
        for field_key, info in rule['fields'].items():
            if field_key in field:
                est = info.get('estimate')
                if callable(est):
                    est = est(value)
                return (info.get('status'), est, info.get('notes'))

    if field and 'series' in rule:
        series_field = field
        for month in MONTHS:
            if field.endswith(f'_{month}_digital'):
                series_field = field.removesuffix(f'_{month}_digital') + '_digital'
                break
            if field.endswith(f'_{month}'):
                series_field = field.removesuffix(f'_{month}')
                break
        if series_field in rule['series']:
            info = rule['series'][series_field]
            est = info.get('estimate')
            if callable(est):
                est = est(value)
            return (info.get('status'), est, info.get('notes'))

    # 3. Match 'all' (e.g. whole authority)
    if 'all' in rule:
        info = rule['all']
        est = info.get('estimate')
        if callable(est):
            est = est(value)
        return (info.get('status'), est, info.get('notes'))

    return (None, None, None)


def has_positive_count(row, fields, year=None, metric=None, authority_code=None):
    """Return whether any of the supplied fields contains a count greater than zero and is not excluded."""
    for field in fields:
        val = row.get(field, 0) or 0
        try:
            if float(val) > 0:
                if year and metric and authority_code:
                    status, _, _ = get_anomaly_info(year, metric, authority_code, val, field=field)
                    if status == 'excluded':
                        continue
                return True
        except (ValueError, TypeError):
            continue
    return False


def calculate_service_metric_total(row, field, records, year, metric, authority_code):
    """Calculate the headline total for a metric in services.csv and services.json.
    
    Returns: (original_count, estimated_count, status, notes)
    """
    rule = DATA_QUALITY_ANOMALIES.get((year, metric, authority_code), {})
    published = row.get(field) if field else None
    
    # Check if published value is valid number
    published_num = None
    if published not in (None, ''):
        try:
            num = float(published)
            published_num = int(num) if num.is_integer() else num
        except (ValueError, TypeError):
            published_num = None

    def records_sum(recs):
        return sum(number_value(r.get('Count', 0)) for r in recs) if recs else None

    # Check if there is an explicit headline total rule
    if 'total' in rule:
        total_rule = rule['total']
        orig = published_num if published_num is not None else records_sum(records)
        est = total_rule.get('estimate')
        status = total_rule.get('status')
        notes = total_rule.get('notes')
        return (orig, est, status, notes)

    # Check if any detailed record has an anomaly status
    flagged_records = [r for r in records if r.get('Status')]
    if flagged_records:
        orig = published_num if published_num is not None else records_sum(records)

        clean_sum = 0
        has_replacement = False
        all_excluded = True
        has_suspicious = False

        for r in records:
            r_status = r.get('Status')
            if r_status == 'replaced' and r.get('Estimated count') not in (None, ''):
                clean_sum += number_value(r['Estimated count'])
                has_replacement = True
                all_excluded = False
            elif r_status == 'excluded':
                continue
            elif r_status == 'suspicious':
                clean_sum += number_value(r['Count'])
                has_suspicious = True
                all_excluded = False
            else:
                clean_sum += number_value(r['Count'])
                all_excluded = False

        notes_str = '; '.join(dict.fromkeys(r['Notes'] for r in flagged_records if r.get('Notes')))
        if all_excluded:
            return (orig, None, 'excluded', notes_str)
        elif has_replacement:
            return (orig, clean_sum, 'replaced', notes_str)
        elif has_suspicious:
            return (orig, None, 'suspicious', notes_str)

    # Normal authority (no anomalies)
    orig = published_num if published_num is not None else records_sum(records)
    return (orig, None, None, None)


# =============================================================================
# REFERENCE DATA LOADERS
# =============================================================================

def load_library_services(file_path):
    """Load the master dictionary of English library services keyed by GSS code."""
    with open(file_path, mode='r', encoding='utf-8') as f:
        services_data = json.load(f)
        return {s['code']: s for s in services_data if s.get('nation') == 'England'}


def load_population_lookup(file_path):
    """Load ONS population estimates by age group (under 12, 12-17, adult) per authority."""
    population = {}
    with open(file_path, mode='r', newline='', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            authority_code = row['Code']
            under_12 = 0
            age_12_17 = 0
            adult = 0
            for key, val in row.items():
                if key.isdigit():
                    age = int(key)
                    count = int(val)
                    if age < 12:
                        under_12 += count
                    elif 12 <= age <= 17:
                        age_12_17 += count
                    else:
                        adult += count
                elif key == '90+':
                    adult += int(val)

            population[authority_code] = {
                'under_12': under_12,
                '12_17': age_12_17,
                'adult': adult,
            }
    return population


def load_nearest_neighbours_lookup(file_path):
    """Load ONS nearest statistical neighbours for each English authority code."""
    nearest_neighbours = {}
    with open(file_path, mode='r', newline='', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            authority_code = row['Upper tier local authority code']
            neighbours = [row[f'Neighbour {i}'] for i in range(1, 6)]
            if authority_code not in nearest_neighbours:
                nearest_neighbours[authority_code] = []
            nearest_neighbours[authority_code].extend(neighbours)
    return nearest_neighbours


def load_authorities_lookup(file_path, library_services, population, nearest_neighbours):
    """Load local authority metadata and enrich library_services with names and demographics."""
    authorities = {}
    empty_neighbours = [None, None, None, None, None]
    with open(file_path, mode='r', newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            gss_code = row['gss-code']
            if gss_code not in library_services:
                continue

            auth_object = {
                'gss-code': gss_code,
                'official-name': row['official-name'],
                'nice-name': row['nice-name'],
            }

            # Decorate library service entry with display name, population, and neighbours
            library_services[gss_code]['nice-name'] = row['nice-name']
            library_services[gss_code]['population'] = population.get(
                gss_code, {'under_12': 0, '12_17': 0, 'adult': 0, 'unknown': 0})
            if gss_code in nearest_neighbours:
                library_services[gss_code]['nearest_neighbours'] = nearest_neighbours.get(
                    gss_code, empty_neighbours)

            # Map both official name and friendly name for flexible matching
            authorities[row['nice-name']] = auth_object
            authorities[row['official-name']] = auth_object
    return authorities


# =============================================================================
# WORKBOOK PARSING FUNCTIONS
# =============================================================================

def published_label_rows(worksheet, year, source_config=None):
    """Parse 2023/24 workbook rows using descriptive text column headers."""
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

        for field, source_name in (source_config or {}).get('inventory_fields', {}).items():
            row[field] = numeric_cell_value(source.get(source_name, ''))

        # Active members
        for field, source_name in MEMBER_LABELS.items():
            row[field] = source.get(source_name, '')

        # Monthly metrics
        for field, source_name in MONTHLY_LABELS.items():
            for index, month_name in enumerate(MONTHS):
                calendar_year = financial_year_start(year) + (index + 3) // 12
                header = f'{source_name} - {LEGACY_MONTH_NAMES[index]} {calendar_year}'
                row[f'{field}_{month_name}'] = source.get(header, '')

        # Audiobooks (indicated by '_digital' suffix in 2023/24 text headers)
        for field in ('loans_adult', 'loans_11_under', 'loans_12_17'):
            source_name = MONTHLY_LABELS[field]
            for index, month_name in enumerate(MONTHS):
                calendar_year = financial_year_start(year) + (index + 3) // 12
                header = f'{source_name} - {LEGACY_MONTH_NAMES[index]} {calendar_year}_digital'
                row[f'{field}_{month_name}_digital'] = source.get(header, '')

        yield string_values(row)


def question_code_rows(worksheet, year, source_config):
    """Parse 2024/25+ workbook rows using structured questionnaire question codes."""
    headers = [cell.value for cell in next(worksheet.iter_rows(max_row=1))]
    member_prefix = source_config['member_prefix']
    member_groups = source_config['member_groups']
    question_code_groups = source_config.get('question_code_groups', QUESTION_CODE_GROUPS)

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
        }

        # Active members
        for member_field, group_num in member_groups.items():
            row[member_field] = source.get(f'{member_prefix}_{group_num}_1', '')

        # Headline service totals
        for output_metric, groups in SERVICE_TOTAL_GROUPS.items():
            row[f'_service_{output_metric}'] = sum(
                number_value(numeric_cell_value(
                    source.get(f"{source_config['metric_prefixes'][metric]}_{group}_Total", '')) or 0)
                for metric, group in groups)

        # Monthly metrics and annual fallback totals
        for metric, fields in question_code_groups.items():
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

                # If an authority reported only an annual total and no monthly counts
                # (or entered the full annual total into a single month column),
                # record the annual total under the canonical field name
                positive_months = [val for val in monthly_values if float(val or 0) > 0]
                is_single_month_annual_total = (
                    annual_total not in (None, '')
                    and len(positive_months) == 1
                    and abs(float(positive_months[0]) - float(annual_total)) < 1.0
                )
                if annual_total not in (None, '') and (len(positive_months) == 0 or is_single_month_annual_total):
                    for month_name in MONTHS:
                        row[f'{field}_{month_name}'] = ''
                    row[field] = annual_total

                for field, source_name in source_config.get('inventory_fields', {}).items():
                    row[field] = numeric_cell_value(source.get(source_name, ''))

        yield string_values(row)


def load_activity_rows():
    """Load and normalize activity data from all configured financial years."""
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
            rows.extend(published_label_rows(worksheet, year, source_config))
        elif source_config['mapper'] == 'question_codes':
            rows.extend(question_code_rows(worksheet, year, source_config))
        else:
            raise ValueError(
                f"Unknown mapper '{source_config['mapper']}' for {year}")
    return rows


# =============================================================================
# REPORTING FREQUENCY & PERIOD TRANSFORMATION HELPERS
# =============================================================================

def calculate_record_frequency(records):
    """Determine reporting frequency (Yearly, Quarterly, Monthly) from distinct periods."""
    unique_periods = set()
    for record in records:
        if record.get('Period'):
            unique_periods.add(record['Period'])

    if not unique_periods or len(unique_periods) == 1:
        return 'Yearly'
    if len(unique_periods) == 4 and {period[5:7] for period in unique_periods} == {'03', '06', '09', '12'}:
        return 'Quarterly'
    return 'Monthly'


def is_pseudo_monthly_quarterly(records):
    """Detect if records represent quarterly reporting entered with zero-placeholders for intermediate months."""
    dated_records = [
        r for r in records
        if r.get('Period') and len(r['Period']) >= 10 and r['Period'][4] == '-' and r['Period'][7] == '-'
    ]
    if len(dated_records) < 4:
        return False

    non_q = [r for r in dated_records if int(r['Period'][5:7]) in (1, 2, 4, 5, 7, 8, 10, 11)]
    q = [r for r in dated_records if int(r['Period'][5:7]) in (3, 6, 9, 12)]

    if not non_q or not q:
        return False

    all_non_q_zero = all(
        number_value(r.get('Count')) == 0 and
        (r.get('Estimated count') in (None, '') or number_value(r.get('Estimated count')) == 0)
        for r in non_q
    )
    q_pos = [
        r for r in q
        if number_value(r.get('Count')) > 0 or
        (r.get('Estimated count') not in (None, '') and number_value(r.get('Estimated count')) > 0)
    ]
    return all_non_q_zero and len(q_pos) >= 3


def standardize_period_records(group, start_year):
    """Assign standard ISO 8601 period strings to a list of records for a single metric/group."""
    if not group:
        return []

    # Check if this group represents quarterly reporting with zero-placeholders for intermediate months
    if is_pseudo_monthly_quarterly(group):
        q_records = [r for r in group if r.get('Period') and int(r['Period'][5:7]) in (3, 6, 9, 12)]
        for record in q_records:
            record['Period'] = convert_date_to_quarterly(record['Period'])
        return q_records

    frequency = calculate_record_frequency(group)
    if frequency != 'Yearly':
        group = [r for r in group if r.get('Period')]

    for record in group:
        if frequency == 'Monthly':
            record['Period'] = f"{record['Period']}/P1M"
        elif frequency == 'Quarterly':
            record['Period'] = convert_date_to_quarterly(record['Period'])
        elif frequency == 'Yearly':
            record['Period'] = f'{start_year}-04-01/P1Y'

    return group


def standardize_grouped_periods(records, key_func, start_year):
    """Assign standard ISO 8601 period strings to records grouped by category.
    
    Frequency is calculated per group so authorities reporting quarterly or annual
    figures for specific categories are correctly formatted.
    """
    grouped_records = {}
    for record in records:
        key = key_func(record)
        if key not in grouped_records:
            grouped_records[key] = []
        grouped_records[key].append(record)

    output = []
    for group in grouped_records.values():
        output.extend(standardize_period_records(group, start_year))
    return output


def standardize_loan_periods(records, start_year):
    """Assign standard ISO 8601 period strings to loan records.
    
    Loan records are grouped by format and content age group. If a group has
    sub-annual (Monthly or Quarterly) reporting, placeholder records without
    a period are excluded.
    """
    grouped_loans = {}
    for record in records:
        key = (record['Format'], record.get('Content age group', 'Total'))
        if key not in grouped_loans:
            grouped_loans[key] = []
        grouped_loans[key].append(record)

    output = []
    for group in grouped_loans.values():
        output.extend(standardize_period_records(group, start_year))
    return output


def standardize_ungrouped_periods(records, start_year):
    """Assign standard ISO 8601 period strings across all records for a metric.
    
    Used for metrics that do not have demographic or medium breakdowns
    (Click & Collect, Computer Usage, and Wi-Fi Sessions).
    """
    return standardize_period_records(records, start_year)


def split_count_evenly(value, parts):
    """Split a count across periods without losing its remainder."""
    if value is None:
        return [None] * parts
    quotient, remainder = divmod(value, parts)
    return [quotient + (index < remainder) for index in range(parts)]


def convert_values_to_monthly(data):
    """Expand quarterly and annual records into evenly distributed monthly records for JSON."""
    result = []
    for record in data:
        count_val = int(record['Count']) if record.get('Count') and str(record['Count']).isdigit() else 0
        status = record.get('Status') or ''
        est_val = None
        if record.get('Estimated count') not in (None, ''):
            est_val = int(record['Estimated count'])

        if status == 'replaced' and est_val is not None:
            effective = est_val
        elif status == 'excluded':
            effective = None
        else:
            effective = count_val

        if 'Period' in record and 'P1M' in record['Period']:
            original_period = record['Period']
            original_date_obj = datetime.strptime(original_period.split('/')[0], "%Y-%m-%d")
            result.append({
                **record,
                'Period': original_date_obj.strftime("%Y-%m"),
                'Effective count': effective,
            })

        elif 'Period' in record and 'P3M' in record['Period']:
            monthly_orig = split_count_evenly(count_val, 3)
            monthly_effective = split_count_evenly(effective, 3)
            original_period = record['Period']
            original_date_obj = datetime.strptime(original_period.split('/')[0], "%Y-%m-%d")

            month = original_date_obj.month
            year = original_date_obj.year

            # Handle quarter crossing calendar year boundary (e.g. Nov-Jan or Dec-Feb)
            if month == 11:
                month_2 = original_date_obj.replace(month=12, year=year).strftime("%Y-%m")
                month_3 = original_date_obj.replace(month=1, year=year + 1).strftime("%Y-%m")
            elif month == 12:
                month_2 = original_date_obj.replace(month=1, year=year + 1).strftime("%Y-%m")
                month_3 = original_date_obj.replace(month=2, year=year + 1).strftime("%Y-%m")
            else:
                month_2 = original_date_obj.replace(month=month + 1, year=year).strftime("%Y-%m")
                month_3 = original_date_obj.replace(month=month + 2, year=year).strftime("%Y-%m")

            for index, m_date in enumerate((original_date_obj.strftime("%Y-%m"), month_2, month_3)):
                result.append({
                    **record,
                    'Period': m_date,
                    'Count': monthly_orig[index],
                    'Effective count': monthly_effective[index],
                })

        elif 'Period' in record and 'P1Y' in record['Period']:
            monthly_orig = split_count_evenly(count_val, 12)
            monthly_effective = split_count_evenly(effective, 12)
            original_period = record['Period']
            start_year = int(original_period[:4])
            for i in range(12):
                new_month = (4 + i - 1) % 12 + 1
                new_year = start_year + ((4 + i - 1) // 12)
                result.append({
                    **record,
                    'Period': f"{new_year}-{new_month:02d}",
                    'Count': monthly_orig[i],
                    'Effective count': monthly_effective[i],
                })

        else:
            result.append({
                **record,
                'Effective count': effective,
            })

    return result


def reconcile_loan_unknown_rows(detail_records, total_records, start_year):
    """Create non-overlapping age rows, using format totals only for the Unknown remainder."""
    standardized_details = standardize_loan_periods(
        [{**record, '_source_index': index} for index, record in enumerate(detail_records)],
        start_year
    )
    standardized_totals = standardize_loan_periods(total_records, start_year)
    for record in standardized_details + standardized_totals:
        record['_source_period'] = record['Period']
    monthly_details = convert_values_to_monthly(standardized_details)
    monthly_totals = convert_values_to_monthly(standardized_totals)
    details_by_key = {}

    for record in monthly_details:
        key = (record['Authority'], record['Format'], record['Period'])
        details_by_key.setdefault(key, []).append(record)

    unknown_records = []
    review_issues_by_key = {}
    source_rows_to_flag = set()
    for total in monthly_totals:
        key = (total['Authority'], total['Format'], total['Period'])
        detail_rows = [
            record for record in details_by_key.get(key, [])
            if record.get('Content age group') != 'Unknown'
        ]
        total_original = number_value(total.get('Count'))
        detail_original = sum(number_value(record.get('Count')) for record in detail_rows)
        reported_difference = total_original - detail_original
        detail_overage = max(0, detail_original - total_original)
        unknown_original = max(0, total_original - detail_original)

        total_effective = total.get('Effective count')
        if total_effective is None:
            unknown_effective = None
            effective_overage = 0
        else:
            detail_effective = sum(
                number_value(record.get('Effective count')) for record in detail_rows
            )
            corrected_difference = total_effective - detail_effective
            effective_overage = max(0, detail_effective - total_effective)
            unknown_effective = max(0, total_effective - detail_effective)
        if total_effective is None:
            corrected_difference = None

        total_status = total.get('Status') or ''
        if total_status == 'excluded':
            status = 'excluded'
        elif total_status == 'replaced' or unknown_effective != unknown_original:
            status = 'replaced'
        elif total_status == 'suspicious' or detail_overage or effective_overage:
            status = 'suspicious'
        else:
            status = ''

        detail_anomalies = [
            record for record in detail_rows
            if record.get('Status') in ('replaced', 'suspicious', 'excluded')
            and record.get('Notes')
        ]
        should_flag_details = (
            total_status == 'suspicious'
            or effective_overage > 0
            or (detail_overage > 0 and total_status != 'replaced')
        )
        has_issue = (
            should_flag_details
            or total_status in ('replaced', 'suspicious', 'excluded')
            or bool(detail_anomalies)
        )
        issue_key = None
        if has_issue:
            source_period = total.get('_source_period', total['Period'])
            issue_key = (total['Authority'], total['Format'], source_period)
            issue = review_issues_by_key.setdefault(issue_key, {
                'authority': total['Authority'],
                'format': total['Format'],
                'sourcePeriod': source_period,
                'reportedTotal': 0,
                'ageBandSum': 0,
                'correctedTotal': 0,
                'correctedAgeBandSum': 0,
                'months': set(),
                'notes': [],
                'status': '',
            })
            issue['reportedTotal'] += total_original
            issue['ageBandSum'] += detail_original
            issue['months'].add(total['Period'])
            if total_effective is not None:
                issue['correctedTotal'] += total_effective
                issue['correctedAgeBandSum'] += sum(
                    number_value(record.get('Effective count')) for record in detail_rows
                )
            for note in [total.get('Notes'), *(record.get('Notes') for record in detail_anomalies)]:
                if note and note not in issue['notes']:
                    issue['notes'].append(note)
            statuses = [total_status, *(record.get('Status') for record in detail_anomalies)]
            if 'suspicious' in statuses or detail_overage or effective_overage:
                issue['status'] = 'suspicious'
            elif 'excluded' in statuses and issue['status'] != 'suspicious':
                issue['status'] = 'excluded'
            elif 'replaced' in statuses and issue['status'] not in ('suspicious', 'excluded'):
                issue['status'] = 'replaced'

            if should_flag_details or total_status in ('replaced', 'suspicious', 'excluded'):
                for record in detail_rows:
                    record['_review_issue_key'] = issue_key
            else:
                for record in detail_anomalies:
                    record['_review_issue_key'] = issue_key
            for record in detail_rows:
                if should_flag_details and record.get('Status') not in ('replaced', 'excluded'):
                    record['Status'] = 'suspicious'
                    if record.get('_source_index') is not None:
                        source_rows_to_flag.add(record['_source_index'])

        if unknown_original == 0 and unknown_effective in (None, 0):
            continue

        unknown_records.append({
            **total,
            'Content age group': 'Unknown',
            'Period': total['Period'],
            'Count': unknown_original,
            'Estimated count': unknown_effective if status == 'replaced' else '',
            'Status': status,
            'Notes': '',
            'Effective count': unknown_effective,
            '_review_issue_key': issue_key,
        })

    for record in standardized_details:
        source_index = record.get('_source_index')
        if source_index in source_rows_to_flag and record.get('Status') not in ('replaced', 'excluded'):
            record['Status'] = 'suspicious'

    review_issues = []
    for issue_key, issue in review_issues_by_key.items():
        source_period = issue['sourcePeriod']
        period_label = source_period.replace('/P1M', ' (month)').replace('/P3M', ' (quarter)').replace('/P1Y', ' (year)')
        difference = issue['reportedTotal'] - issue['ageBandSum']
        description = (
            f"{issue['format']} source period {period_label}: reported total "
            f"{issue['reportedTotal']:,}; age-band sum {issue['ageBandSum']:,}; "
            f"difference {difference:+,} loans."
        )
        corrected_difference = issue['correctedTotal'] - issue['correctedAgeBandSum']
        if issue['correctedTotal'] and corrected_difference != difference:
            description += (
                f" Corrected total {issue['correctedTotal']:,}; corrected age-band sum "
                f"{issue['correctedAgeBandSum']:,}; difference {corrected_difference:+,}."
            )
        if issue['notes']:
            description = '; '.join([*issue['notes'], description])
        review_issues.append({
            '_key': issue_key,
            'authority': issue['authority'],
            'format': issue['format'],
            'sourcePeriod': source_period,
            'status': issue['status'],
            'months': sorted(issue['months']),
            'note': description,
        })

    unknown_export_records = [
        {key: value for key, value in record.items()
         if key not in ('Effective count', '_source_period', '_review_issue_key')}
        for record in unknown_records
    ]
    clean_standardized_details = [
        {key: value for key, value in record.items()
         if key not in ('_source_index', '_source_period')}
        for record in standardized_details
    ]
    clean_monthly_details = [
        {key: value for key, value in record.items() if key != '_source_index'}
        for record in monthly_details
    ]
    return (
        clean_standardized_details + unknown_export_records,
        clean_monthly_details + unknown_records,
        review_issues,
    )


def convert_values_to_yearly(data):
    """Format annual P1Y records as financial-year strings (e.g. '2023/2024') for JSON."""
    result = []
    for record in data:
        count_val = int(record['Count']) if record.get('Count') and str(record['Count']).isdigit() else 0
        status = record.get('Status') or ''
        est_val = None
        if record.get('Estimated count') not in (None, ''):
            est_val = int(record['Estimated count'])

        if status == 'replaced' and est_val is not None:
            effective = est_val
        elif status == 'excluded':
            effective = None
        else:
            effective = count_val

        rec = {**record, 'Count': count_val, 'Effective count': effective}
        if 'Period' in rec and 'P1Y' in rec['Period']:
            start_year = int(rec['Period'][:4])
            rec['Period'] = f'{start_year}/{start_year + 1}'
        result.append(rec)
    return result


def write_csv(file_path, fieldnames, records):
    """Write dictionary records to a CSV file."""
    with open(file_path, mode='w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(records)


def write_json(file_path, data):
    """Serialize data to a JSON file."""
    with open(file_path, mode='w', encoding='utf-8') as f:
        json.dump(data, f)


# =============================================================================
# MAIN ROTATION PIPELINE
# =============================================================================

def rotate_activity_data():
    """Execute the full data rotation pipeline and write all CSV and JSON outputs."""
    # -------------------------------------------------------------------------
    # 1. Load reference data & activity rows
    # -------------------------------------------------------------------------
    library_services = load_library_services(LIBRARY_SERVICES)
    population = load_population_lookup(POPULATION)
    nearest_neighbours = load_nearest_neighbours_lookup(NEAREST_NEIGHBOURS)
    authorities = load_authorities_lookup(AUTHORITIES, library_services, population, nearest_neighbours)

    activity_rows = load_activity_rows()
    reporting_years = sorted({financial_year_start(row['_year']) for row in activity_rows})
    empty_neighbours = [None, None, None, None, None]

    services = []
    users = []
    events = []
    attendance = []
    loans = []
    loans_monthly = []
    loan_review_issues = []
    click_collect = []
    computer_inventory = []
    visits = []
    computer_usage = []
    wifi_sessions = []

    # -------------------------------------------------------------------------
    # 2. Extract domain records for each authority
    # -------------------------------------------------------------------------
    for row in activity_rows:
        start_year = financial_year_start(row['_year'])
        authority = row['authority']
        library_service = row['library_details']

        if authority not in authorities:
            print(f"Authority '{authority}' not found in authorities data.")
            continue

        authority_code = authorities[authority]['gss-code']
        authority_nice_name = authorities[authority]['nice-name']
        authority_neighbours = nearest_neighbours.get(authority_code, empty_neighbours)
        authority_population = population.get(authority_code, {'under_12': 0, '12_17': 0, 'adult': 0})

        for field, measure in COMPUTER_INVENTORY_METRICS.items():
            value = row.get(field, '')
            if value not in (None, ''):
                computer_inventory.append({
                    'Authority': authority_code,
                    'Measure': measure,
                    'Period': financial_year_label(start_year),
                    'Count': number_value(value),
                })

        authority_users = []
        authority_events = []
        authority_attendance = []
        authority_loans = []
        authority_loan_totals = []
        authority_click_collect = []
        authority_visits = []
        authority_computer_usage = []
        authority_wifi_sessions = []

        for header, value in row.items():
            # Determine calendar start date for monthly metrics (April = offset 0)
            period_start = None
            period_month_name = None
            for month_offset, month_name in enumerate(MONTHS):
                if header.endswith((f'_{month_name}', f'_{month_name}_digital')):
                    period_start = financial_year_month_start(start_year, month_offset)
                    period_month_name = month_name
                    break

            # Determine demographic age group
            age_group = None
            if 'adult' in header:
                age_group = 'Adult'
            elif '11_under' in header:
                age_group = 'Under 12'
            elif '12_17' in header:
                age_group = '12-17'
            elif 'all_ages' in header:
                age_group = 'All ages'

            # Determine event delivery format (Physical vs Digital)
            event_type = None
            if 'physical' in header:
                event_type = 'Physical'
            elif 'digital' in header:
                event_type = 'Digital'

            # -----------------------------------------------------------------
            # Active Members (Users)
            # -----------------------------------------------------------------
            if header.startswith('active_members') and value.isdigit():
                status, est, notes = get_anomaly_info(row['_year'], 'users', authority_code, value, field=header)
                authority_users.append({
                    'Authority': authority_code,
                    'Period': f'{start_year}-04-01/P1Y',
                    'Age group': age_group,
                    'Count': value,
                    'Estimated count': est if est is not None else '',
                    'Status': status or '',
                    'Notes': notes or '',
                })

            if header.startswith('total_active_members'):
                # Record total active members as 'Unknown' age if no demographic breakdown exists
                if (row.get('active_members_11_under') == ""
                        and row.get('active_members_adults') == ""
                        and row.get('active_members_12_17') == ""
                        and value.isdigit()):
                    status, est, notes = get_anomaly_info(row['_year'], 'users', authority_code, value, field=header)
                    authority_users.append({
                        'Authority': authority_code,
                        'Period': f'{start_year}-04-01/P1Y',
                        'Age group': 'Unknown',
                        'Count': value,
                        'Estimated count': est if est is not None else '',
                        'Status': status or '',
                        'Notes': notes or '',
                    })

            # -----------------------------------------------------------------
            # Events
            # -----------------------------------------------------------------
            if header.startswith('physical_events') or header.startswith('digital_events'):
                if value is not None and value != "":
                    status, est, notes = get_anomaly_info(row['_year'], 'events', authority_code, value, field=header)
                    authority_events.append({
                        'Authority': authority_code,
                        'Event type': event_type,
                        'Age group': age_group,
                        'Period': period_start,
                        'Count': value,
                        'Estimated count': est if est is not None else '',
                        'Status': status or '',
                        'Notes': notes or '',
                    })

            if header.startswith('total_physical_events'):
                # Record total physical events if no monthly breakdown is provided
                if not has_positive_count(row, [f for f in row if f.startswith('physical_events_')],
                                          row['_year'], 'events', authority_code):
                    if value is not None and value != "":
                        status, est, notes = get_anomaly_info(row['_year'], 'events', authority_code, value, field=header)
                        authority_events.append({
                            'Authority': authority_code,
                            'Event type': event_type,
                            'Age group': 'Unknown',
                            'Period': period_start,
                            'Count': value,
                            'Estimated count': est if est is not None else '',
                            'Status': status or '',
                            'Notes': notes or '',
                        })

            if header.startswith('total_digital_events'):
                # Record total digital events if no monthly breakdown is provided
                if not has_positive_count(row, [f for f in row if f.startswith('digital_events_')],
                                          row['_year'], 'events', authority_code):
                    if value is not None and value != "":
                        status, est, notes = get_anomaly_info(row['_year'], 'events', authority_code, value, field=header)
                        authority_events.append({
                            'Authority': authority_code,
                            'Event type': event_type,
                            'Age group': 'Unknown',
                            'Period': period_start,
                            'Count': value,
                            'Estimated count': est if est is not None else '',
                            'Status': status or '',
                            'Notes': notes or '',
                        })

            # -----------------------------------------------------------------
            # Attendance
            # -----------------------------------------------------------------
            if header.startswith('physical_attendees') or header.startswith('digital_attendees'):
                if value is not None and value != "":
                    status, est, notes = get_anomaly_info(row['_year'], 'attendance', authority_code, value, field=header)
                    authority_attendance.append({
                        'Authority': authority_code,
                        'Event type': event_type,
                        'Age group': age_group,
                        'Period': period_start,
                        'Count': value,
                        'Estimated count': est if est is not None else '',
                        'Status': status or '',
                        'Notes': notes or '',
                    })

            if header.startswith('total_attendees_physical_events'):
                # Record total physical attendance if no monthly breakdown is provided
                if not has_positive_count(row, [f for f in row if f.startswith('physical_attendees_')],
                                          row['_year'], 'attendance', authority_code):
                    if value is not None and value != "":
                        status, est, notes = get_anomaly_info(row['_year'], 'attendance', authority_code, value, field=header)
                        authority_attendance.append({
                            'Authority': authority_code,
                            'Event type': event_type,
                            'Age group': 'Unknown',
                            'Period': period_start,
                            'Count': value,
                            'Estimated count': est if est is not None else '',
                            'Status': status or '',
                            'Notes': notes or '',
                        })

            if header.startswith('total_attendees_digital_events'):
                # Record total digital attendance if no monthly breakdown is provided
                if not has_positive_count(row, [f for f in row if f.startswith('digital_attendees_')],
                                          row['_year'], 'attendance', authority_code):
                    if value is not None and value != "":
                        status, est, notes = get_anomaly_info(row['_year'], 'attendance', authority_code, value, field=header)
                        authority_attendance.append({
                            'Authority': authority_code,
                            'Event type': event_type,
                            'Age group': 'Unknown',
                            'Period': period_start,
                            'Count': value,
                            'Estimated count': est if est is not None else '',
                            'Status': status or '',
                            'Notes': notes or '',
                        })

            # -----------------------------------------------------------------
            # Click and Collect
            # -----------------------------------------------------------------
            if header.startswith('click_and_collect'):
                if value is not None and value != "":
                    status, est, notes = get_anomaly_info(row['_year'], 'click_and_collect', authority_code, value, field=header)
                    authority_click_collect.append({
                        'Authority': authority_code,
                        'Period': period_start,
                        'Count': value,
                        'Estimated count': est if est is not None else '',
                        'Status': status or '',
                        'Notes': notes or '',
                    })

            # -----------------------------------------------------------------
            # Loans (Physical Book, Physical Audiobook, Ebook, Eaudio)
            # -----------------------------------------------------------------
            format_type = 'Physical book'
            if '_digital' in header or 'physical_audiobook' in header:
                format_type = 'Physical audiobook'
            elif 'ebook' in header:
                format_type = 'Ebook'
            elif 'digital_audiobook' in header:
                format_type = 'Eaudio'

            if header.startswith('loans_') or header.startswith('ebooks_') or header.startswith('digital_audiobook_issues_'):
                if value is not None and value != "":
                    status, est, notes = get_anomaly_info(row['_year'], 'loans', authority_code, value, field=header)
                    authority_loans.append({
                        'Authority': authority_code,
                        'Format': format_type,
                        'Content age group': age_group,
                        'Period': period_start,
                        'Count': value,
                        'Estimated count': est if est is not None else '',
                        'Status': status or '',
                        'Notes': notes or '',
                    })

            if header.startswith('total_physical_book_issues'):
                if value is not None and value != "":
                    status, est, notes = get_anomaly_info(row['_year'], 'loans', authority_code, value, field=header)
                    authority_loan_totals.append({
                        'Authority': authority_code,
                        'Format': 'Physical book',
                        'Period': period_start,
                        'Count': value,
                        'Estimated count': est if est is not None else '',
                        'Status': status or '',
                        'Notes': notes or '',
                    })

            if header.startswith('total_physical_audiobook_issues'):
                if value is not None and value != "":
                    status, est, notes = get_anomaly_info(row['_year'], 'loans', authority_code, value, field=header)
                    authority_loan_totals.append({
                        'Authority': authority_code,
                        'Format': 'Physical audiobook',
                        'Period': period_start,
                        'Count': value,
                        'Estimated count': est if est is not None else '',
                        'Status': status or '',
                        'Notes': notes or '',
                    })

            if header.startswith('total_ebook_issues'):
                if value is not None and value != "":
                    status, est, notes = get_anomaly_info(row['_year'], 'loans', authority_code, value, field=header)
                    authority_loan_totals.append({
                        'Authority': authority_code,
                        'Format': 'Ebook',
                        'Period': period_start,
                        'Count': value,
                        'Estimated count': est if est is not None else '',
                        'Status': status or '',
                        'Notes': notes or '',
                    })

            if header.startswith('total_digital_audiobook_issues'):
                if value is not None and value != "":
                    status, est, notes = get_anomaly_info(row['_year'], 'loans', authority_code, value, field=header)
                    authority_loan_totals.append({
                        'Authority': authority_code,
                        'Format': 'Eaudio',
                        'Period': period_start,
                        'Count': value,
                        'Estimated count': est if est is not None else '',
                        'Status': status or '',
                        'Notes': notes or '',
                    })

            # -----------------------------------------------------------------
            # Visits (Library, Shared Building, Mobile Library, Home Delivery)
            # -----------------------------------------------------------------
            if header.startswith('physical_visits'):
                location = 'Library'
                if 'no_colocation' in header:
                    location = 'Shared building'
                if value is not None and value != "":
                    status, est, notes = get_anomaly_info(row['_year'], 'visits', authority_code, value, field=header)
                    authority_visits.append({
                        'Authority': authority_code,
                        'Location': location,
                        'Period': period_start,
                        'Count': value,
                        'Estimated count': est if est is not None else '',
                        'Status': status or '',
                        'Notes': notes or '',
                    })

            if header.startswith('mobile_libraries'):
                if value is not None and value != "":
                    status, est, notes = get_anomaly_info(row['_year'], 'visits', authority_code, value, field=header)
                    authority_visits.append({
                        'Authority': authority_code,
                        'Location': 'Mobile library',
                        'Period': period_start,
                        'Count': value,
                        'Estimated count': est if est is not None else '',
                        'Status': status or '',
                        'Notes': notes or '',
                    })

            if header.startswith('home_delivery'):
                if value is not None and value != "":
                    status, est, notes = get_anomaly_info(row['_year'], 'visits', authority_code, value, field=header)
                    authority_visits.append({
                        'Authority': authority_code,
                        'Location': 'Home delivery',
                        'Period': period_start,
                        'Count': value,
                        'Estimated count': est if est is not None else '',
                        'Status': status or '',
                        'Notes': notes or '',
                    })

            # -----------------------------------------------------------------
            # Public Computer Usage
            # -----------------------------------------------------------------
            if header.startswith('hours_public_computers'):
                if value is not None and value != "":
                    status, est, notes = get_anomaly_info(row['_year'], 'computer_usage', authority_code, value, field=header)
                    authority_computer_usage.append({
                        'Authority': authority_code,
                        'Period': period_start,
                        'Count': value,
                        'Estimated count': est if est is not None else '',
                        'Status': status or '',
                        'Notes': notes or '',
                    })

            # -----------------------------------------------------------------
            # Wi-Fi Sessions
            # -----------------------------------------------------------------
            if header.startswith('wifi_sessions'):
                if value is not None and value != "":
                    status, est, notes = get_anomaly_info(row['_year'], 'wifi_sessions', authority_code, value, field=header)
                    authority_wifi_sessions.append({
                        'Authority': authority_code,
                        'Period': period_start,
                        'Count': value,
                        'Estimated count': est if est is not None else '',
                        'Status': status or '',
                        'Notes': notes or '',
                    })

        authority_loans, authority_loans_for_totals, authority_loan_issues = reconcile_loan_unknown_rows(
            authority_loans,
            authority_loan_totals,
            start_year
        )

        # ---------------------------------------------------------------------
        # 3. Calculate headline service totals for services.csv
        # ---------------------------------------------------------------------
        users_orig, users_est, users_status, users_notes = calculate_service_metric_total(
            row, 'total_active_members', authority_users, row['_year'], 'users', authority_code)
        events_orig, events_est, events_status, events_notes = calculate_service_metric_total(
            row, '_service_events', authority_events, row['_year'], 'events', authority_code)
        att_orig, att_est, att_status, att_notes = calculate_service_metric_total(
            row, '_service_attendance', authority_attendance, row['_year'], 'attendance', authority_code)
        loans_orig, loans_est, loans_status, loans_notes = calculate_service_metric_total(
            row, '_service_loans', authority_loans_for_totals, row['_year'], 'loans', authority_code)
        visits_orig, visits_est, visits_status, visits_notes = calculate_service_metric_total(
            row, None, authority_visits, row['_year'], 'visits', authority_code)
        comp_orig, comp_est, comp_status, comp_notes = calculate_service_metric_total(
            row, '_service_computer_hours', authority_computer_usage, row['_year'], 'computer_usage', authority_code)
        wifi_orig, wifi_est, wifi_status, wifi_notes = calculate_service_metric_total(
            row, '_service_wifi_sessions', authority_wifi_sessions, row['_year'], 'wifi_sessions', authority_code)

        services.append({
            'Authority code': authority_code,
            'Authority nice name': authority_nice_name,
            'Library service': library_service,
            'Period': financial_year_label(start_year),
            'Users': users_orig if users_orig and users_orig > 0 else None,
            'Users estimated': users_est if users_est and users_est > 0 else None,
            'Users status': users_status or None,
            'Users notes': users_notes or None,
            'Events': events_orig if events_orig and events_orig > 0 else None,
            'Events estimated': events_est if events_est and events_est > 0 else None,
            'Events status': events_status or None,
            'Events notes': events_notes or None,
            'Attendance': att_orig if att_orig and att_orig > 0 else None,
            'Attendance estimated': att_est if att_est and att_est > 0 else None,
            'Attendance status': att_status or None,
            'Attendance notes': att_notes or None,
            'Loans': loans_orig if loans_orig and loans_orig > 0 else None,
            'Loans estimated': loans_est if loans_est and loans_est > 0 else None,
            'Loans status': loans_status or None,
            'Loans notes': loans_notes or None,
            'Visits': visits_orig if visits_orig and visits_orig > 0 else None,
            'Visits estimated': visits_est if visits_est and visits_est > 0 else None,
            'Visits status': visits_status or None,
            'Visits notes': visits_notes or None,
            'Computer hours': comp_orig if comp_orig and comp_orig > 0 else None,
            'Computer hours estimated': comp_est if comp_est and comp_est > 0 else None,
            'Computer hours status': comp_status or None,
            'Computer hours notes': comp_notes or None,
            'Wifi sessions': wifi_orig if wifi_orig and wifi_orig > 0 else None,
            'Wifi sessions estimated': wifi_est if wifi_est and wifi_est > 0 else None,
            'Wifi sessions status': wifi_status or None,
            'Wifi sessions notes': wifi_notes or None,
            'Population under 12': authority_population['under_12'],
            'Population 12-17': authority_population['12_17'],
            'Population adult': authority_population['adult'],
            'Nearest neighbour 1': authority_neighbours[0],
            'Nearest neighbour 2': authority_neighbours[1],
            'Nearest neighbour 3': authority_neighbours[2],
            'Nearest neighbour 4': authority_neighbours[3],
            'Nearest neighbour 5': authority_neighbours[4],
        })

        # ---------------------------------------------------------------------
        # 4. Standardize reporting periods and accumulate detailed records
        # ---------------------------------------------------------------------
        users.extend(authority_users)

        events.extend(standardize_grouped_periods(
            authority_events,
            key_func=lambda r: (r['Event type'], r['Age group']),
            start_year=start_year,
        ))

        attendance.extend(standardize_grouped_periods(
            authority_attendance,
            key_func=lambda r: (r['Event type'], r['Age group']),
            start_year=start_year,
        ))

        loans.extend(authority_loans)
        loans_monthly.extend(authority_loans_for_totals)
        loan_review_issues.extend(authority_loan_issues)

        visits.extend(standardize_grouped_periods(
            authority_visits,
            key_func=lambda r: r['Location'],
            start_year=start_year,
        ))

        click_collect.extend(standardize_ungrouped_periods(authority_click_collect, start_year=start_year))
        computer_usage.extend(standardize_ungrouped_periods(authority_computer_usage, start_year=start_year))
        wifi_sessions.extend(standardize_ungrouped_periods(authority_wifi_sessions, start_year=start_year))

    # -------------------------------------------------------------------------
    # 5. Add placeholder rows for English library services not in survey data
    # -------------------------------------------------------------------------
    existing_services = {(service['Authority code'], service['Period']) for service in services}
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
                'Users estimated': None,
                'Users status': None,
                'Users notes': None,
                'Events': None,
                'Events estimated': None,
                'Events status': None,
                'Events notes': None,
                'Attendance': None,
                'Attendance estimated': None,
                'Attendance status': None,
                'Attendance notes': None,
                'Loans': None,
                'Loans estimated': None,
                'Loans status': None,
                'Loans notes': None,
                'Visits': None,
                'Visits estimated': None,
                'Visits status': None,
                'Visits notes': None,
                'Computer hours': None,
                'Computer hours estimated': None,
                'Computer hours status': None,
                'Computer hours notes': None,
                'Wifi sessions': None,
                'Wifi sessions estimated': None,
                'Wifi sessions status': None,
                'Wifi sessions notes': None,
                'Population under 12': lib_service['population']['under_12'],
                'Population 12-17': lib_service['population']['12_17'],
                'Population adult': lib_service['population']['adult'],
                'Nearest neighbour 1': lib_service.get('nearest_neighbours', empty_neighbours)[0],
                'Nearest neighbour 2': lib_service.get('nearest_neighbours', empty_neighbours)[1],
                'Nearest neighbour 3': lib_service.get('nearest_neighbours', empty_neighbours)[2],
                'Nearest neighbour 4': lib_service.get('nearest_neighbours', empty_neighbours)[3],
                'Nearest neighbour 5': lib_service.get('nearest_neighbours', empty_neighbours)[4],
            })

    # -------------------------------------------------------------------------
    # 6. Write output CSV files
    # -------------------------------------------------------------------------
    write_csv(SERVICES, SERVICE_FIELDNAMES, services)
    write_csv(USERS, USER_FIELDNAMES, users)
    write_csv(EVENTS, EVENT_FIELDNAMES, events)
    write_csv(ATTENDANCE, ATTENDANCE_FIELDNAMES, attendance)
    write_csv(LOANS, LOAN_FIELDNAMES, loans)
    write_csv(VISITS, VISIT_FIELDNAMES, visits)
    write_csv(CLICK_COLLECT, CLICK_COLLECT_FIELDNAMES, click_collect)
    write_csv(COMPUTER_INVENTORY, COMPUTER_INVENTORY_FIELDNAMES, computer_inventory)
    write_csv(COMPUTER_USAGE, COMPUTER_USAGE_FIELDNAMES, computer_usage)
    write_csv(WIFI_SESSIONS, WIFI_SESSIONS_FIELDNAMES, wifi_sessions)

    # -------------------------------------------------------------------------
    # 7. Write output JSON dashboard files
    # -------------------------------------------------------------------------
    write_json(SERVICES_JSON, [list(s.values()) for s in services])
    write_json(USERS_JSON, [
        [u['Authority'], u['Period'], u['Age group'], u['Effective count'], u['Count'], u.get('Status') or None, u.get('Notes') or None]
        for u in convert_values_to_yearly(users)
    ])
    loan_issue_ids = {}
    loan_issue_rows = []
    for issue in loan_review_issues:
        issue_id = len(loan_issue_rows)
        loan_issue_ids[issue['_key']] = issue_id
        loan_issue_rows.append({
            key: value for key, value in issue.items() if key != '_key'
        } | {'id': issue_id})

    loan_rows = []
    for record in loans_monthly:
        issue_id = loan_issue_ids.get(record.get('_review_issue_key'))
        loan_rows.append([
            record['Authority'], record['Format'], record['Content age group'],
            record['Period'], record['Effective count'], record['Count'],
            record.get('Status') or None, issue_id
        ])
    write_json(LOANS_JSON, {'issues': loan_issue_rows, 'records': loan_rows})
    write_json(VISITS_JSON, [
        [v['Authority'], v['Location'], v['Period'], v['Effective count'], v['Count'], v.get('Status') or None, v.get('Notes') or None]
        for v in convert_values_to_monthly(visits)
    ])
    write_json(EVENTS_JSON, [
        [e['Authority'], e['Event type'], e['Age group'], e['Period'], e['Effective count'], e['Count'], e.get('Status') or None, e.get('Notes') or None]
        for e in convert_values_to_monthly(events)
    ])
    write_json(ATTENDANCE_JSON, [
        [a['Authority'], a['Event type'], a['Age group'], a['Period'], a['Effective count'], a['Count'], a.get('Status') or None, a.get('Notes') or None]
        for a in convert_values_to_monthly(attendance)
    ])
    write_json(COMPUTER_USAGE_JSON, [
        [c['Authority'], c['Period'], c['Effective count'], c['Count'], c.get('Status') or None, c.get('Notes') or None]
        for c in convert_values_to_monthly(computer_usage)
    ])
    write_json(WIFI_SESSIONS_JSON, [
        [w['Authority'], w['Period'], w['Effective count'], w['Count'], w.get('Status') or None, w.get('Notes') or None]
        for w in convert_values_to_monthly(wifi_sessions)
    ])
    write_json(CLICK_COLLECT_JSON, [
        [c['Authority'], c['Period'], c['Effective count'], c['Count'], c.get('Status') or None, c.get('Notes') or None]
        for c in convert_values_to_monthly(click_collect)
    ])
    write_json(COMPUTER_INVENTORY_JSON, [
        [r['Authority'], r['Measure'], r['Period'], None, r['Count'], None, None]
        for r in computer_inventory
    ])
    with open(ERRORS_CSV, mode='r', newline='', encoding='utf-8') as f:
        errors_records = list(csv.DictReader(f))
    write_json(ERRORS_JSON, errors_records)


if __name__ == '__main__':
    rotate_activity_data()
