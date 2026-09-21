const sequelize = require("../../data/connection/connection");

const userManager = require("../../data/managers/users/user.manager");
const adminManager = require("../../data/managers/admin/admin.manager");

const ApiError = require("../../utils/ApiError");
const asyncHandler = require("../../utils/asyncHandler");
const { hashPassword } = require("../../utils/password.util");

const createUser = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    role,
    state,
    city,
    department,
    designation,
  } = req.body;

  const existingUser = await userManager.findUserByEmail(email);

  if (existingUser) {
    throw new ApiError(409, "User with this email already exists");
  }

  const transaction = await sequelize.transaction();

  try {
    let departmentRecord = await adminManager.findDepartmentByName(
      department,
      transaction
    );

    if (!departmentRecord) {
      departmentRecord = await adminManager.createDepartment(
        department,
        transaction
      );
    }

    let designationRecord = await adminManager.findDesignationByName(
      designation,
      departmentRecord.id,
      transaction
    );

    if (!designationRecord) {
      designationRecord = await adminManager.createDesignation(
        designation,
        departmentRecord.id,
        transaction
      );
    }

    let location = await userManager.findLocation(
      state,
      city,
      transaction
    );

    if (!location) {
      location = await userManager.createLocation(
        state,
        city,
        transaction
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await userManager.createUser(
      {
        name,
        email,
        password_hash: passwordHash,
        role,
        department_id: departmentRecord.id,
        designation_id: designationRecord.id,
        location_id: location.id,
        is_email_verified: true,
        is_active: true,
        can_edit_profile: true,
      },
      transaction
    );

    await transaction.commit();

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        is_email_verified: user.is_email_verified,
        department: departmentRecord.name,
        designation: designationRecord.name,
        location: {
          state: location.state,
          city: location.city,
        },
      },
    });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
});


const getUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const {
    search,
    state,
    city,
    department,
    designation,
  } = req.query;

  if (page < 1 || limit < 1) {
    throw new ApiError(400, "Page and limit must be greater than 0");
  }

  const result = await adminManager.findAllUsers({
    page,
    limit,
    search,
    state,
    city,
    department,
    designation,
  });

  res.status(200).json({
    success: true,
    data: {
      users: result.rows,
      pagination: {
        currentPage: page,
        limit,
        totalUsers: result.count,
        totalPages: Math.ceil(result.count / limit),
      },
    },
  });
});

module.exports = {
  createUser,
  getUsers
};