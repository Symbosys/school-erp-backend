# Exam and Result Module

Comprehensive exam management including exam creation, marks entry, result generation, and grading.

---

## API Endpoints

### Exam Management

- `POST /api/exam` - Create exam with subjects
- `GET /api/exam/school/:schoolId` - List exams
- `GET /api/exam/:id` - Get exam details
- `PUT /api/exam/:id` - Update exam
- `DELETE /api/exam/:id` - Delete exam
- `POST /api/exam/subject` - Add subject to exam
- `DELETE /api/exam/subject/:id` - Remove subject

### Marks Entry

- `POST /api/exam/marks` - Enter marks (bulk)
- `GET /api/exam/marks/subject/:examSubjectId` - By subject
- `GET /api/exam/marks/student/:studentId` - By student
- `GET /api/exam/marks/exam/:examId` - All marks
- `PUT /api/exam/marks/:id` - Update mark
- `DELETE /api/exam/marks/:id` - Delete mark

### Results

- `POST /api/exam/result/generate` - Generate results
- `GET /api/exam/result/exam/:examId` - Results by exam
- `GET /api/exam/result/student/:studentId` - By student
- `GET /api/exam/result/:id` - Result details

### Grade Scale

- `POST /api/exam/grade-scale` - Create grade
- `GET /api/exam/grade-scale/school/:schoolId` - List
- `GET /api/exam/grade-scale/:id` - Get
- `PUT /api/exam/grade-scale/:id` - Update
- `DELETE /api/exam/grade-scale/:id` - Delete

---

## Request Examples

### Create Exam

```json
{
  "schoolId": "uuid",
  "academicYearId": "uuid",
  "classId": "uuid",
  "name": "Mid-Term Exam",
  "examType": "MID_TERM",
  "startDate": "2024-04-01",
  "endDate": "2024-04-15",
  "passingPercentage": 33,
  "subjects": [
    {
      "subjectId": "uuid",
      "maxMarks": 100,
      "passingMarks": 33,
      "examDate": "2024-04-01"
    }
  ]
}
```

### Enter Marks

```json
{
  "examSubjectId": "uuid",
  "enteredBy": "Teacher Name",
  "marks": [
    { "studentId": "uuid1", "marksObtained": 85 },
    { "studentId": "uuid2", "marksObtained": 0, "isAbsent": true }
  ]
}
```
