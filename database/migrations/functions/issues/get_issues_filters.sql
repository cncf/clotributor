-- Return the filters that can be used when searching for issues in json format.
create or replace function get_issues_filters()
returns json as $$
    select json_build_array(
        json_build_object(
            'title', 'Foundation',
            'key', 'foundation',
            'options', (
                select coalesce(json_agg(json_build_object(
                    'name', display_name,
                    'value', foundation_id
                )), '[]')
                from (
                    select foundation_id, display_name
                    from foundation
                    order by foundation_id asc
                ) f
            )
        ),
        json_build_object(
            'title', 'Maturity',
            'key', 'maturity',
            'options', (
                select coalesce(json_agg(json_build_object(
                    'name', initcap(maturity),
                    'value', maturity
                )), '[]')
                from (
                    select distinct maturity
                    from project
                    where maturity is not null
                    order by maturity asc
                ) m
            )
        ),
        json_build_object(
            'title', 'Project',
            'key', 'project',
            'options', (
                select coalesce(json_agg(json_build_object(
                    'name', coalesce(display_name, name),
                    'value', name
                )), '[]')
                from (
                    select distinct p.display_name, p.name
                    from project p
                    join repository r using (project_id)
                    join issue i using (repository_id)
                    order by name asc
                ) m
            )
        ),
        json_build_object(
            'title', 'Area',
            'key', 'area',
            'options', (
                select coalesce(json_agg(json_build_object(
                    'name', initcap(area::text),
                    'value', area::text
                )), '[]')
                from (
                    select unnest(enum_range(null::area)) as area
                ) a
            )
        ),
        json_build_object(
            'title', 'Kind',
            'key', 'kind',
            'options', (
                select coalesce(json_agg(json_build_object(
                    'name', initcap(kind::text),
                    'value', kind::text
                )), '[]')
                from (
                    select unnest(enum_range(null::kind)) as kind
                ) k
            )
        ),
        json_build_object(
            'title', 'Difficulty',
            'key', 'difficulty',
            'options', (
                select coalesce(json_agg(json_build_object(
                    'name', initcap(difficulty::text),
                    'value', difficulty::text
                )), '[]')
                from (
                    select unnest(enum_range(null::difficulty)) as difficulty
                ) d
            )
        ),
        json_build_object(
            'title', 'Language',
            'key', 'language',
            'options', (
                select coalesce(json_agg(json_build_object(
                    'name', language,
                    'value', language
                )), '[]')
                from (
                    select distinct(unnest(languages)) as language
                    from repository
                    order by language asc
                ) m
            )
        ),
        '{
            "title": "Other",
            "options": [
                {
                    "name": "Good first issue",
                    "key": "good_first_issue",
                    "type": "boolean"
                },
                {
                    "name": "Mentor available",
                    "key": "mentor_available",
                    "type": "boolean"
                }
            ]
        }'::jsonb
    );
$$ language sql;
