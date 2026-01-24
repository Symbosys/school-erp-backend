# Parent Module

Handles functionality accessible to Parents, including viewing their children's data and school communications.

---

## API Endpoints

### Parent-Teacher Meetings (PTM)

- `GET /api/parents/ptm/my-meetings`
  - **Description**: Fetch upcoming and past PTMs relevant to the parent's children.
  - **Logic**: Returns meetings targeted to:
    - The Class of any child.
    - The Section of any child.
    - The Parent explicitly (Individual).

### Access Control

- All routes require **Bearer Token** authentication (`Parent` scope).
- Middleware: `authenticateParent` (in `middlewares/parent-auth.middleware.ts`).

---

## Directory Structure

- `controllers/`: Request handlers (Profile, PTMs).
- `routes/`: Express route definitions.
- `validation/`: Zod schemas (if applicable).
