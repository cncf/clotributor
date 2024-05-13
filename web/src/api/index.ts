import { isEmpty, isNull, isUndefined } from 'lodash';
import isArray from 'lodash/isArray';

import { DEFAULT_SORT_BY } from '../data';
import { Error, ErrorKind, FiltersReponse, Issue, SearchQuery } from '../types';

interface FetchOptions {
  method: 'POST' | 'GET' | 'PUT' | 'DELETE' | 'HEAD';
  headers?: {
    [key: string]: string;
  };
  body?: string;
}

interface APIFetchProps {
  url: string;
  opts?: FetchOptions;
  headers?: string[];
}

class API_CLASS {
  private API_BASE_URL = '/api';
  private HEADERS = {
    pagination: 'Pagination-Total-Count',
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private getHeadersValue(res: any, params?: string[]): any {
    if (!isUndefined(params) && params.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const headers: any = {};
      params.forEach((param: string) => {
        if (res.headers.has(param)) {
          headers[param] = res.headers.get(param);
        }
      });
      return headers;
    }
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async processFetchOptions(opts?: FetchOptions): Promise<FetchOptions | any> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const options: FetchOptions | any = opts || {};
    if (opts && ['DELETE', 'POST', 'PUT'].includes(opts.method)) {
      return {
        ...options,
        headers: {
          ...options.headers,
        },
      };
    }
    return options;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async handleErrors(res: any) {
    if (!res.ok) {
      let error: Error;
      switch (res.status) {
        default:
          try {
            const text = await res.json();
            error = {
              kind: ErrorKind.Other,
              message: text.message !== '' ? text.message : undefined,
            };
          } catch {
            error = {
              kind: ErrorKind.Other,
            };
          }
      }
      throw error;
    }
    return res;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async handleContent(res: any, headers?: string[]) {
    const response = res;
    let content;
    let tmpHeaders;

    switch (response.headers.get('Content-Type')) {
      case 'text/plain; charset=utf-8':
      case 'csv':
        content = await response.text();
        return content;
      case 'application/json':
        content = await response.json();
        tmpHeaders = this.getHeadersValue(res, headers);
        if (!isNull(tmpHeaders)) {
          if (isArray(content)) {
            content = { items: content };
          }
          content = { ...content, ...tmpHeaders };
        }
        return content;
      default:
        return response;
    }
  }

  private async apiFetch(props: APIFetchProps) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const options: FetchOptions | any = await this.processFetchOptions(props.opts);

    return fetch(props.url, options)
      .then(this.handleErrors)
      .then((res) => this.handleContent(res, props.headers))
      .catch((error) => Promise.reject(error));
  }

  public getIssuesFilters(): Promise<FiltersReponse> {
    return this.apiFetch({
      url: `${this.API_BASE_URL}/filters/issues`,
    });
  }

  public searchIssues(query: SearchQuery): Promise<{ items: Issue[]; 'Pagination-Total-Count': string }> {
    // Only is used sort by selection when ts_query_web is defined
    let q: string = `limit=${query.limit}&offset=${query.offset}&sort_by=${
      query.ts_query_web ? query.sort_by || DEFAULT_SORT_BY : DEFAULT_SORT_BY
    }`;

    if (query.ts_query_web) {
      q += `&ts_query_web=${query.ts_query_web}`;
    }

    if (query.mentor_available) {
      q += '&mentor_available=true';
    }

    if (query.good_first_issue) {
      q += '&good_first_issue=true';
    }

    if (!isUndefined(query.filters) && !isEmpty(query.filters)) {
      Object.keys(query.filters!).forEach((k: string) => {
        query.filters![k].forEach((f: string, index: number) => {
          q += `&${k}[${index}]=${encodeURIComponent(f)}`;
        });
      });
    }
    return this.apiFetch({
      url: `${this.API_BASE_URL}/issues/search?${q.toString()}`,
      headers: [this.HEADERS.pagination],
      opts: {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    });
  }
}

const API = new API_CLASS();
export default API;
