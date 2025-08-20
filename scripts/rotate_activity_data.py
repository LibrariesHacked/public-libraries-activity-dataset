""""
This script reads a CSV file containing library activity data for the year 2023-2024,
rotates the data into multiple output files, and handles various aspects such as authorities,
members, events, attendance, issues, visits, computer usage, and metadata.
"""

import csv
from datetime import datetime

INPUT = './data/libraries_activity_data_2023_2024.csv'
MEMBERS = './data/members.csv'
EVENTS = './data/events.csv'
ATTENDANCE = './data/event_attendance.csv'
LOANS = './data/loans.csv'
VISITS = './data/visits.csv'
COMPUTER_USAGE = './data/computer_usage.csv'
METADATA = './data/libraries_metadata.csv'
AUTHORITIES = './data/uk_local_authorities.csv'


def convert_date_to_quarterly(date_str):
    """Convert a date string in YYYY-MM-DD format to a quarterly period string."""
    date_obj = datetime.strptime(date_str, "%Y-%m-%d")
    # Set to the first of the month
    new_date = date_obj.replace(day=1)
    # Subtract 3 months from the date
    new_date = new_date.replace(month=(new_date.month - 3) % 12 or 12)
    if new_date.month > 9:  # If month is October or later, year needs to be adjusted
        new_date = new_date.replace(year=new_date.year - 1)
        # Format the period as YYYY-MM-DD/P3M
    period = new_date.strftime("%Y-%m-%d") + '/P3M'
    return period


def rotate_activity_data():
    """Rotate the activity data from the input CSV file into multiple output files."""

    with open(INPUT, mode='r', newline='', encoding='utf-8') as infile, \
            open(AUTHORITIES, mode='r', newline='', encoding='utf-8') as authorities_file, \
            open(MEMBERS, mode='w', newline='', encoding='utf-8') as members_out, \
            open(EVENTS, mode='w', newline='', encoding='utf-8') as events_out, \
            open(ATTENDANCE, mode='w', newline='', encoding='utf-8') as attendance_out, \
            open(LOANS, mode='w', newline='', encoding='utf-8') as loans_out, \
            open(VISITS, mode='w', newline='', encoding='utf-8') as visits_out, \
            open(COMPUTER_USAGE, mode='w', newline='', encoding='utf-8') as computer_usage_out, \
            open(METADATA, mode='w', newline='', encoding='utf-8') as metadata_out:
        reader = csv.DictReader(infile)

        # Create a lookup dictionary for authorities
        authorities = {}
        authorities_reader = csv.DictReader(authorities_file)
        for authority_row in authorities_reader:
            auth_object = {
                'gss-code': authority_row['gss-code'],
                'official-name': authority_row['official-name'],
                'nice-name': authority_row['nice-name']
            }
            # Use both official name and nice name as keys for lookup
            authorities[authority_row['nice-name']] = auth_object
            authorities[authority_row['official-name']] = auth_object

        members_writer = csv.DictWriter(members_out, fieldnames=[
                                        'Authority', 'Age group', 'Count'])
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

        visits_writer = csv.DictWriter(visits_out, fieldnames=[
            'Authority', 'Age group', 'Period', 'Count'])
        visits_writer.writeheader()
        visits = []

        computer_usage_writer = csv.DictWriter(computer_usage_out, fieldnames=[
            'Authority', 'Age group', 'Period', 'Count'])
        computer_usage_writer.writeheader()
        computer_usage = []

        metadata_writer = csv.DictWriter(metadata_out, fieldnames=[
                                         'Authority', 'Year', 'Total Events', 'Total Attendance',
                                         'Total Issues', 'Total Visits', 'Total Computer Usage'])
        metadata_writer.writeheader()
        metadata = []

        # Each row is all the authority's activity data for the year
        for row in reader:

            authority = row['authority']
            authority_code = None
            authority_nice_name = None

            authority_members = []
            authority_events = []
            authority_attendance = []
            authority_loans = []
            authority_visits = []
            authority_computer_usage = []

            # Check if the authority exists in the authorities data
            if authority in authorities:
                authority_code = authorities[authority]['gss-code']
                authority_nice_name = authorities[authority]['nice-name']
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
                if header.startswith('active_members') and value != "":
                    authority_members.append({
                        'Authority': authority_code,
                        'Age group': age_group,
                        'Count': value
                    })

                if header.startswith('total_active_members'):
                    # We record the total members IF there is no data for the individual age groups.
                    if row.get('active_members_11_under') == "" and \
                       row.get('active_members_adults') == "" and \
                       row.get('active_members_12_17') == "":
                        authority_members.append({
                            'Authority': authority_code,
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
                    if row.get('physical_events_june') == "":
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
                    if row.get('digital_events_june') == "":
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
                    if row.get('physical_attendees_june') == "":
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
                    if row.get('digital_attendees_june') == "":
                        if value is not None and value != "":
                            authority_attendance.append({
                                'Authority': authority_code,
                                'Event type': physical_digital,
                                'Age group': 'Unknown',
                                'Period': period_start,
                                'Count': value
                            })

                # Loans: total_physical_book_issues_april,total_physical_book_issues_may,total_physical_book_issues_june,total_physical_book_issues_july,total_physical_book_issues_august,total_physical_book_issues_september,total_physical_book_issues_october,total_physical_book_issues_november,total_physical_book_issues_december,total_physical_book_issues_january,total_physical_book_issues_february,total_physical_book_issues_march,loans_adult_april,loans_adult_may,loans_adult_june,loans_adult_july,loans_adult_august,loans_adult_september,loans_adult_october,loans_adult_november,loans_adult_december,loans_adult_january,loans_adult_february,loans_adult_march,loans_11_under_april,loans_11_under_may,loans_11_under_june,loans_11_under_july,loans_11_under_august,loans_11_under_september,loans_11_under_october,loans_11_under_november,loans_11_under_december,loans_11_under_january,loans_11_under_february,loans_11_under_march,loans_12_17_april,loans_12_17_may,loans_12_17_june,loans_12_17_july,loans_12_17_august,loans_12_17_september,loans_12_17_october,loans_12_17_november,loans_12_17_december,loans_12_17_january,loans_12_17_february,loans_12_17_march,total_physical_audiobook_issues_april,total_physical_audiobook_issues_may,total_physical_audiobook_issues_june,total_physical_audiobook_issues_july,total_physical_audiobook_issues_august,total_physical_audiobook_issues_september,total_physical_audiobook_issues_october,total_physical_audiobook_issues_november,total_physical_audiobook_issues_december,total_physical_audiobook_issues_january,total_physical_audiobook_issues_february,total_physical_audiobook_issues_march,loans_adult_april_digital,loans_adult_may_digital,loans_adult_june_digital,loans_adult_july_digital,loans_adult_august_digital,loans_adult_september_digital,loans_adult_october_digital,loans_adult_november_digital,loans_adult_december_digital,loans_adult_january_digital,loans_adult_february_digital,loans_adult_march_digital,loans_11_under_april_digital,loans_11_under_may_digital,loans_11_under_june_digital,loans_11_under_july_digital,loans_11_under_august_digital,loans_11_under_september_digital,loans_11_under_october_digital,loans_11_under_november_digital,loans_11_under_december_digital,loans_11_under_january_digital,loans_11_under_february_digital,loans_11_under_march_digital,loans_12_17_april_digital,loans_12_17_may_digital,loans_12_17_june_digital,loans_12_17_july_digital,loans_12_17_august_digital,loans_12_17_september_digital,loans_12_17_october_digital,loans_12_17_november_digital,loans_12_17_december_digital,loans_12_17_january_digital,loans_12_17_february_digital,loans_12_17_march_digital,ebook_and_eaudio_data_collection,total_ebook_issues_april,total_ebook_issues_may,total_ebook_issues_june,total_ebook_issues_july,total_ebook_issues_august,total_ebook_issues_september,total_ebook_issues_october,total_ebook_issues_november,total_ebook_issues_december,total_ebook_issues_january,total_ebook_issues_february,total_ebook_issues_march,ebooks_adult_april,ebooks_adult_may,ebooks_adult_june,ebooks_adult_july,ebooks_adult_august,ebooks_adult_september,ebooks_adult_october,ebooks_adult_november,ebooks_adult_december,ebooks_adult_january,ebooks_adult_february,ebooks_adult_march,ebooks_11_under_april,ebooks_11_under_may,ebooks_11_under_june,ebooks_11_under_july,ebooks_11_under_august,ebooks_11_under_september,ebooks_11_under_october,ebooks_11_under_november,ebooks_11_under_december,ebooks_11_under_january,ebooks_11_under_february,ebooks_11_under_march,ebooks_12_17_april,ebooks_12_17_may,ebooks_12_17_june,ebooks_12_17_july,ebooks_12_17_august,ebooks_12_17_september,ebooks_12_17_october,ebooks_12_17_november,ebooks_12_17_december,ebooks_12_17_january,ebooks_12_17_february,ebooks_12_17_march,total_digital_audiobook_issues_april,total_digital_audiobook_issues_may,total_digital_audiobook_issues_june,total_digital_audiobook_issues_july,total_digital_audiobook_issues_august,total_digital_audiobook_issues_september,total_digital_audiobook_issues_october,total_digital_audiobook_issues_november,total_digital_audiobook_issues_december,total_digital_audiobook_issues_january,total_digital_audiobook_issues_february,total_digital_audiobook_issues_march,digital_audiobook_issues_adult_april,digital_audiobook_issues_adult_may,digital_audiobook_issues_adult_june,digital_audiobook_issues_adult_july,digital_audiobook_issues_adult_august,digital_audiobook_issues_adult_september,digital_audiobook_issues_adult_october,digital_audiobook_issues_adult_november,digital_audiobook_issues_adult_december,digital_audiobook_issues_adult_january,digital_audiobook_issues_adult_february,digital_audiobook_issues_adult_march,digital_audiobook_issues_11_under_april,digital_audiobook_issues_11_under_may,digital_audiobook_issues_11_under_june,digital_audiobook_issues_11_under_july,digital_audiobook_issues_11_under_august,digital_audiobook_issues_11_under_september,digital_audiobook_issues_11_under_october,digital_audiobook_issues_11_under_november,digital_audiobook_issues_11_under_december,digital_audiobook_issues_11_under_january,digital_audiobook_issues_11_under_february,digital_audiobook_issues_11_under_march,digital_audiobook_issues_12_17_april,digital_audiobook_issues_12_17_may,digital_audiobook_issues_12_17_june,digital_audiobook_issues_12_17_july,digital_audiobook_issues_12_17_august,digital_audiobook_issues_12_17_september,digital_audiobook_issues_12_17_october,digital_audiobook_issues_12_17_november,digital_audiobook_issues_12_17_december,digital_audiobook_issues_12_17_january,digital_audiobook_issues_12_17_february,digital_audiobook_issues_12_17_march
                # Based on headers we want a schema of Authority, Format, Age Group, Period, Count
                # The format is Physical book, Physical audiobook, Ebook, Eaudio

                format_type = 'Physical book'
                if '_digital' in header:
                    format_type = 'Physical audiobook'
                elif 'ebook' in header:
                    format_type = 'Ebook'
                elif 'eaudio' in header:
                    format_type = 'Eaudio'

                # Age category physical book and audiobook issues
                if header.startswith('loans_'):
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
                    if row.get('loans_adult_june') == "":
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
                    if row.get('loans_adult_june_digital') == "":
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
                    if row.get('ebooks_adult_june') == "":
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
                    if row.get('digital_audiobook_issues_adult_june') == "":
                        if value is not None and value != "":
                            authority_loans.append({
                                'Authority': authority_code,
                                'Format': format_type,
                                'Content age group': 'Unknown',
                                'Period': period_start,
                                'Count': value
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
                elif len(records) == 12:
                    event_frequency = 'Monthly'

                for record in records:
                    period = None
                    if event_frequency == 'Monthly':
                        period = record['Period'] + '/P1M'
                    elif event_frequency == 'Quarterly':
                        period = record['Period']
                        # period = convert_date_to_quarterly(record['Period'])

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
                elif len(records) == 12:
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
                if len(records) == 4:
                    loans_frequency = 'Quarterly'
                elif len(records) == 12:
                    loans_frequency = 'Monthly'

                for record in records:
                    period = None
                    if loans_frequency == 'Monthly':
                        period = record['Period'] + '/P1M'
                    elif loans_frequency == 'Quarterly':
                        period = convert_date_to_quarterly(record['Period'])
                    record['Period'] = period
            loans.extend(authority_loans)

        # Write the aggregated data to the respective CSV files
        attendance_writer.writerows(attendance)
        members_writer.writerows(members)
        events_writer.writerows(events)
        loans_writer.writerows(loans)


rotate_activity_data()
