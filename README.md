# HevrutAI Review 1.0

Product release in the existing `hevrutaiorg-afk/hevrutai-site` repository. The previous website is preserved at `/framework.html`; the existing intake form and library links are retained.

## Supported user tasks

1. Review an article before sharing: exact passages, actor attribution questions, causal statements, source attribution.
2. Challenge an AI answer: preserve the original output and prompt, identify claims, test sources and chronology.
3. Document possible antisemitism: exact speech, surrounding context, evidence, dates, reviewer notes. A phrase match is never a determination of intent or antisemitism.

The first release is a paste-first evidence workspace. It does not fetch articles, conduct live web research, authenticate sources, verify reviewer identities, or automatically approve archive entries. A completed checklist is coverage, not an accuracy score. The original FAC-01 through FAC-28 names were recovered from the existing `hevrutai_dashboard_v4.html`; their IDs and roles are preserved, with operational questions added.

## Working functions

- Browser-side structural pattern scan with actual quoted passages.
- Claim ledger, source passages and user-assigned evidence tiers, dated events.
- All 28 review checks with unresolved state and editable notes.
- Editable provisional conclusion and self-reported reviewer notes.
- Device save/open/delete; JSON case export/import; plain-text copy; printable report; standalone HTML report.
- Explicit case links with content in the URL fragment. No cloud sharing database is implied. Links exclude AI output and have a 24,000-character cap. Imported findings are unverified; unvalidated AI output is dropped.
- Existing Airtable review intake, when its preexisting server secrets and table are operational. Only an actual service receipt yields success. Visitor input cannot approve an archive entry.

## AI activation and limits

`/api/analyze` supports direct Gemini, an OpenAI-compatible provider, or the original HevrutAI Supabase `audit` function. The existing Supabase anonymous publishable configuration is reused; it is not a provider secret or service-role credential. Environment variables can override it. Provider secrets stay server-side.

The connection indicator distinguishes configuration from availability. Only a successful POST confirms a live result. The UI never substitutes sample data when the provider is unavailable. AI requests require an explicit visitor consent checkbox and click. Analysis is limited to supplied text and supplied source passages. AI output must include all 28 facets, exact input passages, known source IDs, and evidence for factual standings. These validation rules constrain outputs but do not prove that the model correctly interprets the evidence. A human must examine every finding.

The legacy backend returns a fixed tool envelope. The adapter asks for the evidence-bounded report as JSON inside its text output field, validates that report, and discards the legacy numerical scores. A live transport test returned all 28 facets with evidence-deficient standing in about 17 seconds. If a response fails the new contract, the request fails visibly; never weaken output validation to make an old response appear successful.

The per-instance request counter is a modest throttle, not a durable abuse-control system. Before broad, paid AI launch, configure provider budget caps and a persistent rate limiter/authentication appropriate to the audience. The local evidence workspace can operate without AI.

## Hosting and validation

The repository is already associated with the existing Vercel website. Static files require no build. Vercel serves the `api/` functions; `api/analyze.js` allows 120 seconds. Run `npm test` and `npm run check`. No third-party runtime dependencies are required.

Automated tests cover protocol stability, passive attribution, contextual treatment of quoted hate, unresolved findings, import sanitization, unsafe links, timeline ordering, fabricated AI passages/references, incomplete facets, origin enforcement, outages, and validated provider transport using fixtures. Fixture tests do not establish live AI availability. Browser visual QA was unavailable in the authoring environment.

## Next production milestone

The missing production capability is independently retrieved and verified evidence for novel claims. Add it as an explicit provenance stage: retrieve permitted URLs, preserve dated excerpts, assign source IDs, distinguish primary record from commentary, then challenge and synthesize against that retrieved corpus. Avoid importing older case verdicts or numerical RWI scores as independent proof. Preserve human approval for the Opposition Library.

© 2026 Stacy La Mell · HevrutAI. The evidence is the authority.
