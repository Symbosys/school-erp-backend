# Common Module

Shared functionalities including centralized leave management for Students and Teachers.

---

## API Endpoints

### Leave Management

- `POST /api/common/leave` - Apply for leave (Student/Teacher)
- `GET /api/common/leave/my-leaves` - Get leave history (Logged-in user)
- `GET /api/common/leave/school/:schoolId` - List all leave requests (Admin)
- `PATCH /api/common/leave/:id/status` - Approve/Reject leave
- `DELETE /api/common/leave/:id` - Delete/Cancel leave request

---

## Request Examples

### Apply for Leave

```json
{
  "schoolId": "uuid",
  "startDate": "2026-03-10",
  "endDate": "2026-03-12",
  "reason": "Viral fever",
  "type": "SICK"
}
```

### Update Leave Status

```json
{
  "status": "APPROVED",
  "approvedBy": "uuid-of-approver"
}
```

### Reject Leave

```json
{
  "status": "REJECTED",
  "rejectionReason": "Insufficient leave balance",
  "approvedBy": "uuid-of-approver"
}
```
