# Teacher Module

Teacher management including onboarding, profile, subject assignments, class assignments, attendance, and salary management.

---

## Teacher APIs

### Onboarding & CRUD

- `POST /api/teacher/onboard` - Onboard new teacher
- `GET /api/teacher/school/:schoolId` - List teachers
- `GET /api/teacher/:id` - Get teacher details
- `PUT /api/teacher/:id` - Update teacher
- `DELETE /api/teacher/:id` - Delete teacher

### Subject Assignments

- `POST /api/teacher/subject` - Assign subject
- `GET /api/teacher/subject/teacher/:teacherId` - Get by teacher
- `DELETE /api/teacher/subject/:id` - Remove assignment

### Class Assignments

- `POST /api/teacher/class-assignment` - Assign to class
- `GET /api/teacher/class-assignment/teacher/:teacherId` - Get by teacher
- `DELETE /api/teacher/class-assignment/:id` - Remove

### Attendance

- `POST /api/teacher/attendance/bulk` - Bulk mark attendance
- `GET /api/teacher/attendance/school/:schoolId` - Daily sheet
- `GET /api/teacher/attendance/teacher/:teacherId` - History
- `PUT /api/teacher/attendance/:id` - Update

---

## Salary Management APIs

### Salary Components (Earnings/Deductions)

- `POST /api/teacher/salary/component` - Create component
- `GET /api/teacher/salary/component/school/:schoolId` - List
- `GET /api/teacher/salary/component/:id` - Get
- `PUT /api/teacher/salary/component/:id` - Update
- `DELETE /api/teacher/salary/component/:id` - Delete

### Salary Structures (Packages)

- `POST /api/teacher/salary/structure` - Create with items
- `GET /api/teacher/salary/structure/school/:schoolId` - List
- `GET /api/teacher/salary/structure/:id` - Get
- `PUT /api/teacher/salary/structure/:id` - Update
- `DELETE /api/teacher/salary/structure/:id` - Delete
- `POST /api/teacher/salary/structure/item` - Add item
- `DELETE /api/teacher/salary/structure/item/:id` - Remove

### Teacher Salary (Monthly)

- `POST /api/teacher/salary/process` - Process single
- `POST /api/teacher/salary/process/bulk` - Bulk process
- `GET /api/teacher/salary/school/:schoolId` - List by school
- `GET /api/teacher/salary/teacher/:teacherId` - History
- `GET /api/teacher/salary/:id` - Get details
- `PUT /api/teacher/salary/:id` - Update

### Salary Payments

- `POST /api/teacher/salary/payment` - Record payment
- `GET /api/teacher/salary/payment/teacher/:teacherId` - History
- `GET /api/teacher/salary/payment/:id` - Get details

---

## Request Examples

### Create Salary Structure

```json
{
  "schoolId": "uuid",
  "name": "Senior Teacher Package",
  "baseSalary": 50000,
  "items": [
    { "salaryComponentId": "uuid-basic", "amount": 30000 },
    { "salaryComponentId": "uuid-hra", "amount": 10000, "percentage": 20 },
    { "salaryComponentId": "uuid-pf", "amount": 3600 }
  ]
}
```

### Process Monthly Salary

```json
{
  "teacherId": "uuid",
  "salaryStructureId": "uuid",
  "month": 4,
  "year": 2024,
  "workingDays": 26,
  "presentDays": 24
}
```
