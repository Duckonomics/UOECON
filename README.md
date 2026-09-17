# UO Economics interactive-paper template

This repository turns an author-approved public research paper into a hosted question-and-answer webpage. Visitors do not install ChatGPT, Claude, a ZIP file, or an MCP server. The webpage calls an OpenAI model through a Cloudflare Worker while keeping the API key on the server.

## What this template does

- Answers from a public Markdown copy of one paper.
- Offers researcher, policy/practice, and general-reader answer styles.
- Renders safe Markdown, selected figures, and selected table excerpts.
- Limits each conversation to three answered questions.
- Limits each IP-derived daily identifier to ten successful questions by default.
- Applies a configurable global monthly request cap.
- Keeps the OpenAI API key server-side.
- Sets `store: false` on OpenAI Responses API requests.
- Does not store questions or answers in application code.

Cloudflare and OpenAI may still process request and account metadata under their respective terms.

## What this template does not do

It does not access restricted-use data, run replication code, reach author computers, expose credentials, or reproduce analyses on demand. Those capabilities require a separately reviewed research-computing architecture and should not be added merely by uploading restricted data.

This paper-only design does **not** require Model Context Protocol (MCP). MCP becomes relevant if a future project intentionally exposes reviewed computational tools or public datasets to compatible AI clients.

## Background resources

- Nature paper: [Reimagining research papers as interactive and reliable AI agents](https://www.nature.com/articles/s41586-026-11044-y)
- Original project: [jmiao24/Paper2Agent](https://github.com/jmiao24/Paper2Agent)
- Optional tool protocol: [Model Context Protocol specification](https://github.com/modelcontextprotocol/modelcontextprotocol)

## Start here

1. Fork or copy this repository into a new repository for one paper.
2. Replace `public/paper/paper.md` with an author-approved public-text extraction.
3. Edit `public/site-config.js` for the public page.
4. Edit `wrangler.jsonc` for the Worker name, paper title, authors, limits, and contact email.
5. Optionally configure author-reviewed figures and table excerpts in `src/paper-config.js`.
6. Follow `DEPLOY.md` to create dedicated OpenAI and Cloudflare resources.
7. Complete every item in `RELEASE_CHECKLIST.md` before sharing the link.

## Files students normally edit

| File | Purpose |
|---|---|
| `public/paper/paper.md` | Public source text used to answer questions |
| `public/site-config.js` | Page title, authors, links, examples, and optional featured figure |
| `src/paper-config.js` | Evidence policy and optional figure/table response mappings |
| `wrangler.jsonc` | Worker name, model, contact email, and usage limits |
| `public/assets/` | Approved public figure images or crops |

Most students should not need to modify `src/index.js` or `public/app.js`.

## Preparing the paper source

The quality of the assistant depends on a clear, checked source file.

- Preserve headings such as `## Methods`, `## Figure 2`, and `## Appendix Table 4`.
- Include captions and table notes.
- Describe important figures in words, including axes, series, treatment timing, estimates, and uncertainty.
- For selected table excerpts, state which rows or columns were omitted.
- Identify the paper version and public source URL.
- Test every headline numerical claim against the PDF.

Do not assume that permission to share code permits sharing data, manuscript text, figures, or publisher-formatted PDFs. Authors should confirm the applicable rights and licenses.

## Recommended repository organization

Use one repository per interactive paper, created from this template. Keep restricted data in its approved environment. If the paper also has a public replication repository, link to it rather than merging unrelated deployment secrets or restricted pipelines into this repository.

## Local preview

The static design can be opened from `public/index.html`, but the chat requires a Worker. After installing dependencies, run:

```powershell
npm install
npx.cmd wrangler dev
```

For Windows systems that block PowerShell scripts, use `npx.cmd`, not `npx`.

## Security boundary

Never commit:

- OpenAI API keys
- Cloudflare credentials or local Wrangler state
- `.dev.vars` or `.env` files
- Restricted or confidential data
- Raw person-level records
- Unreviewed unpublished results

See `SECURITY_AND_PRIVACY.md` for the full checklist.

