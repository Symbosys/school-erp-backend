# Student Module

Student management including onboarding, profile, enrollment tracking, attendance, and status configuration.

---

## Student APIs

### Onboarding & CRUD

- `POST /api/student/onboard` - Onboard new student (with optional initial enrollment & profile picture)
- `GET /api/student/school/:schoolId` - List students (pagination, filters: status, class, section)
- `GET /api/student/:id` - Get student details
- `PUT /api/student/:id` - Update student (with profile picture)
- `DELETE /api/student/:id` - Delete student

### Enrollment APIs

- `POST /api/student/enrollment` - Create new enrollment (enroll existing student to new class/year)
- `GET /api/student/enrollment/student/:studentId` - Get enrollment history for a student
- `GET /api/student/enrollment/:id` - Get enrollment details
- `PUT /api/student/enrollment/:id` - Update enrollment (e.g., promote, change section)
- `DELETE /api/student/enrollment/:id` - Delete enrollment

### Attendance APIs

- `POST /api/student/attendance/bulk` - Mark attendance for a class (upsert)
- `GET /api/student/attendance/section/:sectionId?date=YYYY-MM-DD&academicYearId=uuid` - Get daily attendance sheet
- `GET /api/student/attendance/student/:studentId` - Get attendance history
- `PUT /api/student/attendance/:id` - Update single attendance record

---

## Request Examples

### Mark Bulk Attendance

```json
{
  "academicYearId": "uuid",
  "schoolId": "uuid",
  "sectionId": "uuid",
  "date": "2024-04-01",
  "markedBy": "Teacher Name",
  "students": [
    { "studentId": "uuid1", "status": "PRESENT" },
    { "studentId": "uuid2", "status": "ABSENT", "remarks": "Sick Leave" }
  ]
}
```

---

## Future Features

- Fee Management Integration
