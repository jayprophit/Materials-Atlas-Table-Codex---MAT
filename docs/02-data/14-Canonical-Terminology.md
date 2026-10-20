# Canonical MAT terminology

The [terminology owner](../../data/vocabularies/glossary.json) now supplies the [prose glossary](../08-back-matter/00-Glossary.md), [book hover data](../../book/data/glossary.json) and [publication glossary](../../data/publication/generated/publication-glossary.json). Studio continues to read the same prose chapter. The [builder](../../scripts/build-glossary.mjs) checks preserved origins before generating outputs; [shared lookup logic](../../book/modules/glossary.mjs) resolves explicit labels without guessing scientific synonyms.

## Preserved definitions and identities

The migration retains all 22 existing prose definitions, all 14 previous hover definitions and their three differing formulations. There are 33 terms with permanent vocabulary identifiers of the form `MAT:TERM:000001`. These identify terminology entries; existing matter and source registry identities remain unchanged. Prose takes precedence where both forms previously defined the same label. The old hover wording remains a visible variant alongside its original locator.

The original [prose bytes](../../data/research/sources/mat-glossary-prose-2026-10-03.md) and [hover table](../../data/research/sources/mat-hover-glossary-2026-10-03.json) are preserved with SHA-256 hashes. Multiline definitions and the Evidence Type example list remain intact. The former `halflife` lookup is an explicit alternate label for Half-life. Case, spaces, underscores and hyphens normalize for lookup; other punctuation and semantic distinctions are retained.

All migrated definitions have `SOURCE-REVIEW-PENDING` status. Their internal origins explain where the wording came from; they do not establish independent scientific evidence. No external source IDs, symbols, units or domain-specific scopes are invented. Causali E retains a separate `AUTHORED-FRAMEWORK` label. Simplified legacy wording, including Atomic Radius and Oxidation State, still requires a source-backed scientific definition review.

## Update and verify

Edit the canonical vocabulary and preserve prior identifiers and definition origins. Run `npm run build:glossary` before book/publication builds. Run `npm run validate:glossary` to check exact origin hashes, definition retention and output freshness. The full integrity suite runs this check; offline book saves include the generated glossary and shared runtime module.

The current preservation gate requires migrated text to match its retained origin exactly. A future scientific correction needs an explicit reviewed revision mechanism with a new source locator and retained previous wording; do not silently replace text or loosen the gate. The fields for source IDs, scope, symbols and units are presently unresolved or empty.

## Remaining documentation gaps

This is a glossary with explicit preferred and alternate labels. Broader/narrower/related lexical concepts, disambiguated domain definitions, translation alignment and a full thesaurus remain future work. Vocabulary relationships must stay separate from scientific or causal relationships. The [documentation comparison](../05-index/Documentation-Gap-Analysis-2026-10-03.md), [existing task ledger](../../data/quality/MAT-TODO.json) and [source directory](../05-index/Source-Navigation.md) retain those requirements and evidence limits.
