const sequelize = require("../../data/connection/connection");

const userManager = require("../../data/managers/users/user.manager");
const adminManager = require("../../data/managers/admin/admin.manager");

const ApiError = require("../../utils/ApiError");
const asyncHandler = require("../../utils/asyncHandler");
const { hashPassword } = require("../../utils/password.util");
const normalizeText = require("../../utils/string.utils")

//create-user-byAdmin
const createUser = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    role,
  } = req.body;

  let {state,
    city,
    department,
    designation,} = req.body

  state = normalizeText(state);
  city = normalizeText(city);
  department = normalizeText(department);
  designation = normalizeText(designation);

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



//getUser
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



//get-user-detail
const getUserDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await adminManager.findUserDetails(id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  res.status(200).json({
    success: true,
    data: {
      user,
    },
  });
});



//update-user-data
const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    name,
    email,
    password,
    role,
  } = req.body;

  let{ state,
    city,
    department,
    designation,}=req.body

  state = normalizeText(state);
  city = normalizeText(city);
  department = normalizeText(department);
  designation = normalizeText(designation);

  const userId = Number(id);

  if (userId === req.user.userId) {
    throw new ApiError(403, "Admin cannot edit their own account");
  }

  const existingUser = await userManager.findUserById(userId);

  if (!existingUser) {
    throw new ApiError(404, "User not found");
  }

  if (email && email !== existingUser.email) {
    const emailUser = await userManager.findUserByEmail(email);

    if (emailUser && emailUser.id !== userId) {
      throw new ApiError(409, "User with this email already exists");
    }
  }

  const transaction = await sequelize.transaction();

  try {
    const updateData = {};

    if (name !== undefined) {
      updateData.name = name;
    }

    if (email !== undefined) {
      updateData.email = email;
    }

    if (role !== undefined) {
      updateData.role = role;
    }

    if (password !== undefined) {
      updateData.password_hash = await hashPassword(password);
    }

    if (
      state !== undefined ||
      city !== undefined
    ) {
      if (!state || !city) {
        throw new ApiError(
          400,
          "State and city are required together"
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

      updateData.location_id = location.id;
    }

    if (department !== undefined) {
      let departmentRecord =
        await adminManager.findDepartmentByName(
          department,
          transaction
        );

      if (!departmentRecord) {
        departmentRecord =
          await adminManager.createDepartment(
            department,
            transaction
          );
      }

      updateData.department_id = departmentRecord.id;

      if (designation !== undefined) {
        let designationRecord =
          await adminManager.findDesignationByName(
            designation,
            departmentRecord.id,
            transaction
          );

        if (!designationRecord) {
          designationRecord =
            await adminManager.createDesignation(
              designation,
              departmentRecord.id,
              transaction
            );
        }

        updateData.designation_id = designationRecord.id;
      }
    } else if (designation !== undefined) {
      throw new ApiError(
        400,
        "Department is required when updating designation"
      );
    }

    if (Object.keys(updateData).length === 0) {
      throw new ApiError(400, "No data provided for update");
    }

    await userManager.updateUser(
      userId,
      updateData,
      transaction
    );

    await transaction.commit();

    const updatedUser =
      await userManager.findUserProfileById(userId);

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
});



//deactivate-user
const deactivateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = Number(id);

  if (userId === req.user.userId) {
    throw new ApiError(403, "Admin cannot deactivate their own account");
  }

  const user = await userManager.findUserById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const transaction = await sequelize.transaction();

  try {
    await userManager.updateUser(
      userId,
      {
        is_active: false,
      },
      transaction
    );

    await userManager.revokeAllUserSessions(
      userId,
      transaction
    );

    await transaction.commit();

    res.status(200).json({
      success: true,
      message: "User deactivated successfully",
    });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
});



//activate-user
const activateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = Number(id);

  if (userId === req.user.userId) {
    throw new ApiError(403, "Admin cannot activate their own account");
  }

  const user = await userManager.findUserById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  await userManager.updateUser(userId, {
    is_active: true,
  });

  res.status(200).json({
    success: true,
    message: "User activated successfully",
  });
});



//delete-user
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = Number(id);

  if (userId === req.user.userId) {
    throw new ApiError(403, "Admin cannot delete their own account");
  }

  const user = await userManager.findUserById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  await adminManager.deleteUser(userId);

  res.status(200).json({
    success: true,
    message: "User deleted successfully",
  });
});



//findAllDepartment
const getDepartments = asyncHandler(async (req, res) => {
  const departments = await adminManager.findAllDepartments();

  res.status(200).json({
    success: true,
    data: {
      departments,
    },
  });
});



//findAllDesignations
const getDesignations = asyncHandler(async (req, res) => {
  const { departmentId } = req.query;

  if (!departmentId) {
    throw new ApiError(400, "Department ID is required");
  }

  const designations = await adminManager.findAllDesignations(departmentId);

  res.status(200).json({
    success: true,
    data: {
      designations,
    },
  });
});



//getState
const getStates = asyncHandler(async (req, res) => {
  const states = await adminManager.findAllStates();

  res.status(200).json({
    success: true,
    data: {
      states: states.map((item) => item.state),
    },
  });
});



//getCity
const getCities = asyncHandler(async (req, res) => {
  const { state } = req.query;

  if (!state) {
    throw new ApiError(400, "State is required");
  }

  const cities = await adminManager.findCitiesByState(state);

  res.status(200).json({
    success: true,
    data: {
      cities,
    },
  });
});



module.exports = {
  createUser,
  getUsers,
  getUserDetails,
  updateUser,
  deactivateUser,
  activateUser,
  deleteUser,
  getDepartments,
  getDesignations,
  getStates,
  getCities
};