# Library Management Module

Comprehensive library management including book catalog, borrowing, returns, and fine management.

---

## API Endpoints

### Book Categories

- `POST /api/library/category` - Create category
- `GET /api/library/category/school/:schoolId` - List
- `GET /api/library/category/:id` - Get
- `PUT /api/library/category/:id` - Update
- `DELETE /api/library/category/:id` - Delete

### Books & Copies

- `POST /api/library/book` - Create book with copies
- `GET /api/library/book/school/:schoolId` - List (search supported)
- `GET /api/library/book/:id` - Get with copies
- `PUT /api/library/book/:id` - Update
- `DELETE /api/library/book/:id` - Delete
- `POST /api/library/book/copy` - Add copy
- `DELETE /api/library/book/copy/:id` - Remove copy

### Issue/Return

- `POST /api/library/issue` - Issue book
- `POST /api/library/return` - Return book
- `GET /api/library/school/:schoolId` - All issues
- `GET /api/library/student/:studentId` - By student
- `GET /api/library/teacher/:teacherId` - By teacher
- `GET /api/library/overdue/:schoolId` - Overdue list

### Fines

- `POST /api/library/fine` - Create fine
- `POST /api/library/fine/pay` - Pay fine
- `GET /api/library/fine/unpaid/:schoolId` - Unpaid fines

---

## Request Examples

### Create Book

```json
{
  "schoolId": "uuid",
  "categoryId": "uuid",
  "title": "The Great Gatsby",
  "author": "F. Scott Fitzgerald",
  "isbn": "978-0743273565",
  "copies": [{ "copyNumber": "LIB-001", "location": "Shelf A1" }]
}
```

### Issue Book

```json
{
  "bookCopyId": "uuid",
  "studentId": "uuid",
  "dueDate": "2024-05-15",
  "issuedBy": "Librarian Name"
}
```
