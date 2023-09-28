# CLOTributor

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

Issues that no longer match the required criteria are *removed* automatically from **CLOTributor**. This way, if an issue is assigned to someone or it is closed, it won't be displayed anymore.

In addition to some issue's details, like the *title* or *labels*, we also collect and index some metadata from the corresponding repository, like its *topics* or the *programming languages* used. In general, the more context projects can provide in their issues via labels, the better. There is a [set of labels](#labels-with-special-meaning) that have a special meaning for CLOTributor. Other labels like `frontend`, or even mentioning specific frameworks like `react` or `vue`, may also help users finding issues that suit them best.

The generated index can be searched from <https://clotributor.dev>. The following syntax can be used to narrow down the results:

- Use multiple words to refine the search. **Example:** [*gitops go*](https://clotributor.dev/search?ts_query_web=gitops+go)
- Use `-` to exclude words from the search. **Example:** [*rust -webassembly*](https://clotributor.dev/search?ts_query_web=rust+-webassembly)
- Put a phrase inside `double quotes` for an exact match. **Example:** [*"machine learning"*](https://clotributor.dev/search?ts_query_web=%22machine+learning%22)
- Use `or` combine multiple searches. **Example:** [*networking or security*](https://clotributor.dev/search?ts_query_web=networking+or+security)

It's possible to search by project name, repository name, description, topics, or programming languages, as well as issue title and labels. Prefix matching for all of them is also supported (e.g. searching for `backst` should return issues from the `Backstage` project).

## Labels with special meaning

Some of the features of **CLOTributor** are controlled by some special labels (or labels that contain some strings) that can be set on issues. One of the most important labels for CLOTributor is `help wanted`, as it only processes issues where help is wanted. Issues are categorized in some different ways based on these labels:

#### Area

- **docs**: the issue has a label that contains the string `docs` or `documentation`.

#### Kind

- **bug**: the issue has a label that contains the string `bug`.
- **feature**: the issue has a label that contains the string `feature`.
- **enhancement**: the issue has a label that contains the string `enhancement` or `improvement`.

#### Difficulty

- **easy**: the issue has the label `difficulty/easy` or `level/easy`.
- **medium**: the issue has the label `difficulty/medium` or `level/medium`.
- **hard**: the issue has the label `difficulty/hard` or `level/hard`.

#### Other filters

- `good first issue`: use this label to highlight issues that may be a good fit for new contributors to the project.
- `mentor available` or `mentorship`: to indicate that someone may be available to guide contributors with this issue.

## Maintainers wanted

If your project is looking for maintainers, CLOTributor can highlight this in a special way to let potential candidates know. This feature can be enabled by submitting a PR to add the block below to the corresponding project in the [data files](https://github.com/cncf/clomonitor/tree/main/data). You can add as many links or contacts as you need, or omit any of them if you prefer.

```yaml
maintainers_wanted:
  enabled: true
  links:
    - title: How to contribute to the project
      url: https://github.com/org/repo/CONTRIBUTING.md
    - title: Development environment setup
      url: https://github.com/org/repo/docs/dev_env_setup.md
  contacts:
    - github_handle: user1
    - github_handle: user2
```

*NOTE: the user submitting the pull request **must** already be a project's maintainer.*

## Projects and repositories

**CLOTributor's** data source for projects and repositories is [**CLOMonitor**](https://github.com/cncf/clomonitor#projects), which lists most of the projects in the [CNCF](https://www.cncf.io/projects/) and [LF AI & DATA](https://lfaidata.foundation/projects/) foundations.

## Contributing

Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for more details.

## Code of Conduct

This project follows the [CNCF Code of Conduct](https://github.com/cncf/foundation/blob/master/code-of-conduct.md).

## License

CLOTributor is an Open Source project licensed under the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0).
