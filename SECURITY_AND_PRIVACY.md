# Security, privacy, and research-data boundary

## Required boundary

The public Worker may contain only material approved for public release. It must not contain or retrieve:

- Restricted-use or confidential data
- Direct or indirect personal identifiers
- Data-access credentials
- Author computer paths or remote-control capabilities
- Unpublished results that have not been approved for release
- Executable analysis endpoints unless separately reviewed

Visitors can ask questions about published analyses. They cannot rerun analyses on an author's computer through this template.

## Secrets

Store `OPENAI_API_KEY` and `RATE_LIMIT_SALT` as Cloudflare Worker secrets. Keep `.dev.vars`, `.env`, `.wrangler`, and `.wrangler-config` out of Git. If a secret is committed or displayed publicly, revoke and replace it immediately.

## Logging

The application does not intentionally store questions or answers. It logs unexpected server errors through `console.error`; those errors should not include the API key or complete paper prompt. Cloudflare and OpenAI may retain service metadata under their policies and account configuration. Review institutional requirements before launch.

If question analytics are added later, disclose them clearly, collect only what is needed, define retention and access rules, and obtain any required institutional review. Do not silently begin storing full questions.

## Rate limits and cost controls

The application enforces conversation, daily, and monthly request limits, but these are not substitutes for the OpenAI project's budget controls. Configure a project budget and alerts directly in the OpenAI platform.

## Source integrity

Every claim highlighted in a prompt guide, figure caption, or selected table must be checked by an author or knowledgeable reviewer. Label excerpts as excerpts and preserve units, uncertainty measures, specification names, and relevant notes.

## Incident response

If unexpected content, cost, or access occurs:

1. Disable the Worker's `workers.dev` route or remove the OpenAI secret.
2. Review Cloudflare observability and OpenAI project usage.
3. Revoke a potentially exposed API key.
4. Correct and retest the source/configuration before restoring access.

