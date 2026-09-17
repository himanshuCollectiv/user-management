# User Management System (UMS)

A User Management System built with **Node.js, Express.js, PostgreSQL, and Sequelize**. The project is designed to manage employee accounts, authentication, profiles, and admin-level access.

> **Status:** Initial setup and requirements planning.

## Tech Stack

* Node.js
* Express.js
* PostgreSQL
* Sequelize
* Nodemailer
* JWT
* bcrypt
* Morgan
* PM2

## Planned Features

### Authentication

* User registration with email verification
* Login using email and password
* Short-lived JWT access tokens
* Refresh tokens with rotation
* Logout and refresh-session revocation
* Forgot-password flow using an email reset link
* Password change for logged-in users

### User Roles and Admin Management

The system has two roles:

* `user`
* `admin`

Public registration creates only a normal user. Admins can create either a user or another admin.

Admins will be able to:

* Edit employee information
* Assign department and designation
* Restrict or restore profile-edit access
* Deactivate or reactivate accounts
* Delete other accounts, regardless of role
* Search and filter employees

An admin cannot delete or deactivate their own account.

### Employee Information

During public registration, users provide:

* Name
* Email
* Password
* State
* City

Department and designation are assigned by an admin.

Department, designation, and state-city data will be maintained in separate database tables.

### Employee Search and Filters

Admin-only employee directory with:

* Search by name or email
* Filter by role
* Filter by department and designation
* Filter by state and city
* Paginated results

## Project Structure

```text
ums/
├── controllers/
├── services/
├── managers/
├── models/
├── data/
│   └── connection/
├── routes/
│   ├── users/
│   └── index.js
├── lib/
├── public/
├── templates/
├── server.js
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

The exact placement of files may be adjusted to match the project’s prescribed folder structure.

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/himanshuCollectiv/user-management-.git
cd user-management-
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file using `.env.example` as a reference.

Add the required PostgreSQL, JWT, and email configuration values. **Do not commit `.env` or real credentials.**

### 4. Start the application

The start command will be documented once the server entry point and PM2 scripts are finalized.

## Security Notes

* Passwords will be stored as bcrypt hashes.
* Refresh, email-verification, and password-reset tokens will be stored as hashes.
* Public registration will not accept an admin role.
* Admin authorization and profile-edit restrictions will be enforced by the backend.
* Password changes, account deactivation, and account deletion will revoke the user’s refresh-token sessions.

## Documentation and API Testing

* Project requirements and database design: to be added
* Postman collection: to be added

## Author

**Himanshu Dhoundiyal**
