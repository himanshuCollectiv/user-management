# User Management System (UMS)

A secure and modular **User Management System** built with **Node.js, Express.js, PostgreSQL, Sequelize, JWT, and Nodemailer**.

The system supports user authentication, email verification, password management, profile management, session management, role-based admin access, user search/filtering, account activation/deactivation, and scheduled cleanup jobs.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Roles and Permissions](#roles-and-permissions)
- [Database Design](#database-design)
- [Authentication and Authorization](#authentication-and-authorization)
- [Refresh Token Rotation](#refresh-token-rotation)
- [Email Verification](#email-verification)
- [Password Management](#password-management)
- [User Profile Management](#user-profile-management)
- [Session Management](#session-management)
- [Admin User Management](#admin-user-management)
- [Master Data Fetch APIs](#master-data-fetch-apis)
- [Validation and Error Handling](#validation-and-error-handling)
- [Scheduled Cleanup Jobs](#scheduled-cleanup-jobs)
- [Email Service](#email-service)
- [Security](#security)
- [API Documentation](#api-documentation)
- [Setup and Installation](#setup-and-installation)
- [Environment Variables](#environment-variables)
- [Admin Seeder](#admin-seeder)
- [API Testing](#api-testing)
- [Project Scope](#project-scope)

---

## Project Overview

The **User Management System (UMS)** provides a backend API for managing users and administrators.

The application supports two roles:

- `user`
- `admin`

### Main Features

- User registration
- Email verification
- Login and logout
- JWT authentication
- Access token and refresh token
- Refresh token rotation
- Refresh token family/session tracking
- Password reset through email
- Change password
- User profile management
- User session management
- Admin user creation
- Admin user listing
- Search and filtering
- Pagination
- Admin user details
- Admin user update
- Account activation/deactivation
- User deletion
- Department/designation/location handling
- Read-only master data APIs
- Centralized error handling
- Request validation
- Scheduled cleanup jobs
- Gmail OAuth2 email integration

---

## Technology Stack

| Technology | Purpose |
|---|---|
| Node.js | Backend runtime |
| Express.js | REST API framework |
| PostgreSQL | Relational database |
| Neon PostgreSQL | Cloud PostgreSQL |
| Sequelize | ORM |
| JWT | Authentication |
| bcrypt | Password hashing |
| Nodemailer | Email sending |
| Google OAuth2 | Gmail authentication |
| express-validator | Request validation |
| cookie-parser | Cookie handling |
| Morgan | HTTP request logging |
| node-cron | Scheduled cleanup |
| dotenv | Environment configuration |

---

## Project Structure

```text
Sample Folder Structure/
│
├── controllers/
│   ├── users/
│   └── admin/
│
├── data/
│   ├── connection/
│   │   └── connection.js
│   │
│   ├── managers/
│   │   ├── users/
│   │   └── admin/
│   │
│   └── models/
│       ├── departments/
│       ├── designations/
│       ├── locations/
│       └── users/
│
├── lib/
│
├── middlewares/
│   ├── auth.middleware.js
│   ├── admin.middleware.js
│   ├── error.middleware.js
│   └── validation.middleware.js
│
├── public/
│
├── routes/
│   ├── users/
│   ├── admin/
│   └── index.js
│
├── services/
│   └── email.service.js
│
├── templates/
│   └── emails/
│
├── utils/
│   ├── ApiError.js
│   ├── asyncHandler.js
│   ├── jwt.utils.js
│   ├── password.utils.js
│   ├── token.utils.js
│   └── string.utils.js
│
├── validations/
│   ├── users/
│   └── admin/
│
├── jobs/
│
├── seeders/
│   └── admin.seed.js
│
├── .env
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
└── server.js
```

---

## Architecture

The application follows a modular layered architecture.

```text
Client
  ↓
Routes
  ↓
Middleware
  ↓
Validation
  ↓
Controller
  ↓
Manager
  ↓
Sequelize Model
  ↓
PostgreSQL
```

### Responsibilities

**Routes**
- Define API endpoints.
- Attach authentication, authorization and validation middleware.

**Middleware**
- Authentication
- Admin authorization
- Request validation
- Centralized error handling

**Controllers**
- Handle HTTP request and response.
- Coordinate application flow.
- Handle transactions where required.

**Managers**
- Perform database operations.
- Keep database access separate from controllers.

**Models**
- Define Sequelize models and database relationships.

**Services**
- Handle external/business services such as email.

**Utilities**
- Reusable helpers for JWT, passwords, token hashing, errors and string normalization.

**Jobs**
- Run scheduled cleanup tasks.

---

## Roles and Permissions

### User

A normal user can:

- Register
- Verify email
- Login
- Logout
- Refresh session
- View own profile
- Update own profile
- View own sessions
- Revoke own sessions
- Change password
- Reset password

### Admin

An admin can perform all required administrative user-management operations:

- Create users
- Create admin accounts
- List users
- Search users
- Filter users
- Paginate users
- View user details
- Update other users
- Activate users
- Deactivate users
- Delete users

An admin cannot:

- Edit their own account through the Admin Update API
- Activate/deactivate their own account through the Admin activation APIs
- Delete their own account

---

# Database Design

The main database tables are:

```text
ums_users
ums_departments
ums_designations
ums_locations
ums_refresh_tokens
ums_user_tokens
```

---

## Users

Table:

```text
ums_users
```

Important fields:

| Field | Description |
|---|---|
| `id` | Primary key |
| `name` | User name |
| `email` | Unique email |
| `password_hash` | bcrypt password hash |
| `role` | `user` or `admin` |
| `department_id` | Department reference |
| `designation_id` | Designation reference |
| `location_id` | Location reference |
| `is_email_verified` | Email verification status |
| `is_active` | Account status |
| `can_edit_profile` | Profile editing permission |
| `last_seen_at` | Last seen timestamp |

---

## Departments

Table:

```text
ums_departments
```

Stores department names.

Example:

```text
Engineering
Human Resources
Finance
```

Department names are normalized before database operations.

---

## Designations

Table:

```text
ums_designations
```

A designation belongs to a department.

Relationship:

```text
Department
    │
    └── hasMany → Designation
```

The combination of:

```text
department_id + name
```

is unique.

---

## Locations

Table:

```text
ums_locations
```

Fields:

```text
id
state
city
```

A unique composite index exists on:

```text
state + city
```

Therefore the same state/city combination is reused instead of creating duplicate logical locations.

---

## Refresh Tokens

Table:

```text
ums_refresh_tokens
```

Important fields:

```text
id
user_id
family_id
token_hash
expires_at
revoked_at
replaced_by_id
device_info
ip_address
created_at
```

The raw refresh token is never stored in the database.

Only its hash is stored.

---

## User Tokens

Table:

```text
ums_user_tokens
```

Used for:

```text
email_verification
password_reset
```

Only hashed temporary tokens are stored.

---

# Database Relationships

```text
Department
    │
    └── hasMany → Designation


User
 ├── belongsTo → Department
 ├── belongsTo → Designation
 ├── belongsTo → Location
 ├── hasMany → RefreshToken
 └── hasMany → UserToken
```

Related token records are configured with cascade behavior for user deletion.

---

# Authentication and Authorization

The application uses JWT-based authentication.

Two tokens are used:

- Access Token
- Refresh Token

### Access Token

- Short-lived
- Used for protected API requests
- Lifetime: 15 minutes

### Refresh Token

- Long-lived
- Used to generate a new access token
- Lifetime: 7 days
- Stored as an HTTP-only cookie
- Hashed before database storage

### Authentication Cookies

```text
accessToken
refreshToken
```

Cookies are configured as HTTP-only and are secure in production.

---

## Authentication Flow

```text
Login
  ↓
Validate credentials
  ↓
Check email verification
  ↓
Check account status
  ↓
Generate access token
  ↓
Generate refresh token
  ↓
Hash refresh token
  ↓
Store refresh token in DB
  ↓
Set HTTP-only cookies
```

---

# Refresh Token Rotation

Refresh Token Rotation is implemented to reduce the risk of reuse of old refresh tokens.

Example:

```text
RT1 → RT2 → RT3
```

When RT1 is refreshed:

```text
RT1
revoked_at = timestamp
replaced_by_id = RT2

RT2
revoked_at = NULL
replaced_by_id = NULL
```

When RT2 is refreshed:

```text
RT2
revoked_at = timestamp
replaced_by_id = RT3

RT3
revoked_at = NULL
replaced_by_id = NULL
```

Only the current refresh token remains active.

---

# Refresh Token Family

Every new login creates a unique `family_id`.

Example:

```text
User
 ├── Laptop Session → Family A
 └── Mobile Session → Family B
```

This allows sessions to be managed independently.

---

# Device and IP Tracking

Each refresh-token record stores:

- `device_info`
- `ip_address`

Device information is taken from the request User-Agent.

This information is returned by the session API.

---

# Password Security

Passwords are never stored in plain text.

The project uses:

```text
bcrypt
```

with a salt round of:

```text
12
```

Flow:

```text
Plain Password
     ↓
bcrypt
     ↓
password_hash
     ↓
Database
```

During login, `bcrypt.compare()` is used.

---

# Email Verification

Normal user registration requires email verification.

Flow:

```text
Register
  ↓
Create User
  ↓
is_email_verified = false
  ↓
Generate verification token
  ↓
Hash token
  ↓
Store hash
  ↓
Send raw token by email
```

Verification tokens expire after 24 hours.

After successful verification:

```text
is_email_verified = true
```

The used verification token is deleted.

---

# Existing Unverified User

If registration is attempted with an existing but unverified email:

```text
Existing User
  ↓
Update registration information
  ↓
Generate new verification token
  ↓
Send verification email again
```

A duplicate user account is not created.

---

# Login Restrictions

Login is rejected when:

- Email/password is incorrect
- Email is not verified
- Account is deactivated

Invalid credentials use a generic authentication error instead of exposing unnecessary account information.

---

# Password Reset

## Forgot Password

Endpoint:

```text
POST /api/v1/auth/users/forgot-password
```

Flow:

```text
Email
 ↓
Find user
 ↓
Generate reset token
 ↓
Hash token
 ↓
Store token
 ↓
Send reset email
```

The response is enumeration-safe:

```text
If the email exists, a password reset link has been sent.
```

Password reset tokens expire after 24 hours.

---

## Reset Password

Endpoint:

```text
POST /api/v1/auth/users/reset-password
```

Flow:

```text
Received Token
 ↓
Hash Token
 ↓
Find Stored Token
 ↓
Check Type
 ↓
Check Expiry
 ↓
Hash New Password
 ↓
Update User
 ↓
Delete Used Token
```

---

# Change Password

Endpoint:

```text
POST /api/v1/auth/users/change-password
```

The authenticated user supplies:

```text
currentPassword
newPassword
```

The system:

```text
Verify current password
        ↓
Hash new password
        ↓
Update password
```

---

# User Profile Management

## Get Current User

```text
GET /api/v1/auth/users/me
```

Returns basic authentication information such as:

```text
userId
role
isLoggedIn
```

---

## Get Profile

```text
GET /api/v1/auth/users/profile
```

Returns:

- Basic user details
- Role
- Email verification status
- Account status
- Profile permission
- Last seen
- Department
- Designation
- Location

---

## Update Profile

```text
PATCH /api/v1/auth/users/profile
```

Users can update:

```text
name
state
city
```

State and city must be supplied together when changing location.

If the location already exists, it is reused.

Otherwise a new location is created.

---

# Text Normalization

Department, designation, state and city values are normalized before find/create/update operations.

Example:

```text
uttarakhand
UTTARAKHAND
uTtArAkHaNd
```

all become:

```text
Uttarakhand
```

Multiple spaces are also reduced to a single space.

This prevents casing-based duplicate logical values.

Example:

```text
"human resources"
"HUMAN RESOURCES"
"Human Resources"
```

all map to:

```text
Human Resources
```

The same normalized value is used when searching for an existing record before creating a new one.

---

# Session Management

## Get Sessions

```text
GET /api/v1/auth/users/sessions
```

Returns active sessions containing:

```text
family_id
device_info
ip_address
created_at
expires_at
```

---

## Revoke Session

```text
DELETE /api/v1/auth/users/sessions/:familyId
```

The session is revoked by setting:

```text
revoked_at
```

The row is not immediately physically deleted.

---

# Logout

```text
POST /api/v1/auth/users/logout
```

Logout:

- Revokes the current refresh-token session
- Clears `accessToken`
- Clears `refreshToken`

If the refresh token is already invalid, cookies are still cleared.

---

# Admin Module

Admin APIs are separated from User APIs.

Admin routes use:

```text
authMiddleware
    ↓
adminMiddleware
    ↓
Admin Controller
```

The first middleware verifies authentication.

The second verifies:

```text
req.user.role === "admin"
```

---

# First Admin

The first admin is created using:

```text
seeders/admin.seed.js
```

The seed uses:

```text
ADMIN_NAME
ADMIN_EMAIL
ADMIN_PASSWORD
```

The seeded admin is:

```text
role = admin
is_email_verified = true
is_active = true
```

---

# Admin Create User

```text
POST /api/v1/admin/users
```

Admin can create:

- User accounts
- Admin accounts

Request fields:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Password123",
  "role": "user",
  "state": "Uttarakhand",
  "city": "Dehradun",
  "department": "Engineering",
  "designation": "Backend Developer"
}
```

Admin-created accounts are immediately email verified.

---

# Admin List Users

```text
GET /api/v1/admin/users
```

Supported query parameters:

```text
search
state
city
department
designation
page
limit
```

Example:

```text
GET /api/v1/admin/users?search=john&department=Engineering&state=Uttarakhand&page=1&limit=10
```

Search is supported on:

```text
name
email
```

Pagination is implemented using:

```text
page
limit
offset
```

---

# Admin Get User Details

```text
GET /api/v1/admin/users/:id
```

Returns user details along with:

- Department
- Designation
- Location
- Account status
- Email verification status
- Profile permission
- Last seen

---

# Admin Update User

```text
PATCH /api/v1/admin/users/:id
```

Admin can update:

```text
name
email
password
role
department
designation
state
city
```

Related department/designation/location records are found or created as required.

The operation uses a database transaction.

An admin cannot update their own account through this endpoint.

---

# Admin Deactivate User

```text
PATCH /api/v1/admin/users/:id/deactivate
```

The API:

```text
is_active = false
```

and revokes all active refresh-token sessions for that user.

An admin cannot deactivate themselves.

---

# Admin Activate User

```text
PATCH /api/v1/admin/users/:id/activate
```

The API changes:

```text
is_active = true
```

An admin cannot activate their own account through this endpoint.

---

# Admin Delete User

```text
DELETE /api/v1/admin/users/:id
```

An admin cannot delete themselves.

Deleting a user also removes related records through configured cascade relationships.

---

# Master Data Fetch APIs

Standalone Master Data CRUD is outside the assignment scope.

However, read-only APIs are available for frontend dropdowns and filtering.

## Departments

```text
GET /api/v1/admin/departments
```

Returns all departments.

---

## Designations

```text
GET /api/v1/admin/designations?departmentId=1
```

Returns designations belonging to the selected department.

---

## States

```text
GET /api/v1/admin/states
```

Returns unique states.

---

## Cities

```text
GET /api/v1/admin/cities?state=Uttarakhand
```

Returns cities belonging to the selected state.

State input is normalized before querying so different casing can still resolve the same state.

---

# Transactions

Transactions are used when multiple related database operations must succeed together.

Example:

```text
BEGIN
  ↓
Find/Create Department
  ↓
Find/Create Designation
  ↓
Find/Create Location
  ↓
Create/Update User
  ↓
COMMIT
```

If an operation fails:

```text
ROLLBACK
```

This prevents partially completed multi-table operations.

---

# Centralized Error Handling

The application uses:

```text
utils/ApiError.js
utils/asyncHandler.js
middlewares/error.middleware.js
```

Example:

```js
throw new ApiError(404, "User not found");
```

The centralized middleware returns:

```json
{
  "success": false,
  "message": "User not found",
  "errors": []
}
```

---

# Request Validation

`express-validator` is used for validating request data.

Examples:

- Valid email format
- Required fields
- Minimum password length
- Valid role
- State/city requirements
- Department/designation requirements

Validation is performed before controller execution.

---

# Scheduled Cleanup Jobs

The project uses `node-cron`.

Cleanup runs hourly:

```text
0 * * * *
```

The following cleanup jobs run:

### Unverified Users

Removes users that remain unverified beyond the allowed period.

### Expired Refresh Tokens

Deletes refresh-token records where:

```text
expires_at < current time
```

### Expired Password Reset Tokens

Deletes password-reset tokens where:

```text
expires_at < current time
```

---

# Email Service

Email functionality is centralized in:

```text
services/email.service.js
```

The service uses:

```text
Nodemailer + Google OAuth2
```

Supported email workflows:

```text
Verification Email
Password Reset Email
Generic Email
```

Email templates are maintained separately under:

```text
templates/emails/
```

---

# Security

The application implements the following security measures:

### Password Protection

- bcrypt hashing
- Passwords are never stored in plain text

### Token Protection

- Temporary tokens are hashed
- Refresh tokens are hashed
- Refresh Token Rotation is implemented

### Authentication

- Short-lived access tokens
- Refresh tokens
- HTTP-only cookies

### Authorization

- Authentication middleware
- Admin role middleware

### Account Security

- Email verification
- Account activation/deactivation
- Session revocation

### Information Disclosure

- Generic invalid credential response
- Enumeration-safe forgot-password response

---

# API Documentation

## Authentication APIs

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/v1/auth/users/register` | Register user |
| POST | `/api/v1/auth/users/login` | Login |
| POST | `/api/v1/auth/users/verify-email` | Verify email |
| POST | `/api/v1/auth/users/refresh` | Refresh tokens |
| POST | `/api/v1/auth/users/logout` | Logout |
| POST | `/api/v1/auth/users/forgot-password` | Request password reset |
| POST | `/api/v1/auth/users/reset-password` | Reset password |
| POST | `/api/v1/auth/users/change-password` | Change password |

---

## User APIs

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/auth/users/me` | Get current user |
| GET | `/api/v1/auth/users/profile` | Get own profile |
| PATCH | `/api/v1/auth/users/profile` | Update own profile |
| GET | `/api/v1/auth/users/sessions` | Get active sessions |
| DELETE | `/api/v1/auth/users/sessions/:familyId` | Revoke session |

---

## Admin APIs

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/v1/admin/users` | Create user/admin |
| GET | `/api/v1/admin/users` | List/search/filter users |
| GET | `/api/v1/admin/users/:id` | Get user details |
| PATCH | `/api/v1/admin/users/:id` | Update user |
| PATCH | `/api/v1/admin/users/:id/deactivate` | Deactivate user |
| PATCH | `/api/v1/admin/users/:id/activate` | Activate user |
| DELETE | `/api/v1/admin/users/:id` | Delete user |

---

## Master Data GET APIs

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/admin/departments` | Get departments |
| GET | `/api/v1/admin/designations?departmentId=1` | Get department designations |
| GET | `/api/v1/admin/states` | Get states |
| GET | `/api/v1/admin/cities?state=Uttarakhand` | Get cities |

---

# Setup and Installation

## 1. Clone Repository

```bash
git clone <repository-url>
cd <project-folder>
```

## 2. Install Dependencies

```bash
npm install
```

## 3. Configure Environment

Create:

```text
.env
```

and add the required configuration.

## 4. Start the Server

Development:

```bash
npm run dev
```

Production/start command depends on the scripts configured in `package.json`.

---

# Environment Variables

Create `.env` using the following structure:

```env
PORT=5000

DATABASE_URL=your_database_url

ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret

ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

FRONTEND_URL=http://localhost:3000

GMAIL_USER=your_gmail_address
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REFRESH_TOKEN=your_google_refresh_token

ADMIN_NAME=Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_admin_password

NODE_ENV=development
```

> Never commit `.env` to Git. Use `.env.example` for sharing the required variable names.

---

# Admin Seeder

The first admin can be created using the seed script:

```bash
npm run seed:admin
```

The seed uses:

```env
ADMIN_NAME=
ADMIN_EMAIL=
ADMIN_PASSWORD=
```

After successful seeding, the admin can log in and access protected Admin APIs.

---

# API Testing

Recommended Admin testing flow:

```text
1. Run admin seed
2. Login as admin
3. Create user
4. List users
5. Search users
6. Filter users
7. Test pagination
8. Get user details
9. Update user
10. Deactivate user
11. Verify login is blocked
12. Activate user
13. Verify login works
14. Delete user
15. Verify deleted user returns 404
```

Recommended User testing flow:

```text
1. Register
2. Verify email
3. Login
4. Get current user
5. Get profile
6. Update profile
7. Get sessions
8. Revoke session
9. Refresh token
10. Change password
11. Forgot password
12. Reset password
13. Logout
```

---

# Error Response Format

Successful response:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

Error response:

```json
{
  "success": false,
  "message": "Something went wrong",
  "errors": []
}
```

Common status codes:

| Code | Meaning |
|---|---|
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 500 | Internal Server Error |

---

# Project Scope

## Included

- Authentication
- Authorization
- User registration
- Email verification
- Login
- Access tokens
- Refresh tokens
- Refresh token rotation
- Refresh token family tracking
- Logout
- Password reset
- Change password
- User profile
- Session management
- Admin user management
- Search
- Filtering
- Pagination
- Account activation
- Account deactivation
- User deletion
- Department/designation/location handling
- Master Data GET APIs
- Centralized error handling
- Request validation
- Email integration
- Scheduled cleanup jobs

## Excluded

Standalone Master Data CRUD APIs are intentionally excluded.

The following are not part of the API scope:

```text
POST/PUT/PATCH/DELETE Department
POST/PUT/PATCH/DELETE Designation
POST/PUT/PATCH/DELETE Location
```

Master data is fetched through read-only APIs and created/reused internally where required by user-management workflows.

---

# System Flow

```text
                         ┌─────────────────┐
                         │     Client      │
                         └────────┬────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │     Routes      │
                         └────────┬────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                    ▼                           ▼
             ┌──────────────┐           ┌──────────────┐
             │ User Module  │           │ Admin Module │
             └──────┬───────┘           └──────┬───────┘
                    │                           │
                    └────────────┬──────────────┘
                                 ▼
                         ┌─────────────────┐
                         │   Controllers   │
                         └────────┬────────┘
                                  ▼
                         ┌─────────────────┐
                         │    Managers     │
                         └────────┬────────┘
                                  ▼
                         ┌─────────────────┐
                         │    Sequelize    │
                         └────────┬────────┘
                                  ▼
                         ┌─────────────────┐
                         │   PostgreSQL    │
                         └─────────────────┘

Email:
Nodemailer → Google OAuth2 → Gmail
```

---

# Conclusion

The User Management System is a modular backend application designed to provide secure user authentication and complete administrative user management.

The project separates:

```text
Routes
Controllers
Managers
Models
Services
Middleware
Utilities
Jobs
```

Security is implemented through:

```text
bcrypt
JWT
HTTP-only cookies
Refresh Token Rotation
Token hashing
Email verification
Role-based authorization
Session revocation
Account activation/deactivation
Centralized error handling
```

The application is structured to remain maintainable and extensible while keeping User and Admin functionality separated.

