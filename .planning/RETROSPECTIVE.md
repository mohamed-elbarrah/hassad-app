# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.1 — Client Reports Dashboard (التقارير)

**Shipped:** 2026-05-08
**Phases:** 3 | **Plans:** 5 | **Commits:** 3 (implementation) + 1 (archival)

### What Was Built
- Two backend aggregate endpoints (`/portal/reports`, `/portal/reports/timeline`) with client-scoped batch queries, period-over-period trends, and Arabic localization
- 6 Recharts-based UI components: bar chart, line chart, donut chart, top campaigns table, smart tips, time range selector
- RTK Query integration with full TypeScript interfaces and loading/error/empty states
- Portal sidebar and BottomNav updated with "التقارير" link
- Rule-based smart tips engine generating up to 4 Arabic insights from KPI data

### What Worked
- Backend service layer was straightforward to extend due to existing PortalService patterns
- Recharts components followed existing patterns from campaign detail page — consistent code style
- RTL Arabic layout was handled correctly with existing design system tokens

### What Was Inefficient
- No phase SUMMARY.md files were written during implementation — had to reconstruct from code post-hoc
- Requirements traceability table was never updated during development — all remained "Pending"
- Planning documents (04-01, 04-02, 04-03) were created but no plans existed for Phases 5 and 6 — built as integrated work
- No separate PRs or milestone branch — all work committed directly to fix/general-updates

### Patterns Established
- Phase SUMMARY.md should be written immediately after phase completion, not reconstructed at milestone close
- Requirements traceability should be updated in real-time as implementation progresses
- Consider using milestone branches to track scope boundaries

### Key Lessons
1. Write SUMMARY.md files immediately when a phase is completed — do not defer to milestone close
2. Keep requirements traceability table in sync with implementation — update status as each requirement ships
3. Break down frontend phases into explicit plans even if they seem "integrated" — improves tracking

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.1 | ~3 | 3 | First milestone with formal archiving workflow |

### Top Lessons (Verified Across Milestones)

1. Planning documents must be kept in sync with actual implementation
2. SUMMARY.md files should be created at phase completion time, not reconstructed later
