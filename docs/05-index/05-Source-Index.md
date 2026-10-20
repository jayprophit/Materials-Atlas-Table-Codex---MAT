# MAT Source Index

## Purpose

The Source Index provides human-readable navigation into MAT's global source registry.

The [generated source directory and backlinks](Source-Navigation.md) now provide actual registered sources, original external destinations, retained local snapshots and internal citing files. Search these in the Studio reader's Resources → Browse source navigation section. [Documentation gap analysis](Documentation-Gap-Analysis-2026-10-03.md) records remaining bibliographic and terminology work. The format guidance below remains applicable; missing metadata stays explicit.

---

# Source ID Format

```text
SRC-000001
SRC-000002
SRC-000003
```

---

# Source Categories

```text
PRIMARY-JOURNAL
REVIEW
DATABASE
STANDARD
HANDBOOK
TEXTBOOK
PATENT
THESIS
TECHNICAL-REPORT
GOVERNMENT
INSTRUMENT-DATA
SIMULATION
HISTORICAL
WEB
```

---

# Canonical Source Entry

```yaml
source_id:
title:
authors:
year:
organization:
doi:
url:
source_type:
license:
used_by:
```

---

# Primary Origin

Where a database reproduces data originating in a paper, MAT should retain both:

```text
DISTRIBUTION SOURCE
```

and:

```text
ORIGINAL SCIENTIFIC SOURCE
```

where known.

---
