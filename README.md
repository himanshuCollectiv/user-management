# User Management System (UMS)

A secure and modular **User Management System (UMS)** built with **Node.js, Express.js, PostgreSQL (Neon), Sequelize, JWT, and Nodemailer**.

The system provides authentication, email verification, password management, profile management, session management, role-based admin access, user search/filtering, account activation/deactivation, profile-edit permissions, audit logging, presence tracking, read-only master-data APIs, and scheduled cleanup jobs.

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
- [Presence and Heartbeat](#presence-and-heartbeat)
- [Session Management](#session-management)
- [Admin User Management](#admin-user-management)
- [Profile Edit Permission](#profile-edit-permission)
- [Audit Logs](#audit-logs)
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
- [System Flow](#system-flow)

---

## Project Overview

UMS provides REST APIs for managing normal users and administrators.

Supported roles:

- `user`
- `admin`

### Main Features

- User registration
- Email verification
- Login and logout
- JWT authentication
- Short-lived access tokens
- Refresh tokens
- Refresh Token Rotation
- Refresh-token family/session tracking
- HTTP-only cookie based token handling
- Password reset through email
- Change password
- Current-user (`me`) endpoint
- User profile management
- Profile edit permission control
- Session management
- Heartbeat/presence tracking
- Admin user creation
- Admin user listing
- Search and filtering
- Pagination
- Admin user details
- Admin user update
- Account activation/deactivation
- User deletion
- Audit logging
- Department/designation/location handling
- Read-only master-data GET APIs
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
| Sequelize | ORM/database access |
| JWT | Authentication |
| bcrypt | Password hashing |
| Nodemailer | Email sending |
| Google OAuth2 | Gmail authentication |
| express-validator | Request validation |
| cookie-parser | Cookie handling |
| Morgan | HTTP request logging |
| node-cron | Scheduled cleanup |

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

# Architecture

The application follows:

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

### Layer Responsibilities

**Routes**

- Define API endpoints.
- Attach authentication, authorization, and validation middleware.
- Keep User and Admin APIs separated.

**Middleware**

- Authentication
- Admin authorization
- Request validation
- Centralized error handling

**Controllers**

- Handle HTTP requests and responses.
- Coordinate application flow.
- Handle transactions where required.

**Managers**

- Perform database operations.
- Keep database access separate from controllers.
- Contain database-related application logic.

**Models**

- Define Sequelize models.
- Define database relationships.
- Represent PostgreSQL tables.

**Services**

There is no general-purpose business service layer.

The service layer is used for external integration:

```text
services/email.service.js
```

for Nodemailer + Google OAuth2.

**Utilities**

Reusable helpers for JWT, passwords, token hashing, errors, and string normalization.

**Jobs**

Scheduled cleanup operations.

---

# Roles and Permissions

## User

A normal user can:

- Register
- Verify email
- Login
- Logout
- Refresh session
- Get current authentication information
- View own profile
- Update own profile when permitted
- View own sessions
- Revoke own sessions
- Change password
- Reset password
- Send heartbeat/presence information

## Admin

An admin can:

- Create users
- Create admin accounts
- List users
- Search users
- Filter users
- Paginate users
- View user details
- Update other users
- Update profile-edit permission
- Activate users
- Deactivate users
- Delete users
- View audit information

An admin cannot:

- Update their own account through the Admin Update API
- Activate/deactivate their own account through the Admin activation APIs
- Delete their own account

---

# Database Design

Main tables:

```text
ums_users
ums_departments
ums_designations
ums_locations
ums_refresh_tokens
ums_user_tokens
```

An audit-log table is also used for recording relevant administrative/user-management actions.

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
| `can_edit_profile` | Controls whether the user can edit profile information |
| `last_seen_at` | Last heartbeat/last-seen timestamp |

### Presence

`is_online` is **not stored as a database column**.

It is derived from `last_seen_at`.

---

## Departments

Table:

```text
ums_departments
```

Stores normalized department names.

---

## Designations

Table:

```text
ums_designations
```

A designation belongs to a department.

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

This prevents duplicate logical locations.

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

The refresh-token table is also used as the persistent session store.

The raw refresh token is never stored in the database.

Only its hash is stored.

### Token Relationships

```text
RT1 → RT2 → RT3
```

`replaced_by_id` tracks the next token in a rotation chain.

`family_id` groups refresh tokens belonging to the same login/session family.

---

## User Tokens

Table:

```text
ums_user_tokens
```

Used for temporary token workflows:

```text
email_verification
password_reset
```

Only hashed temporary tokens are stored.

---

## Audit Logs

Audit logs record relevant actions performed through the system.

The audit trail is intended to provide traceability for administrative/user-management operations.

Typical audit information includes the actor/user performing the action, the action being performed, the affected resource/user, and request/context information where applicable.

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

Related token records use cascade behavior where configured.

---

# Authentication and Authorization

The application uses JWT-based authentication.

Two tokens are used:

- Access Token
- Refresh Token

## Access Token

- Short-lived
- Used for protected APIs
- Lifetime: `15 minutes`

## Refresh Token

- Long-lived
- Used to obtain a new access token
- Lifetime: `7 days`
- Stored in an HTTP-only cookie
- Hashed before database storage

### Cookies

```text
accessToken
refreshToken
```

Cookies are configured as HTTP-only and secure in production.

---

# Authentication APIs

## Register

```text
POST /api/v1/auth/users/register
```

Registration creates a normal user and initiates email verification.

Flow:

```text
Register
  ↓
Validate input
  ↓
Find/Create Location
  ↓
Hash Password
  ↓
Create or update unverified user
  ↓
Generate verification token
  ↓
Hash token
  ↓
Store token
  ↓
Commit transaction
  ↓
Send verification email
```

If an existing user has the same email but is still unverified, the registration information is updated and a new verification token is generated instead of creating a duplicate account.

---

## Login

```text
POST /api/v1/auth/users/login
```

Login checks:

1. Credentials
2. Email verification
3. Account active status

Successful login:

```text
Credentials
  ↓
Validate user
  ↓
Generate Access Token
  ↓
Generate Refresh Token
  ↓
Create refresh-token family
  ↓
Hash refresh token
  ↓
Store session
  ↓
Set HTTP-only cookies
```

---

## Current User / Me

```text
GET /api/v1/auth/users/me
```

Returns current authentication information such as:

```text
userId
role
isLoggedIn
```

---

## Verify Email

```text
POST /api/v1/auth/users/verify-email
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
Mark Email Verified
  ↓
Delete Used Token
```

---

## Refresh Token

```text
POST /api/v1/auth/users/refresh
```

The refresh flow uses the HTTP-only refresh-token cookie and the session family information.

Flow:

```text
Read refreshToken cookie
  ↓
Verify refresh token
  ↓
Find stored token record
  ↓
Hash supplied token
  ↓
Compare stored hash
  ↓
Validate token/session state
  ↓
Revoke old token
  ↓
Create replacement token
  ↓
Set replacement mapping
  ↓
Generate new Access Token
  ↓
Generate new Refresh Token
  ↓
Set new cookies
```

Refresh Token Rotation prevents an already-used refresh token from remaining the active token.

---

## Logout

```text
POST /api/v1/auth/users/logout
```

Logout:

- Revokes the current refresh-token session.
- Clears `accessToken`.
- Clears `refreshToken`.

Cookies are cleared even when the refresh token is already invalid.

---

# Refresh Token Rotation

Example:

```text
RT1 → RT2 → RT3
```

When `RT1` is refreshed:

```text
RT1
  revoked_at = timestamp
  replaced_by_id = RT2

RT2
  revoked_at = NULL
```

When `RT2` is refreshed:

```text
RT2
  revoked_at = timestamp
  replaced_by_id = RT3

RT3
  revoked_at = NULL
```

Only the current token in a session family remains active.

---

# Refresh Token Family and Sessions

Every login creates a unique `family_id`.

Example:

```text
User
 ├── Laptop Session → Family A
 └── Mobile Session → Family B
```

Each session record can contain:

```text
family_id
device_info
ip_address
created_at
expires_at
revoked_at
```

This allows individual login sessions to be managed independently.

---

# Email Verification

Normal user registration requires email verification.

Verification tokens:

- Are hashed before storage.
- Expire after 24 hours.
- Are deleted after successful verification.

If an existing user is unverified, another registration attempt can update the registration data and issue a fresh verification token.

A separate resend-verification API is not part of the current API surface.

---

# Password Management

## Forgot Password

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

The response is enumeration-safe.

Reset tokens expire after 24 hours.

## Reset Password

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

## Change Password

```text
POST /api/v1/auth/users/change-password
```

Request:

```text
currentPassword
newPassword
```

Flow:

```text
Verify current password
        ↓
Hash new password
        ↓
Update password
```

---

# User Profile Management

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

If a matching location exists, it is reused. Otherwise, a new location is created.

### Profile Permission

Profile editing is controlled by:

```text
can_edit_profile
```

When profile editing is restricted for a user, the user cannot use the profile update functionality that is controlled by this permission.

---

# Presence and Heartbeat

## Heartbeat

```text
PATCH /api/v1/auth/users/heartbeat
```

The heartbeat endpoint updates:

```text
last_seen_at
```

for the authenticated user.

The field is used as the source for presence calculation.

---

## Presence

```text
GET /api/v1/auth/users/presence
```

Presence is derived from the user's `last_seen_at`.

`is_online` is not persisted as a database column.

The application determines online status from the most recent heartbeat/last-seen timestamp.

---

# Session Management

## Get Sessions

```text
GET /api/v1/auth/users/sessions
```

Returns active session information:

```text
family_id
device_info
ip_address
created_at
expires_at
```

## Revoke Session

```text
DELETE /api/v1/auth/users/sessions/:familyId
```

The session is revoked by setting:

```text
revoked_at
```

The record is not immediately physically deleted.

> A separate `logout-all` API is not part of the implemented API scope.

---

# Admin Module

Admin APIs are separate from User APIs.

Admin routes use:

```text
authMiddleware
      ↓
adminMiddleware
      ↓
Admin Controller
```

`authMiddleware` verifies authentication.

`adminMiddleware` verifies:

```text
req.user.role === "admin"
```

---

# First Admin / Seeder

The first admin is created through:

```text
seeders/admin.seed.js
```

Environment variables:

```text
ADMIN_NAME
ADMIN_EMAIL
ADMIN_PASSWORD
```

The seeded account has:

```text
role = admin
is_email_verified = true
is_active = true
```

Run:

```bash
npm run seed:admin
```

---

# Admin User Management

## Create User / Admin

```text
POST /api/v1/admin/users
```

Admin can create:

- User accounts
- Admin accounts

Example:

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

## List / Search / Filter Users

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

Search supports:

```text
name
email
```

Pagination uses:

```text
page
limit
offset
```

---

## Get User Details

```text
GET /api/v1/admin/users/:id
```

Returns:

- User details
- Department
- Designation
- Location
- Account status
- Email verification status
- Profile permission
- Last seen

---

## Update User

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

Related master-data records are found or created as required.

The operation uses a database transaction.

An admin cannot update their own account through this endpoint.

---

## Update Profile Permission

The Admin module also supports controlling whether a user can edit their own profile.

The permission is stored in:

```text
users.can_edit_profile
```

This allows an administrator to restrict or allow profile editing for individual users.

The permission is enforced by the profile-update flow.

---

## Deactivate User

```text
PATCH /api/v1/admin/users/:id/deactivate
```

Changes:

```text
is_active = false
```

and revokes all active refresh-token sessions for that user.

An admin cannot deactivate themselves.

---

## Activate User

```text
PATCH /api/v1/admin/users/:id/activate
```

Changes:

```text
is_active = true
```

An admin cannot activate themselves through this endpoint.

---

## Delete User

```text
DELETE /api/v1/admin/users/:id
```

An admin cannot delete themselves.

Configured cascade relationships remove related records when a user is deleted.

---

# Audit Logs

Audit logging provides traceability for important user-management and administrative actions.

The audit trail can be used to determine:

```text
who performed an action
what action was performed
which user/resource was affected
when the action occurred
```

Audit logs are intended to provide an immutable historical record rather than replacing normal application logs.

Administrative operations such as user management and permission changes can be represented in the audit trail.

---

# Master Data Fetch APIs

Standalone Master Data CRUD is **excluded from the assignment scope**.

Read-only APIs are available for frontend dropdowns and filtering.

## Departments

```text
GET /api/v1/admin/departments
```

## Designations

```text
GET /api/v1/admin/designations?departmentId=1
```

## States

```text
GET /api/v1/admin/states
```

## Cities

```text
GET /api/v1/admin/cities?state=Uttarakhand
```

State, city, department, and designation values are normalized before relevant database operations.

---

# Text Normalization

Examples:

```text
uttarakhand
UTTARAKHAND
uTtArAkHaNd
```

normalize to:

```text
Uttarakhand
```

Multiple spaces are reduced to a single space.

Example:

```text
"human resources"
"HUMAN RESOURCES"
"Human Resources"
```

normalize to:

```text
Human Resources
```

This prevents casing/spacing-based duplicate logical records.

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

On failure:

```text
ROLLBACK
```

This prevents partially completed multi-table operations.

---

# Validation and Error Handling

Request validation uses:

```text
express-validator
```

Validation covers:

- Required fields
- Email format
- Password requirements
- Role values
- State/city requirements
- Department/designation requirements

Validation runs before controller execution.

Centralized error handling uses:

```text
utils/ApiError.js
utils/asyncHandler.js
middlewares/error.middleware.js
```

Example:

```js
throw new ApiError(404, "User not found");
```

Standard error response:

```json
{
  "success": false,
  "message": "User not found",
  "errors": []
}
```

---

# Scheduled Cleanup Jobs

The project uses `node-cron`.

Cleanup runs hourly:

```text
0 * * * *
```

Jobs include:

### Unverified Users

Removes users that remain unverified beyond the allowed period.

### Expired Refresh Tokens

Deletes records where:

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

Technology:

```text
Nodemailer + Google OAuth2
```

Supported workflows:

```text
Verification Email
Password Reset Email
Generic Email
```

Templates are stored under:

```text
templates/emails/
```

---

# Security

## Password Security

- bcrypt hashing
- Salt rounds: `12`
- Plain-text passwords are never stored

## Token Security

- Refresh tokens are hashed
- Temporary tokens are hashed
- Refresh Token Rotation is implemented
- Token expiry is enforced
- Replaced refresh tokens are revoked

## Authentication

- Short-lived access tokens
- Long-lived refresh tokens
- HTTP-only cookies

## Authorization

- Authentication middleware
- Admin role middleware
- Profile-edit permission checks

## Account Security

- Email verification
- Account activation/deactivation
- Session revocation

## Information Disclosure

- Generic invalid-credential response
- Enumeration-safe forgot-password response

## Auditability

- Audit logs for relevant administrative/user-management actions

---

# Complete API Reference

## Authentication APIs

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/v1/auth/users/register` | Register user |
| POST | `/api/v1/auth/users/login` | Login |
| GET | `/api/v1/auth/users/me` | Get current user/auth state |
| POST | `/api/v1/auth/users/verify-email` | Verify email |
| POST | `/api/v1/auth/users/refresh` | Rotate refresh token and issue new tokens |
| POST | `/api/v1/auth/users/logout` | Logout/revoke current session |
| POST | `/api/v1/auth/users/forgot-password` | Request password reset |
| POST | `/api/v1/auth/users/reset-password` | Reset password |
| POST | `/api/v1/auth/users/change-password` | Change password |

## User APIs

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/auth/users/profile` | Get own profile |
| PATCH | `/api/v1/auth/users/profile` | Update own profile |
| PATCH | `/api/v1/auth/users/heartbeat` | Update `last_seen_at` |
| GET | `/api/v1/auth/users/presence` | Get derived online/presence state |
| GET | `/api/v1/auth/users/sessions` | Get active sessions |
| DELETE | `/api/v1/auth/users/sessions/:familyId` | Revoke a session |

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

### Additional Admin Functionality

- Update user profile-edit permission
- Audit administrative/user-management actions

> Exact endpoint names for the newly added profile-permission and audit-log APIs should match the route files in the current codebase. They are intentionally not guessed here.

## Master Data GET APIs

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/admin/departments` | Get departments |
| GET | `/api/v1/admin/designations?departmentId=1` | Get designations |
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

and configure the required variables.

## 4. Start Development Server

```bash
npm run dev
```

Production/start command depends on the scripts configured in `package.json`.

---

# Environment Variables

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

> Never commit `.env` to Git. Use `.env.example` for sharing variable names.

---

# Admin Seeder

Run:

```bash
npm run seed:admin
```

Required variables:

```env
ADMIN_NAME=
ADMIN_EMAIL=
ADMIN_PASSWORD=
```

After successful seeding, the admin can access protected Admin APIs.

---

# API Testing

## Admin Flow

```text
1. Run admin seed
2. Login as admin
3. Create user/admin
4. List users
5. Search users
6. Filter users
7. Test pagination
8. Get user details
9. Update user
10. Update profile-edit permission
11. Deactivate user
12. Verify login is blocked
13. Activate user
14. Verify login works
15. Review audit information
16. Delete user
17. Verify deleted user returns 404
```

## User/Auth Flow

```text
1. Register
2. Verify email
3. Login
4. Get current user (/me)
5. Get profile
6. Update profile
7. Send heartbeat
8. Check presence
9. Get sessions
10. Revoke session
11. Refresh token
12. Change password
13. Forgot password
14. Reset password
15. Logout
```

---

# Response Format

## Success

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

## Error

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
- Current-user (`me`) API
- Access tokens
- Refresh tokens
- Refresh Token Rotation
- Refresh Token Family tracking
- Logout
- Password reset
- Change password
- User profile
- Profile-edit permission
- Session management
- Heartbeat
- Presence
- Admin user management
- Search
- Filtering
- Pagination
- Account activation
- Account deactivation
- User deletion
- Audit logging
- Department/designation/location handling
- Read-only Master Data GET APIs
- Centralized error handling
- Request validation
- Email integration
- Scheduled cleanup jobs

## Excluded

Standalone Master Data CRUD APIs are intentionally excluded.

```text
POST/PUT/PATCH/DELETE Department
POST/PUT/PATCH/DELETE Designation
POST/PUT/PATCH/DELETE Location
```

Master data is fetched through read-only APIs and created/reused internally where required by user-management workflows.

The following are also **not implemented**:

```text
Logout All / Logout All Devices API
```

A dedicated resend-verification API is not part of the current API surface.

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
             ┌──────────────┐            ┌──────────────┐
             │ User Module  │            │ Admin Module │
             └──────┬───────┘            └──────┬───────┘
                    │                           │
                    └─────────────┬─────────────┘
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

The User Management System is a modular backend application for secure authentication and administrative user management.

The architecture separates:

```text
Routes
Controllers
Managers
Models
Middleware
Services
Utilities
Jobs
```

Security and reliability features include:

```text
bcrypt
JWT
HTTP-only cookies
Refresh Token Rotation
Token hashing
Email verification
Role-based authorization
Profile-edit permissions
Session revocation
Presence tracking
Account activation/deactivation
Audit logging
Centralized error handling
```

The User and Admin modules remain separated, database operations are handled through Managers, and external email integration is isolated in the dedicated email service.
