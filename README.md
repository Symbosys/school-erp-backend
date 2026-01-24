# School ERP Backend API

Subscription-based School Management System with complete student progression tracking.

## 🚀 Quick Start

```bash
# Install dependencies
bun install

# Setup environment
cp .env.example .env

# Run migrations
bunx prisma migrate dev

# Generate Prisma Client
bunx prisma generate

# Start server
bun dev
```

## 📡 API Modules

### School Management

- `POST /api/school/onboard` - Onboard new school
- `GET /api/school` - List all schools (with filters)
- `GET /api/school/:id` - Get school details
- `PUT /api/school/:id` - Update school
- `PATCH /api/school/:id/status` - Toggle status
- `PATCH /api/school/:id/subscription` - Update subscription
- `DELETE /api/school/:id/logo` - Delete logo

## 🗄️ Database Models

- **School** - Multi-tenant with subscription
- **AcademicYear** - Year-wise tracking
- **Student** - With progression history via `StudentEnrollment`
- **Teacher** - With class & subject assignments
- **Class & Section** - Organizational structure
- **Parent** - Multiple parents per student
- **Attendance** - Student & staff tracking

## 🔐 Environment Variables

See `.env.example` for required configuration.

## 📚 Documentation

For detailed API documentation, check individual module README files.
