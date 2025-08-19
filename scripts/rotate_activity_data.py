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

        events_writer = csv.DictWriter(events_out, fieldnames=[
            'Authority', 'Event type', 'Age group', 'Start', 'End', 'Count'])
        events_writer.writeheader()

        attendance_out = csv.DictWriter(attendance_out, fieldnames=[
            'Authority', 'Event type', 'Age group', 'Start', 'End', 'Count'])
        attendance_out.writeheader()

        # Each row is all the authority's activity data for the year
        for row in reader:

            authority = row['authority']
            authority_code = None
            authority_nice_name = None

            if authority in authorities:
                authority_code = authorities[authority]['gss-code']
                authority_nice_name = authorities[authority]['nice-name']
            else:
                # If the authority is not found, we skip this row.
                print(f"Authority '{authority}' not found in authorities data.")
                continue

            # Each row is a single reading which could be a monthly count or other data point.
            for header, value in row.items():

                # Month is a common aspect of the header name e.g. 'september'.
                # We need to adjust the month to YYYY-MM-DD format.
                # For months we will record a start and end date for the month.
                start = None
                end = None

                if 'april' in header:
                    start = '2023-04-01'
                    end = '2023-04-30'
                elif 'may' in header:
                    start = '2023-05-01'
                    end = '2023-05-31'
                elif 'june' in header:
                    start = '2023-06-01'
                    end = '2023-06-30'
                elif 'july' in header:
                    start = '2023-07-01'
                    end = '2023-07-31'
                elif 'august' in header:
                    start = '2023-08-01'
                    end = '2023-08-31'
                elif 'september' in header:
                    start = '2023-09-01'
                    end = '2023-09-30'
                elif 'october' in header:
                    start = '2023-10-01'
                    end = '2023-10-31'
                elif 'november' in header:
                    start = '2023-11-01'
                    end = '2023-11-30'
                elif 'december' in header:
                    start = '2023-12-01'
                    end = '2023-12-31'
                elif 'january' in header:
                    start = '2024-01-01'
                    end = '2024-01-31'
                elif 'february' in header:
                    start = '2024-02-01'
                    end = '2024-02-29'  # 2024 is a leap year
                elif 'march' in header:
                    start = '2024-03-01'
                    end = '2024-03-31'

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
                    members_writer.writerow(
                        {'Authority': authority_code, 'Age group': age_group, 'Count': value})

                if header.startswith('total_active_members'):
                    # We only record the total members IF there is no data for the individual age groups.
                    if row.get('active_members_11_under') == "" and \
                       row.get('active_members_adults') == "" and \
                       row.get('active_members_12_17') == "":
                        members_writer.writerow({
                            'Authority': authority_code,
                            'Age group': 'Unknown',
                            'Count': value
                        })

                # Now events - these are the columns total_physical_events_april,total_physical_events_may,total_physical_events_june,total_physical_events_july,total_physical_events_august,total_physical_events_september,total_physical_events_october,total_physical_events_november,total_physical_events_december,total_physical_events_january,total_physical_events_february,total_physical_events_march,physical_events_adults_april,physical_events_adults_may,physical_events_adults_june,physical_events_adults_july,physical_events_adults_august,physical_events_adults_september,physical_events_adults_october,physical_events_adults_november,physical_events_adults_december,physical_events_adults_january,physical_events_adults_february,physical_events_adults_march,physical_events_11_under_april,physical_events_11_under_may,physical_events_11_under_june,physical_events_11_under_july,physical_events_11_under_august,physical_events_11_under_september,physical_events_11_under_october,physical_events_11_under_november,physical_events_11_under_december,physical_events_11_under_january,physical_events_11_under_february,physical_events_11_under_march,physical_events_12_17_april,physical_events_12_17_may,physical_events_12_17_june,physical_events_12_17_july,physical_events_12_17_august,physical_events_12_17_september,physical_events_12_17_october,physical_events_12_17_november,physical_events_12_17_december,physical_events_12_17_january,physical_events_12_17_february,physical_events_12_17_march,physical_events_all_ages_april,physical_events_all_ages_may,physical_events_all_ages_june,physical_events_all_ages_july,physical_events_all_ages_august,physical_events_all_ages_september,physical_events_all_ages_october,physical_events_all_ages_november,physical_events_all_ages_december,physical_events_all_ages_january,physical_events_all_ages_february,physical_events_all_ages_march,total_digital_events_april,total_digital_events_may,total_digital_events_june,total_digital_events_july,total_digital_events_august,total_digital_events_september,total_digital_events_october,total_digital_events_november,total_digital_events_december,total_digital_events_january,total_digital_events_february,total_digital_events_march,digital_events_adults_april,digital_events_adults_may,digital_events_adults_june,digital_events_adults_july,digital_events_adults_august,digital_events_adults_september,digital_events_adults_october,digital_events_adults_november,digital_events_adults_december,digital_events_adults_january,digital_events_adults_february,digital_events_adults_march,digital_events_11_under_april,digital_events_11_under_may,digital_events_11_under_june,digital_events_11_under_july,digital_events_11_under_august,digital_events_11_under_september,digital_events_11_under_october,digital_events_11_under_november,digital_events_11_under_december,digital_events_11_under_january,digital_events_11_under_february,digital_events_11_under_march,digital_events_12_17_april,digital_events_12_17_may,digital_events_12_17_june,digital_events_12_17_july,digital_events_12_17_august,digital_events_12_17_september,digital_events_12_17_october,digital_events_12_17_november,digital_events_12_17_december,digital_events_12_17_january,digital_events_12_17_february,digital_events_12_17_march,digital_events_all_ages_april,digital_events_all_ages_may,digital_events_all_ages_june,digital_events_all_ages_july,digital_events_all_ages_august,digital_events_all_ages_september,digital_events_all_ages_october,digital_events_all_ages_november,digital_events_all_ages_december,digital_events_all_ages_january,digital_events_all_ages_february,digital_events_all_ages_march
                if header.startswith('total_physical_events') or header.startswith('physical_events') or header.startswith('total_digital_events') or header.startswith('digital_events'):

                    events_writer.writerow({
                        'Authority': authority_code,
                        'Event type': physical_digital,
                        'Age group': age_group,
                        'Start': start,
                        'End': end,
                        'Count': value
                    })

                # Attendance: total_attendees_physical_events_april,total_attendees_physical_events_may,total_attendees_physical_events_june,total_attendees_physical_events_july,total_attendees_physical_events_august,total_attendees_physical_events_september,total_attendees_physical_events_october,total_attendees_physical_events_november,total_attendees_physical_events_december,total_attendees_physical_events_january,total_attendees_physical_events_february,total_attendees_physical_events_march,physical_attendees_adults_april,physical_attendees_adults_may,physical_attendees_adults_june,physical_attendees_adults_july,physical_attendees_adults_august,physical_attendees_adults_september,physical_attendees_adults_october,physical_attendees_adults_november,physical_attendees_adults_december,physical_attendees_adults_january,physical_attendees_adults_february,physical_attendees_adults_march,physical_attendees_11_under_april,physical_attendees_11_under_may,physical_attendees_11_under_june,physical_attendees_11_under_july,physical_attendees_11_under_august,physical_attendees_11_under_september,physical_attendees_11_under_october,physical_attendees_11_under_november,physical_attendees_11_under_december,physical_attendees_11_under_january,physical_attendees_11_under_february,physical_attendees_11_under_march,physical_attendees_12_17_april,physical_attendees_12_17_may,physical_attendees_12_17_june,physical_attendees_12_17_july,physical_attendees_12_17_august,physical_attendees_12_17_september,physical_attendees_12_17_october,physical_attendees_12_17_november,physical_attendees_12_17_december,physical_attendees_12_17_january,physical_attendees_12_17_february,physical_attendees_12_17_march,total_attendees_digital_events_april,total_attendees_digital_events_may,total_attendees_digital_events_june,total_attendees_digital_events_july,total_attendees_digital_events_august,total_attendees_digital_events_september,total_attendees_digital_events_october,total_attendees_digital_events_november,total_attendees_digital_events_december,total_attendees_digital_events_january,total_attendees_digital_events_february,total_attendees_digital_events_march,digital_attendees_adults_april,digital_attendees_adults_may,digital_attendees_adults_june,digital_attendees_adults_july,digital_attendees_adults_august,digital_attendees_adults_september,digital_attendees_adults_october,digital_attendees_adults_november,digital_attendees_adults_december,digital_attendees_adults_january,digital_attendees_adults_february,digital_attendees_adults_march,digital_attendees_11_under_april,digital_attendees_11_under_may,digital_attendees_11_under_june,digital_attendees_11_under_july,digital_attendees_11_under_august,digital_attendees_11_under_september,digital_attendees_11_under_october,digital_attendees_11_under_november,digital_attendees_11_under_december,digital_attendees_11_under_january,digital_attendees_11_under_february,digital_attendees_11_under_march,digital_attendees_12_17_april,digital_attendees_12_17_may,digital_attendees_12_17_june,digital_attendees_12_17_july,digital_attendees_12_17_august,digital_attendees_12_17_september,digital_attendees_12_17_october,digital_attendees_12_17_november,digital_attendees_12_17_december,digital_attendees_12_17_january,digital_attendees_12_17_february,digital_attendees_12_17_march
                if header.startswith('total_attendees_physical_events') or header.startswith('physical_attendees') or \
                   header.startswith('total_attendees_digital_events') or header.startswith('digital_attendees'):

                    attendance_out.writerow({
                        'Authority': authority_code,
                        'Event type': physical_digital,
                        'Age group': age_group,
                        'Start': start,
                        'End': end,
                        'Count': value
                    })


rotate_activity_data()
