---
trigger: always_on
---

# Synapse Architecture Rules

1. **Providers Pattern**:
   - Data access logic (filesystem, API, etc.) should reside in `src/providers/`.
   - Providers should implement consistent interfaces (e.g., `IProvider` or similar if defined).

2. **Configuration**:
   - Use `dotenv` for environment variables.
   - Support both CLI arguments and Environment variables for critical config (like `NOTES_ROOT`).