# ADR 001: Adopt Architecture Decision Records (ADRs)

Status: Accepted

## Context

As the application grows, architectural decisions accumulate. Without a record, the reasoning behind patterns gets lost — new developers (and coding agents) encounter rules without understanding why they exist. The same questions resurface. Decisions get reversed without knowing what was considered before.

The project already has `.claude/rules/` files that define _what_ the conventions are. ADRs complement those by documenting _why_ the decisions were made and _what was rejected_.

This is particularly valuable when working with AI coding agents. Agents that understand the reasoning behind a pattern are far less likely to route around it than agents that only see the rule.

## Decision

We will use Architecture Decision Records (ADRs) stored in `docs/adrs/` to capture significant architectural decisions.

Each ADR:

- Covers a single decision
- Is written at the time the decision is made
- Is never edited once accepted — superseded by a new ADR instead
- Follows the template in `docs/adrs/_template.md`
- Is numbered sequentially: `ADR-NNN-short-title.md`

## Justification

- Decisions made months ago are understandable without archaeology
- Alternatives considered are visible, reducing re-litigation
- Coding agents stay on track when they understand intent, not just rules
- New contributors onboard faster with less tribal knowledge dependency

## When to Write an ADR

Write one when the decision is:

- A proposed architecture change or long-term direction
- Adding or removing a core dependency
- A change in an existing pattern or practice
- Something that will cause confusion without an explanation

Do not write one for:

- Product or business decisions
- Minor refactors or style changes
- Day-to-day implementation work

## Alternatives

- **Inline comments**: Scattered, not discoverable, lost with refactors.
- **Confluence/Notion docs**: Not co-located with code, agents can't access them.
- **Nothing**: Current state — rules exist but reasoning is tribal knowledge.

## Consequences

- Small upfront cost to write an ADR for each significant decision
- `docs/adrs/` becomes a source of truth for architectural intent
- `.claude/rules/` remains the authoritative _what_; ADRs document the _why_

## Notes

- [architecture-decision-record ADR GitHub Repository](https://github.com/joelparkerhenderson/architecture_decision_record)
- [AWS Prescriptive Guidance on ADRs](https://docs.aws.amazon.com/prescriptive-guidance/latest/architectural-decision-records/welcome.html)
