# Decisions

- Central EF metadata convention avoids hand-maintaining every Identity column and adds no package.
- Migration history uses provider IHistoryRepository customization, with explicit bootstrap rename
  before migrations. Changing the configured history table alone would lose discovery of old history.
  Reference: https://learn.microsoft.com/en-us/ef/core/managing-schemas/migrations/history-table
- Use PostgreSQL rename operations to retain rows and relationships; do not reset migrations or DB.
- Keep CLR/JSON names and enum values unchanged because the request concerns physical DB naming.
