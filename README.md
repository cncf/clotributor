# CLOTributor

[![CI](https://github.com/cncf/clotributor/workflows/CI/badge.svg)](https://github.com/cncf/clotributor/actions?query=workflow%3ACI)

[**CLOTributor**](https://clotributor.dev) makes it easier to discover great opportunities to become a [**Cloud Native**](https://www.cncf.io) contributor.

<table>
    <tr>
        <td width="50%"><img src="docs/screenshots/home-light.png?raw=true"></td>
        <td width="50%"><img src="docs/screenshots/home-dark.png?raw=true"></td>
    </tr>
</table>

## How it works

One of the CLOTributor's goals is to surface interesting opportunities for potential contributors to [Cloud Native projects](https://www.cncf.io/projects/), allowing them to find those that suit their skills and interests best.

To achieve this, **CLOTributor** scans periodically hundreds of repositories, indexing issues that match certain criteria:

- Contain the `help wanted` label
- Their state is `OPEN`
- They are `unassigned`
- Updated within the last year

In addition to some issue's details, like the *title* or *labels*, we also collect and index some metadata from the corresponding repository, like its *topics* or the *programming languages* used. We are also working on trying to normalize some labels we've observed across issues on different repositories to make it easier to categorize and filter them.

At the moment some labels are highlighted in a special way, like `good first issue` or labels that contain the string `bug`. In general, the more context projects can provide in their issues via labels, the better. Labels like `frontend`, or even specific mentioning specific frameworks like `react` or `vue`, may help users finding issues that suit them best.

The generated index can be searched from <https://clotributor.dev>. The following syntax can be used to narrow down the results:

- Use multiple words to refine the search. **Example:** [*gitops go*](https://clotributor.dev/search?ts_query_web=gitops+go)
- Use `-` to exclude words from the search. **Example:** [*rust -webassembly*](https://clotributor.dev/search?ts_query_web=rust+-webassembly)
- Put a phrase inside `double quotes` for an exact match. **Example:** [*"machine learning"*](https://clotributor.dev/search?ts_query_web=%22machine+learning%22)
- Use `or` to combine multiple searches. **Example:** [*networking or security*](https://clotributor.dev/search?ts_query_web=networking+or+security)

## Projects and repositories

**CLOTributor's** data source for projects and repositories is [**CLOMonitor**](https://github.com/cncf/clomonitor#projects), which lists most of the projects in the [CNCF](https://www.cncf.io/projects/) and [LF AI & DATA](https://lfaidata.foundation/projects/) foundations.

## Contributing

Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for more details.

## Code of Conduct

This project follows the [CNCF Code of Conduct](https://github.com/cncf/foundation/blob/master/code-of-conduct.md).

## License

CLOTributor is an Open Source project licensed under the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0).
