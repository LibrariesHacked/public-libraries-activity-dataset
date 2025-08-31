""""
This script reads a CSV file containing library activity data for the year 2023-2024,
rotates the data into multiple output files, and handles various aspects such as authorities,
members, events, attendance, issues, visits, computer usage, and metadata.
"""

import csv
import json
from datetime import datetime

INPUT = './data/libraries_activity_data_2023_2024.csv'
POPULATION = './data/mye24tablesew.csv'
AUTHORITIES = './data/uk_local_authorities.csv'

SERVICES = './data/services.csv'
MEMBERS = './data/members.csv'
EVENTS = './data/events.csv'
ATTENDANCE = './data/event_attendance.csv'
LOANS = './data/loans.csv'
CLICK_COLLECT = './data/click_and_collect.csv'
VISITS = './data/visits.csv'
COMPUTER_USAGE = './data/computer_usage.csv'
WIFI_SESSIONS = './data/wifi_sessions.csv'

SERVICES_JSON = './public/services.json'
MEMBERS_JSON = './public/members.json'
LOANS_JSON = './public/loans.json'
VISITS_JSON = './public/visits.json'
EVENTS_JSON = './public/events.json'
ATTENDANCE_JSON = './public/attendance.json'
CLICK_COLLECT_JSON = './public/click_collect.json'
COMPUTER_USAGE_JSON = './public/computer_usage.json'
WIFI_SESSIONS_JSON = './public/wifi_sessions.json'


def convert_date_to_quarterly(date_str):
    """Convert a date string in YYYY-MM-DD format to a quarterly period string."""
    date_obj = datetime.strptime(date_str, "%Y-%m-%d")
    # Set to the first of the month
    new_date = date_obj.replace(day=1)
    # Subtract 3 months from the date
    new_date = new_date.replace(month=(new_date.month - 2) % 12 or 12)
    period = new_date.strftime("%Y-%m-%d") + '/P3M'
    return period


def rotate_activity_data():
    """Rotate the activity data from the input CSV file into multiple output files."""

    with open(INPUT, mode='r', newline='', encoding='utf-8-sig') as infile, \
            open(POPULATION, mode='r', newline='', encoding='utf-8-sig') as population_file, \
            open(AUTHORITIES, mode='r', newline='', encoding='utf-8') as authorities_file, \
            open(MEMBERS, mode='w', newline='', encoding='utf-8') as members_out, \
            open(EVENTS, mode='w', newline='', encoding='utf-8') as events_out, \
            open(ATTENDANCE, mode='w', newline='', encoding='utf-8') as attendance_out, \
            open(LOANS, mode='w', newline='', encoding='utf-8') as loans_out, \
            open(CLICK_COLLECT, mode='w', newline='', encoding='utf-8') as click_collect_out, \
            open(VISITS, mode='w', newline='', encoding='utf-8') as visits_out, \
            open(COMPUTER_USAGE, mode='w', newline='', encoding='utf-8') as computer_usage_out, \
            open(WIFI_SESSIONS, mode='w', newline='', encoding='utf-8') as wifi_sessions_out, \
            open(SERVICES, mode='w', newline='', encoding='utf-8') as services_out:
        reader = csv.DictReader(infile)

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

        # Create a lookup dictionary for authorities
        authorities = {}
        authorities_reader = csv.DictReader(authorities_file)
        for authority_row in authorities_reader:
            auth_object = {
                'gss-code': authority_row['gss-code'],
                'official-name': authority_row['official-name'],
                'nice-name': authority_row['nice-name'],
            }
            # Use both official name and nice name as keys for lookup
            authorities[authority_row['nice-name']] = auth_object
            authorities[authority_row['official-name']] = auth_object

        members_writer = csv.DictWriter(members_out, fieldnames=[
                                        'Authority', 'Period', 'Age group', 'Count'])
        members_writer.writeheader()
        members = []

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
            'Authority', 'Period', 'Hours'])
        computer_usage_writer.writeheader()
        computer_usage = []

        wifi_sessions_writer = csv.DictWriter(wifi_sessions_out, fieldnames=[
            'Authority', 'Period', 'Sessions'])
        wifi_sessions_writer.writeheader()
        wifi_sessions = []

        service_writer = csv.DictWriter(services_out, fieldnames=['Authority code',
                                                                  'Authority nice name',
                                                                  'Library service',
                                                                  'Period', 'Members', 'Events',
                                                                  'Attendance', 'Issues', 'Visits',
                                                                  'Computer hours', 'Wifi sessions',
                                                                  'Population under 12',
                                                                  'Population 12-17',
                                                                  'Population adult'])
        service_writer.writeheader()
        services = []

        # Each row is all the authority's activity data for the year
        for row in reader:

            authority = row['authority']
            library_service = row['library_details']
            authority_code = None
            authority_nice_name = None
            auth_pop = None

            authority_members = []
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
                auth_pop = population.get(
                    authority_code, {'under_12': 0, '12_17': 0, 'adult': 0})
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

                if 'april' in header:
                    period_start = '2023-04-01'
                elif 'may' in header:
                    period_start = '2023-05-01'
                elif 'june' in header:
                    period_start = '2023-06-01'
                elif 'july' in header:
                    period_start = '2023-07-01'
                elif 'august' in header:
                    period_start = '2023-08-01'
                elif 'september' in header:
                    period_start = '2023-09-01'
                elif 'october' in header:
                    period_start = '2023-10-01'
                elif 'november' in header:
                    period_start = '2023-11-01'
                elif 'december' in header:
                    period_start = '2023-12-01'
                elif 'january' in header:
                    period_start = '2024-01-01'
                elif 'february' in header:
                    period_start = '2024-02-01'
                elif 'march' in header:
                    period_start = '2024-03-01'

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

                # Members: We want a schema of Authority, Age Group, Count
                if header.startswith('active_members') and value.isdigit():
                    authority_members.append({
                        'Authority': authority_code,
                        'Period': '2023-04-01/P1Y',
                        'Age group': age_group,
                        'Count': value
                    })

                if header.startswith('total_active_members'):
                    # We record the total members IF there is no data for the individual age groups.
                    if row.get('active_members_11_under') == "" and \
                       row.get('active_members_adults') == "" and \
                       row.get('active_members_12_17') == "" and \
                            value.isdigit():
                        authority_members.append({
                            'Authority': authority_code,
                            'Period': '2023-04-01/P1Y',
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
                    if row.get('physical_events_march') == "":
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
                    if row.get('digital_events_march') == "":
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
                    if row.get('physical_attendees_march') == "":
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
                    if row.get('digital_attendees_march') == "":
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

                # Age category physical book and audiobook issues
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
                    # Record total physical book issues IF no data for the individual months.
                    if row.get('loans_adult_march') == "":
                        if value is not None and value != "":
                            authority_loans.append({
                                'Authority': authority_code,
                                'Format': format_type,
                                'Content age group': 'Unknown',
                                'Period': period_start,
                                'Count': value
                            })

                if header.startswith('total_physical_audiobook_issues'):
                    # Record total physical audiobook issues IF no data for the individual months.
                    if row.get('loans_adult_march_digital') == "":
                        if value is not None and value != "":
                            authority_loans.append({
                                'Authority': authority_code,
                                'Format': format_type,
                                'Content age group': 'Unknown',
                                'Period': period_start,
                                'Count': value
                            })

                if header.startswith('total_ebook_issues'):
                    # Record total ebook issues IF no data for the individual months.
                    if row.get('ebooks_adult_march') == "":
                        if value is not None and value != "":
                            authority_loans.append({
                                'Authority': authority_code,
                                'Format': format_type,
                                'Content age group': 'Unknown',
                                'Period': period_start,
                                'Count': value
                            })

                if header.startswith('total_digital_audiobook_issues'):
                    # Record total digital audiobook issues IF no data for the individual months.
                    if row.get('digital_audiobook_issues_adult_march') == "":
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

                # Computer usage: Authority, Period, Hours
                if header.startswith('hours_public_computers'):
                    if value is not None and value != "":
                        authority_computer_usage.append({
                            'Authority': authority_code,
                            'Period': period_start,
                            'Hours': value
                        })

                # Wifi sessions: Authority, Period, Sessions
                if header.startswith('wifi_sessions'):
                    if value is not None and value != "":
                        authority_wifi_sessions.append({
                            'Authority': authority_code,
                            'Period': period_start,
                            'Sessions': value
                        })

            # Add the authority's data to the services list
            members_count = sum(
                int(record['Count']) for record in authority_members)
            events_count = sum(
                int(record['Count']) for record in authority_events)
            attendance_count = sum(
                int(record['Count']) for record in authority_attendance)
            issues_count = sum(
                int(record['Count']) for record in authority_loans)
            visits_count = sum(
                int(record['Count']) for record in authority_visits)
            computer_hours_count = sum(
                int(record['Hours']) for record in authority_computer_usage)
            wifi_sessions_count = sum(
                int(record['Sessions']) for record in authority_wifi_sessions)

            services.append({
                'Authority code': authority_code,
                'Authority nice name': authority_nice_name,
                'Library service': library_service,
                'Period': '2023-04-01/P1Y',
                'Members': members_count,
                'Events': events_count,
                'Attendance': attendance_count,
                'Issues': issues_count,
                'Visits': visits_count,
                'Computer hours': computer_hours_count,
                'Wifi sessions': wifi_sessions_count,
                'Population under 12': auth_pop['under_12'],
                'Population 12-17': auth_pop['12_17'],
                'Population adult': auth_pop['adult']
            })

            members.extend(authority_members)

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
            for (event_type, age_group), records in events_dict.items():
                if len(records) == 4:
                    event_frequency = 'Quarterly'
                else:
                    event_frequency = 'Monthly'

                for record in records:
                    period = None
                    if event_frequency == 'Monthly':
                        period = record['Period'] + '/P1M'
                    elif event_frequency == 'Quarterly':
                        period = convert_date_to_quarterly(record['Period'])

                    record['Period'] = period
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
            for (event_type, age_group), records in attendance_dict.items():
                if len(records) == 4:
                    attendance_frequency = 'Quarterly'
                else:
                    attendance_frequency = 'Monthly'

                for record in records:
                    period = None
                    if attendance_frequency == 'Monthly':
                        period = record['Period'] + '/P1M'
                    elif attendance_frequency == 'Quarterly':
                        period = convert_date_to_quarterly(record['Period'])
                    record['Period'] = period
            attendance.extend(authority_attendance)

            # Loans: split the array into arrays grouped by just format and age group
            loans_dict = {}
            for record in authority_loans:
                key = (record['Format'],
                       record['Content age group'])
                if key not in loans_dict:
                    loans_dict[key] = []
                loans_dict[key].append(record)

            # Then for each grouping we need to work out if the dates are monthly or quarterly
            loans_frequency = None
            for (format_type, content_age_group), records in loans_dict.items():
                if len(records) == 1:
                    loans_frequency = 'Yearly'
                if len(records) == 4:
                    loans_frequency = 'Quarterly'
                else:
                    loans_frequency = 'Monthly'

                for record in records:
                    period = None
                    if loans_frequency == 'Monthly':
                        period = record['Period'] + '/P1M'
                    elif loans_frequency == 'Quarterly':
                        period = convert_date_to_quarterly(record['Period'])
                    elif loans_frequency == 'Yearly':
                        period = '2023-04-01/P1Y'
                    record['Period'] = period
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
                if len(records) == 1:
                    visits_frequency = 'Yearly'
                if len(records) == 4:
                    visits_frequency = 'Quarterly'
                elif len(records) == 12:
                    visits_frequency = 'Monthly'

                for record in records:
                    period = None
                    if visits_frequency == 'Monthly':
                        period = record['Period'] + '/P1M'
                    elif visits_frequency == 'Quarterly':
                        period = convert_date_to_quarterly(record['Period'])
                    elif visits_frequency == 'Yearly':
                        period = '2023-04-01/P1Y'
                    record['Period'] = period
            visits.extend(authority_visits)

            # Click and collect: No need to group but do convert the period
            cc_visits_frequency = None
            if len(authority_click_collect) == 1:
                cc_visits_frequency = 'Yearly'
            if len(authority_click_collect) == 4:
                cc_visits_frequency = 'Quarterly'
            elif len(authority_click_collect) == 12:
                cc_visits_frequency = 'Monthly'
            for record in authority_click_collect:
                period = None
                if cc_visits_frequency == 'Quarterly':
                    period = convert_date_to_quarterly(record['Period'])
                elif cc_visits_frequency == 'Yearly':
                    period = '2023-04-01/P1Y'
                else:
                    period = record['Period'] + '/P1M'
                record['Period'] = period
            click_collect.extend(authority_click_collect)

            # Computer usage: No need to group but convert the period
            computer_usage_frequency = None
            if len(authority_computer_usage) == 4:
                computer_usage_frequency = 'Quarterly'
            elif len(authority_computer_usage) == 12:
                computer_usage_frequency = 'Monthly'
            for record in authority_computer_usage:
                period = None
                if computer_usage_frequency == 'Quarterly':
                    period = convert_date_to_quarterly(record['Period'])
                else:
                    period = record['Period'] + '/P1M'
                record['Period'] = period
            computer_usage.extend(authority_computer_usage)

            # Wifi sessions: No need to group but convert the period
            wifi_sessions_frequency = None
            if len(wifi_sessions) == 1:
                wifi_sessions_frequency = 'Yearly'
            if len(wifi_sessions) == 4:
                wifi_sessions_frequency = 'Quarterly'
            elif len(wifi_sessions) == 12:
                wifi_sessions_frequency = 'Monthly'
            for record in authority_wifi_sessions:
                period = None
                if wifi_sessions_frequency == 'Quarterly':
                    period = convert_date_to_quarterly(record['Period'])
                else:
                    period = record['Period'] + '/P1M'
                record['Period'] = period
            wifi_sessions.extend(authority_wifi_sessions)

        # Write the aggregated data to the respective CSV files
        attendance_writer.writerows(attendance)
        members_writer.writerows(members)
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

        membership_values = [list(membership.values())
                             for membership in members]
        with open(MEMBERS_JSON, 'w', encoding='utf-8') as f:
            json.dump(membership_values, f)

        loans_values = [list(loan.values()) for loan in loans]
        with open(LOANS_JSON, 'w', encoding='utf-8') as f:
            json.dump(loans_values, f)

        visits_values = [list(visit.values()) for visit in visits]
        with open(VISITS_JSON, 'w', encoding='utf-8') as f:
            json.dump(visits_values, f)

        events_values = [list(event.values()) for event in events]
        with open(EVENTS_JSON, 'w', encoding='utf-8') as f:
            json.dump(events_values, f)

        attendance_values = [list(attend.values()) for attend in attendance]
        with open(ATTENDANCE_JSON, 'w', encoding='utf-8') as f:
            json.dump(attendance_values, f)

        click_collect_values = [list(cc.values()) for cc in click_collect]
        with open(CLICK_COLLECT_JSON, 'w', encoding='utf-8') as f:
            json.dump(click_collect_values, f)

        computer_usage_values = [list(cu.values()) for cu in computer_usage]
        with open(COMPUTER_USAGE_JSON, 'w', encoding='utf-8') as f:
            json.dump(computer_usage_values, f)

        wifi_sessions_values = [list(ws.values()) for ws in wifi_sessions]
        with open(WIFI_SESSIONS_JSON, 'w', encoding='utf-8') as f:
            json.dump(wifi_sessions_values, f)


rotate_activity_data()
