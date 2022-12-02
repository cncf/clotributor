-- Search for issues using the input parameters provided and returns the
-- results in json format.
create or replace function search_issues(p_input jsonb)
returns table(issues json, total_count bigint) as $$
declare
    v_limit int := coalesce((p_input->>'limit')::int, 10);
    v_offset int := coalesce((p_input->>'offset')::int, 0);
    v_sort_by text := coalesce(p_input->>'sort_by', 'most_recent');
    v_foundation text[];
    v_maturity text[];
    v_project text[];
    v_tsquery_web tsquery := websearch_to_tsquery(p_input->>'ts_query_web');
    v_tsquery_web_with_prefix_matching tsquery;
begin
    -- Prepare filters
    if p_input ? 'foundation' and p_input->'foundation' <> 'null' then
        select array_agg(e::text) into v_foundation
        from jsonb_array_elements_text(p_input->'foundation') e;
    end if;
    if p_input ? 'maturity' and p_input->'maturity' <> 'null' then
        select array_agg(e::text) into v_maturity
        from jsonb_array_elements_text(p_input->'maturity') e;
    end if;
    if p_input ? 'project' and p_input->'project' <> 'null' then
        select array_agg(e::text) into v_project
        from jsonb_array_elements_text(p_input->'project') e;
    end if;

    -- Prepare v_tsquery_web_with_prefix_matching
    if v_tsquery_web is not null then
        select ts_rewrite(
            v_tsquery_web,
            format('
                select
                    to_tsquery(lexeme),
                    to_tsquery(lexeme || '':*'')
                from unnest(tsvector_to_array(to_tsvector(%L))) as lexeme
                ', p_input->>'ts_query_web'
            )
        ) into v_tsquery_web_with_prefix_matching;
    end if;

    return query
    with filtered_issues as (
        select
            i.number as issue_number,
            i.title as issue_title,
            i.url as issue_url,
            i.labels as issue_labels,
            i.published_at as issue_published_at,
            r.name as repository_name,
            r.url as repository_url,
            r.homepage_url as repository_homepage_url,
            r.topics as repository_topics,
            r.languages as repository_languages,
            r.stars as repository_stars,
            p.name as project_name,
            p.display_name as project_display_name,
            p.logo_url as project_logo_url,
            p.devstats_url as project_devstats_url,
            p.accepted_at as project_accepted_at,
            p.maturity as project_maturity,
            p.foundation_id as project_foundation,
            (
                case when v_tsquery_web is not null then
                    trunc(ts_rank(tsdoc, v_tsquery_web)::numeric, 2)
                else 1 end
            ) as relevance
        from issue i
        join repository r using (repository_id)
        join project p using (project_id)
        where
            case when v_tsquery_web is not null then
                v_tsquery_web_with_prefix_matching @@ i.tsdoc
            else true end
        and
            case when cardinality(v_foundation) > 0 then
            p.foundation_id = any(v_foundation) else true end
        and
            case when cardinality(v_maturity) > 0 then
            p.maturity::text = any(v_maturity) else true end
        and
            case when cardinality(v_project) > 0 then
            p.name = any(v_project) else true end
    )
    select
        (
            select coalesce(json_agg(json_strip_nulls(json_build_object(
                'number', issue_number,
                'title', issue_title,
                'url', issue_url,
                'labels', issue_labels,
                'published_at', floor(extract(epoch from issue_published_at)),
                'repository', json_build_object(
                    'name', repository_name,
                    'url', repository_url,
                    'homepage_url', repository_homepage_url,
                    'topics', repository_topics,
                    'languages', repository_languages,
                    'stars', repository_stars
                ),
                'project', json_build_object(
                    'name', project_name,
                    'display_name', project_display_name,
                    'logo_url', project_logo_url,
                    'devstats_url', project_devstats_url,
                    'accepted_at', project_accepted_at,
                    'maturity', project_maturity,
                    'foundation', project_foundation
                ),
                '_relevance', relevance
            ))), '[]')
            from (
                select *
                from filtered_issues
                order by
                    (case when v_sort_by = 'most_recent' then issue_published_at end) desc,
                    (case when v_sort_by = 'relevance' then (relevance, issue_published_at)  end) desc
                limit v_limit
                offset v_offset
            ) fp
        ),
        (
            select count(*) from filtered_issues
        );
end
$$ language plpgsql;
