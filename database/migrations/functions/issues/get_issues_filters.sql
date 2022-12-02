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
                    'name', initcap(maturity::text),
                    'value', maturity::text
                )), '[]')
                from (
                    select unnest(enum_range(null::maturity)) as maturity
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
        )
    );
$$ language sql;
