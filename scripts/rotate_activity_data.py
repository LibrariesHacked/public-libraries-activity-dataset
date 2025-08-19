import csv

INPUT = './data/libraries_activity_data_2023_2024.csv'
MEMBERS = './data/members.csv'
EVENTS = './data/events.csv'
ATTENDANCE = './data/event_attendance.csv'
ISSUES = './data/issues.csv'
VISITS = './data/visits.csv'
COMPUTER_USAGE = './data/computer_usage.csv'
METADATA = './data/libraries_metadata.csv'
AUTHORITIES = './data/uk_local_authorities.csv'


def rotate_activity_data():
    """Rotate the activity data from the input CSV file into multiple output files."""

    with open(INPUT, mode='r', newline='', encoding='utf-8') as infile, \
            open(AUTHORITIES, mode='r', newline='', encoding='utf-8') as authorities_file, \
            open(MEMBERS, mode='w', newline='', encoding='utf-8') as members_out, \
            open(EVENTS, mode='w', newline='', encoding='utf-8') as events_out, \
            open(ATTENDANCE, mode='w', newline='', encoding='utf-8') as attendance_out, \
            open(ISSUES, mode='w', newline='', encoding='utf-8') as issues_out, \
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

        issues_writer = csv.DictWriter(issues_out, fieldnames=[
            'Authority', 'Item type', 'Age group', 'Period', 'Count'])
        issues_writer.writeheader()
        issues = []

        visits_writer = csv.DictWriter(visits_out, fieldnames=[
            'Authority', 'Age group', 'Period', 'Count'])
        visits_writer.writeheader()
        visits = []

        computer_usage_writer = csv.DictWriter(computer_usage_out, fieldnames=[
            'Authority', 'Age group', 'Period', 'Count'])
        computer_usage_writer.writeheader()
        computer_usage = []

        metadata_writer = csv.DictWriter(metadata_out, fieldnames=[
            'Authority', 'Year', 'Total Events', 'Total Attendance', 'Total Issues', 'Total Visits', 'Total Computer Usage'])
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

                if 'adults' in header:
                    age_group = 'Adults'
                elif '11_under' in header:
                    age_group = 'Under 12'
                elif '12_17' in header:
                    age_group = '12-17'
                elif 'all_ages' in header:
                    age_group = 'All Ages'

                physical_digital = None
                if 'physical' in header:
                    physical_digital = 'Physical'
                elif 'digital' in header:
                    physical_digital = 'Digital'

                # total_active_members active_members_11_under active_members_adults active_members_12_17
                # Members: We want a schema of Authority, Age Group, Count
                if header.startswith('active_members') and value != "":
                    authority_members.append({
                        'Authority': authority_code,
                        'Age group': age_group,
                        'Count': value
                    })

                if header.startswith('total_active_members'):
                    # We only record the total members IF there is no data for the individual age groups.
                    if row.get('active_members_11_under') == "" and \
                       row.get('active_members_adults') == "" and \
                       row.get('active_members_12_17') == "":
                        authority_members.append({
                            'Authority': authority_code,
                            'Age group': 'All Ages',
                            'Count': value
                        })

                # Now events - these are the columns total_physical_events_april,total_physical_events_may,total_physical_events_june,total_physical_events_july,total_physical_events_august,total_physical_events_september,total_physical_events_october,total_physical_events_november,total_physical_events_december,total_physical_events_january,total_physical_events_february,total_physical_events_march,physical_events_adults_april,physical_events_adults_may,physical_events_adults_june,physical_events_adults_july,physical_events_adults_august,physical_events_adults_september,physical_events_adults_october,physical_events_adults_november,physical_events_adults_december,physical_events_adults_january,physical_events_adults_february,physical_events_adults_march,physical_events_11_under_april,physical_events_11_under_may,physical_events_11_under_june,physical_events_11_under_july,physical_events_11_under_august,physical_events_11_under_september,physical_events_11_under_october,physical_events_11_under_november,physical_events_11_under_december,physical_events_11_under_january,physical_events_11_under_february,physical_events_11_under_march,physical_events_12_17_april,physical_events_12_17_may,physical_events_12_17_june,physical_events_12_17_july,physical_events_12_17_august,physical_events_12_17_september,physical_events_12_17_october,physical_events_12_17_november,physical_events_12_17_december,physical_events_12_17_january,physical_events_12_17_february,physical_events_12_17_march,physical_events_all_ages_april,physical_events_all_ages_may,physical_events_all_ages_june,physical_events_all_ages_july,physical_events_all_ages_august,physical_events_all_ages_september,physical_events_all_ages_october,physical_events_all_ages_november,physical_events_all_ages_december,physical_events_all_ages_january,physical_events_all_ages_february,physical_events_all_ages_march,total_digital_events_april,total_digital_events_may,total_digital_events_june,total_digital_events_july,total_digital_events_august,total_digital_events_september,total_digital_events_october,total_digital_events_november,total_digital_events_december,total_digital_events_january,total_digital_events_february,total_digital_events_march,digital_events_adults_april,digital_events_adults_may,digital_events_adults_june,digital_events_adults_july,digital_events_adults_august,digital_events_adults_september,digital_events_adults_october,digital_events_adults_november,digital_events_adults_december,digital_events_adults_january,digital_events_adults_february,digital_events_adults_march,digital_events_11_under_april,digital_events_11_under_may,digital_events_11_under_june,digital_events_11_under_july,digital_events_11_under_august,digital_events_11_under_september,digital_events_11_under_october,digital_events_11_under_november,digital_events_11_under_december,digital_events_11_under_january,digital_events_11_under_february,digital_events_11_under_march,digital_events_12_17_april,digital_events_12_17_may,digital_events_12_17_june,digital_events_12_17_july,digital_events_12_17_august,digital_events_12_17_september,digital_events_12_17_october,digital_events_12_17_november,digital_events_12_17_december,digital_events_12_17_january,digital_events_12_17_february,digital_events_12_17_march,digital_events_all_ages_april,digital_events_all_ages_may,digital_events_all_ages_june,digital_events_all_ages_july,digital_events_all_ages_august,digital_events_all_ages_september,digital_events_all_ages_october,digital_events_all_ages_november,digital_events_all_ages_december,digital_events_all_ages_january,digital_events_all_ages_february,digital_events_all_ages_march
                if header.startswith('total_physical_events') or header.startswith('physical_events') or header.startswith('total_digital_events') or header.startswith('digital_events'):
                    authority_events.append({
                        'Authority': authority_code,
                        'Event type': physical_digital,
                        'Age group': age_group or 'All ages',
                        'Period': period_start,
                        'Count': value
                    })

                # Attendance: total_attendees_physical_events_april,total_attendees_physical_events_may,total_attendees_physical_events_june,total_attendees_physical_events_july,total_attendees_physical_events_august,total_attendees_physical_events_september,total_attendees_physical_events_october,total_attendees_physical_events_november,total_attendees_physical_events_december,total_attendees_physical_events_january,total_attendees_physical_events_february,total_attendees_physical_events_march,physical_attendees_adults_april,physical_attendees_adults_may,physical_attendees_adults_june,physical_attendees_adults_july,physical_attendees_adults_august,physical_attendees_adults_september,physical_attendees_adults_october,physical_attendees_adults_november,physical_attendees_adults_december,physical_attendees_adults_january,physical_attendees_adults_february,physical_attendees_adults_march,physical_attendees_11_under_april,physical_attendees_11_under_may,physical_attendees_11_under_june,physical_attendees_11_under_july,physical_attendees_11_under_august,physical_attendees_11_under_september,physical_attendees_11_under_october,physical_attendees_11_under_november,physical_attendees_11_under_december,physical_attendees_11_under_january,physical_attendees_11_under_february,physical_attendees_11_under_march,physical_attendees_12_17_april,physical_attendees_12_17_may,physical_attendees_12_17_june,physical_attendees_12_17_july,physical_attendees_12_17_august,physical_attendees_12_17_september,physical_attendees_12_17_october,physical_attendees_12_17_november,physical_attendees_12_17_december,physical_attendees_12_17_january,physical_attendees_12_17_february,physical_attendees_12_17_march,total_attendees_digital_events_april,total_attendees_digital_events_may,total_attendees_digital_events_june,total_attendees_digital_events_july,total_attendees_digital_events_august,total_attendees_digital_events_september,total_attendees_digital_events_october,total_attendees_digital_events_november,total_attendees_digital_events_december,total_attendees_digital_events_january,total_attendees_digital_events_february,total_attendees_digital_events_march,digital_attendees_adults_april,digital_attendees_adults_may,digital_attendees_adults_june,digital_attendees_adults_july,digital_attendees_adults_august,digital_attendees_adults_september,digital_attendees_adults_october,digital_attendees_adults_november,digital_attendees_adults_december,digital_attendees_adults_january,digital_attendees_adults_february,digital_attendees_adults_march,digital_attendees_11_under_april,digital_attendees_11_under_may,digital_attendees_11_under_june,digital_attendees_11_under_july,digital_attendees_11_under_august,digital_attendees_11_under_september,digital_attendees_11_under_october,digital_attendees_11_under_november,digital_attendees_11_under_december,digital_attendees_11_under_january,digital_attendees_11_under_february,digital_attendees_11_under_march,digital_attendees_12_17_april,digital_attendees_12_17_may,digital_attendees_12_17_june,digital_attendees_12_17_july,digital_attendees_12_17_august,digital_attendees_12_17_september,digital_attendees_12_17_october,digital_attendees_12_17_november,digital_attendees_12_17_december,digital_attendees_12_17_january,digital_attendees_12_17_february,digital_attendees_12_17_march
                if header.startswith('total_attendees_physical_events') or header.startswith('physical_attendees') or \
                   header.startswith('total_attendees_digital_events') or header.startswith('digital_attendees'):
                    if value is not None and value != "":
                        authority_attendance.append({
                            'Authority': authority_code,
                            'Event type': physical_digital,
                            'Age group': age_group or 'All ages',
                            'Period': period_start,
                            'Count': value
                        })

            # For attendance we need to split the array into arrays grouped by just event type and age group
            attendance_dict = {}
            for record in authority_attendance:
                key = (record['Event type'],
                       record['Age group'])
                if key not in attendance_dict:
                    attendance_dict[key] = []
                attendance_dict[key].append(record)

            # Then for each grouping we need to work out if the dates are monthly or quarterly
            # Quarterly will only have 4 completed entries - monthly will have 12
            frequency = None
            for (event_type, age_group), records in attendance_dict.items():
                if len(records) == 4:
                    frequency = 'Quarterly'
                elif len(records) == 12:
                    frequency = 'Monthly'

                for record in records:
                    period = None
                    if frequency == 'Monthly':
                        period = record['Period'] + '/P1M'
                    elif frequency == 'Quarterly':
                        period = record['Period'] + '/P3M'
                    record['Period'] = period

            attendance.extend(authority_attendance)
            members.extend(authority_members)
            events.extend(authority_events)

        # Write the aggregated data to the respective CSV files
        attendance_writer.writerows(attendance)
        members_writer.writerows(members)
        events_writer.writerows(events)


rotate_activity_data()
