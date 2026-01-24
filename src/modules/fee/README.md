# Fee Management Module

Comprehensive fee management including category setup, class-wise structure, student fee assignment, payments, and discounts.

---

## API Endpoints

### Fee Categories

- `POST /api/fee/category` - Create fee category
- `GET /api/fee/category/school/:schoolId` - List categories
- `GET /api/fee/category/:id` - Get category
- `PUT /api/fee/category/:id` - Update category
- `DELETE /api/fee/category/:id` - Delete category

### Fee Structures (Class-wise)

- `POST /api/fee/structure` - Create fee structure with items
- `GET /api/fee/structure/school/:schoolId` - List structures
- `GET /api/fee/structure/:id` - Get structure with items
- `PUT /api/fee/structure/:id` - Update structure
- `DELETE /api/fee/structure/:id` - Delete structure
- `POST /api/fee/structure/item` - Add item to structure
- `DELETE /api/fee/structure/item/:id` - Remove item

### Student Fees

- `POST /api/fee/student` - Assign fee to student
- `POST /api/fee/student/bulk` - Bulk assign to section
- `GET /api/fee/student/school/:schoolId` - List school fees
- `GET /api/fee/student/student/:studentId` - Get student's fees
- `GET /api/fee/student/:id` - Get fee with month details
- `PUT /api/fee/student/:id` - Update fee status

### Payments

- `POST /api/fee/payment` - Record payment for specific month
- `POST /api/fee/payment/auto-allocate` - Auto-allocate to pending months
- `GET /api/fee/payment/student/:studentId` - Get student payments
- `GET /api/fee/payment/receipt/:receiptNumber` - Get by receipt
- `GET /api/fee/payment/:id` - Get payment details

### Discounts

- `POST /api/fee/discount` - Create discount
- `GET /api/fee/discount/school/:schoolId` - List school discounts
- `GET /api/fee/discount/student/:studentId` - Get student discounts
- `GET /api/fee/discount/:id` - Get discount
- `PUT /api/fee/discount/:id` - Update discount
- `DELETE /api/fee/discount/:id` - Delete discount

---

## Request Examples

### Create Fee Structure

```json
{
  "schoolId": "uuid",
  "classId": "uuid",
  "academicYearId": "uuid",
  "name": "Class 5 Fee 2024-25",
  "totalAmount": 50000,
  "dueDay": 10,
  "lateFeePercentage": 5,
  "gracePeriodDays": 5,
  "items": [
    { "feeCategoryId": "uuid", "amount": 3000, "frequency": "MONTHLY" },
    { "feeCategoryId": "uuid", "amount": 2000, "frequency": "YEARLY" }
  ]
}
```

### Record Payment

```json
{
  "studentFeeDetailId": "uuid",
  "amount": 3000,
  "paymentMethod": "UPI",
  "transactionId": "TXN123456",
  "collectedBy": "Admin Name"
}
```
