# dsh-web-search-duck

Web search provider for the DSH `ctx.web` seam. It bridges any OpenAI **Responses-API-compatible** endpoint that supports the `web_search_preview` tool: the query is sent to the endpoint, and `url_citation` annotations in the response are mapped to a concise answer plus deduplicated sources.

Registers search provider id `duck-responses-search`.

## Configuration

| env | meaning | default |
| --- | --- | --- |
| `DUCK_SEARCH_ENDPOINT` | Responses API endpoint URL | **required** |
| `DUCK_SEARCH_MODEL` | model name sent in the request | **required** |
| `DUCK_SEARCH_CREDENTIAL` | DSH credentials-store key used for `Authorization: Bearer` | `DSH_WEB_SEARCH_TOKEN` |

Without endpoint/model configured the provider throws a clear error instead of guessing.

## Enable

Point the web seam at this provider in your host patch:

```yaml
- id: web
  override:
    searchProvider: duck-responses-search
```

## Install

Install it from the **DSH Plugin Market** (Settings → Plugin Market), or add it to your profile bundle stack manually — see `cordis.patch.yml`. Prebuilt; no build step required.

## License

MIT
