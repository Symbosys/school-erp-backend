# School Module

Complete school management: onboarding, subscription, academic year, class, section, and subject configuration.

---

## School APIs

- `POST /api/school/onboard` - Onboard new school
- `GET /api/school` - List schools
- `GET /api/school/:id` - Get school
- `PUT /api/school/:id` - Update school
- `PATCH /api/school/:id/status` - Toggle status
- `PATCH /api/school/:id/subscription` - Update subscription
- `DELETE /api/school/:id/logo` - Delete logo

## Academic Year APIs

- `POST /api/school/academic-year` - Create year
- `GET /api/school/academic-year/school/:schoolId` - Get all years
- `GET /api/school/academic-year/current/:schoolId` - Get current ==> not done 
- `GET /api/school/academic-year/:id` - Get by ID
- `PUT /api/school/academic-year/:id` - Update year
- `PATCH /api/school/academic-year/:id/set-current` - Set current
- `DELETE /api/school/academic-year/:id` - Delete year

## Class APIs

- `POST /api/school/class` - Create class
- `GET /api/school/class/school/:schoolId` - Get all classes
- `GET /api/school/class/:id` - Get by ID
- `PUT /api/school/class/:id` - Update class
- `DELETE /api/school/class/:id` - Delete class

## Section APIs

- `POST /api/school/section` - Create section
- `GET /api/school/section/class/:classId` - Get by class ==> not done 
- `GET /api/school/section/school/:schoolId` - Get by school
- `GET /api/school/section/:id` - Get by ID
- `PUT /api/school/section/:id` - Update section
- `DELETE /api/school/section/:id` - Delete section

## Subject APIs

- `POST /api/school/subject` - Create subject
- `POST /api/school/subject/assign-to-class` - Assign to class
- `GET /api/school/subject/school/:schoolId` - Get all subjects for a school
- `GET /api/school/subject/class/:classId` - Get all subjects for a class
- `GET /api/school/subject/:id` - Get by ID
- `PUT /api/school/subject/:id` - Update subject
- `PUT /api/school/subject/class-subject/:id` - Update assignment
- `DELETE /api/school/subject/:id` - Delete subject
- `DELETE /api/school/subject/class-subject/:id` - Remove from class

---

## Request Examples

**Subject:**

```json
{
  "schoolId": "uuid",
  "name": "Mathematics",
  "code": "MATH",
  "description": "Mathematics subject"
}
```

**Assign to Class:**

```json
{
  "classId": "uuid",
  "subjectId": "uuid",
  "isCompulsory": true
}
```
