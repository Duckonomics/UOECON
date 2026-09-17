# Release checklist

## Rights and sources

- [ ] Authors approved the public paper version used by the assistant.
- [ ] Rights to republish included text, tables, and figures were confirmed.
- [ ] No restricted, confidential, person-level, or unpublished material is present.
- [ ] Paper title, authors, version date, and source link are correct.

## Content review

- [ ] Abstract, methods, results, limitations, figure captions, and table notes are included.
- [ ] Headline estimates and units match the paper.
- [ ] Important figures have accurate alternative text and author-reviewed captions.
- [ ] Selected table excerpts identify omitted rows or columns.
- [ ] Unsupported questions produce a clear limitation rather than a guess.
- [ ] Researcher, policy/practice, and general-reader modes were tested.

## Security and cost

- [ ] No API key or salt appears in Git, HTML, JavaScript, screenshots, or documentation.
- [ ] OpenAI API key belongs to a dedicated project.
- [ ] OpenAI project budget and alerts are configured.
- [ ] Cloudflare secrets `OPENAI_API_KEY` and `RATE_LIMIT_SALT` are present on the correct Worker.
- [ ] Daily and monthly caps are appropriate.
- [ ] The application has no access to restricted data or author computers.

## Functional testing

- [ ] Question 1 receives a grounded answer.
- [ ] Question 2 receives a grounded answer.
- [ ] Question 3 receives a grounded answer.
- [ ] Question 4 is blocked in the same conversation.
- [ ] A new conversation resets only the conversation limit.
- [ ] Failed model requests are not counted.
- [ ] Bold text, lists, paragraphs, and links render correctly.
- [ ] Configured figures and tables appear for the intended questions only.
- [ ] The page works on a phone-sized screen.
- [ ] The original-paper and contact links are correct.
- [ ] The deployed Worker name and public URL are the intended final versions.

## Handoff

- [ ] Repository README identifies the maintainer.
- [ ] Another project member can deploy without receiving a personal all-project API key.
- [ ] The public webpage explains its privacy and computational boundary.
- [ ] A process exists for corrections, takedown, and API-key rotation.

