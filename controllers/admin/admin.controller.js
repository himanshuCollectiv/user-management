const sequelize = require("../../data/connection/connection");

const userManager = require("../../data/managers/users/user.manager");
const adminManager = require("../../data/managers/admin/admin.manager");
const auditManager = require("../../data/managers/admin/audit.manager");

const ApiError = require("../../utils/ApiError");
const asyncHandler = require("../../utils/asyncHandler");
const { hashPassword } = require("../../utils/password.util");
const { normalizeText } = require("../../utils/string.utils");
const { addChange } = require("../../utils/audit.utils");

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

  await auditManager.createAuditLog({
   adminId: req.user.userId,
    action: "CREATE_USER",
    targetUserId: newUser.id,
    details: {
      message: "User account created",
      role: newUser.role,
      email: newUser.email,
    },
    ipAddress: req.ip,
    transaction,
  });    

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

  let {
    state,
    city,
    department,
    designation,
  } = req.body;

  state = state !== undefined ? normalizeText(state) : undefined;
  city = city !== undefined ? normalizeText(city) : undefined;
  department =
    department !== undefined
      ? normalizeText(department)
      : undefined;
  designation =
    designation !== undefined
      ? normalizeText(designation)
      : undefined;

  const userId = Number(id);

  if (userId === req.user.userId) {
    throw new ApiError(
      403,
      "Admin cannot edit their own account"
    );
  }

  const existingUser =
    await userManager.findUserById(userId);

  if (!existingUser) {
    throw new ApiError(404, "User not found");
  }

  if (email && email !== existingUser.email) {
    const emailUser =
      await userManager.findUserByEmail(email);

    if (emailUser && emailUser.id !== userId) {
      throw new ApiError(
        409,
        "User with this email already exists"
      );
    }
  }

  const transaction = await sequelize.transaction();

  try {
    const updateData = {};
    const changes = {};

    // Basic fields
    addChange(
      changes,
      "name",
      existingUser.name,
      name
    );

    addChange(
      changes,
      "email",
      existingUser.email,
      email
    );

    addChange(
      changes,
      "role",
      existingUser.role,
      role
    );

    if (name !== undefined) {
      updateData.name = name;
    }

    if (email !== undefined) {
      updateData.email = email;
    }

    if (role !== undefined) {
      updateData.role = role;
    }

    // Password
    if (password !== undefined) {
      updateData.password_hash =
        await hashPassword(password);

      changes.password = {
        message: "Password changed",
      };
    }

    // Location
    if (state !== undefined || city !== undefined) {
      const currentLocation =
        await adminManager.findLocationById(
          existingUser.location_id,
          transaction
        );

      const newState =
        state !== undefined
          ? state
          : currentLocation.state;

      const newCity =
        city !== undefined
          ? city
          : currentLocation.city;

      let location =
        await userManager.findLocation(
          newState,
          newCity,
          transaction
        );

      if (!location) {
        location =
          await userManager.createLocation(
            newState,
            newCity,
            transaction
          );
      }

      updateData.location_id = location.id;

      if (location.id !== existingUser.location_id) {
        changes.location = {
          from: {
            state: currentLocation.state,
            city: currentLocation.city,
          },
          to: {
            state: newState,
            city: newCity,
          },
        };
      }
    }

    // Department
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

      updateData.department_id =
        departmentRecord.id;

      if (
        departmentRecord.id !==
        existingUser.department_id
      ) {
        changes.department = {
          to: department,
        };
      }

      // Designation
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

        updateData.designation_id =
          designationRecord.id;

        if (
          designationRecord.id !==
          existingUser.designation_id
        ) {
          changes.designation = {
            to: designation,
          };
        }
      }
    } else if (designation !== undefined) {
      throw new ApiError(
        400,
        "Department is required when updating designation"
      );
    }

    // Nothing to update
    if (Object.keys(updateData).length === 0) {
      throw new ApiError(
        400,
        "No data provided for update"
      );
    }

    // Update user
    await userManager.updateUser(
      userId,
      updateData,
      transaction
    );

    // Audit log
    await auditManager.createAuditLog({
      adminId: req.user.userId,
      action: "UPDATE_USER",
      targetUserId: userId,
      details: {
        message: "User account updated",
        changes,
      },
      ipAddress: req.ip,
      transaction,
    });

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

  await auditManager.createAuditLog({
    adminId: req.user.userId,
    action: "DEACTIVATE_USER",
    targetUserId: userId,
    details: {
      message: "User account deactivated",
    },
    ipAddress: req.ip,
    transaction,
  }); 

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
const activateUser = async (req, res) => {
  const userId = Number(req.params.id);

  if (req.user.userId === userId) {
    throw new ApiError(403, "You cannot activate yourself");
  }

  const user = await userManager.findUserById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const transaction = await sequelize.transaction();

  try {
    await userManager.updateUser(
      userId,
      { is_active: true },
      transaction
    );

    await auditManager.createAuditLog({
      adminId: req.user.userId,
      action: "ACTIVATE_USER",
      targetUserId: userId,
      details: {
        message: "User account activated",
      },
      ipAddress: req.ip,
      transaction,
    });

    await transaction.commit();

    res.status(200).json({
      success: true,
      message: "User activated successfully",
    });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};


//delete-user
const deleteUser = async (req, res) => {
  const userId = Number(req.params.id);

  if (req.user.userId === userId) {
    throw new ApiError(403, "You cannot delete yourself");
  }

  const user = await userManager.findUserById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const transaction = await sequelize.transaction();

  try {
    await auditManager.createAuditLog({
      adminId: req.user.userId,
      action: "DELETE_USER",
      targetUserId: userId,
      details: {
        message: "User account deleted",
        name: user.name,
        email: user.email,
        role: user.role,
      },
      ipAddress: req.ip,
      transaction,
    });

    await adminManager.deleteUser(userId, transaction);

    await transaction.commit();

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};



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


//userEditProfilePermisson
const updateProfilePermission = asyncHandler(async (req, res) => {
  const userId = Number(req.params.id);
  const { canEditProfile } = req.body;
  console.log(canEditProfile, typeof canEditProfile);
  if (userId === req.user.userId) {
    throw new ApiError(
      403,
      "Admin cannot change their own profile permission"
    );
  }

  const existingUser = await userManager.findUserById(userId);

  if (!existingUser) {
    throw new ApiError(404, "User not found");
  }

  if (existingUser.role === "admin") {
    throw new ApiError(
      403,
      "Profile permission cannot be changed for an admin"
    );
  }

  const transaction = await sequelize.transaction();

  try {
    await userManager.updateUser(
      userId,
      {
        can_edit_profile: canEditProfile,
      },
      transaction
    );

    await auditManager.createAuditLog({
      adminId: req.user.userId,
      action: canEditProfile
        ? "ALLOW_PROFILE_EDIT"
        : "DENY_PROFILE_EDIT",
      targetUserId: userId,
      details: {
        message: canEditProfile
          ? "Profile editing permission allowed"
          : "Profile editing permission denied",
      },
      ipAddress: req.ip,
      transaction,
    });

    await transaction.commit();

    res.status(200).json({
      success: true,
      message: canEditProfile
        ? "Profile editing permission allowed"
        : "Profile editing permission denied",
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }

    throw error;
  }
});


//audit-logs
const getAuditLogs = async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(
    Math.max(Number(req.query.limit) || 10, 1),
    100
  );

  const result = await auditManager.findAuditLogs({
    page,
    limit,
  });

  res.status(200).json({
    success: true,
    data: {
      logs: result.rows,
      pagination: {
        page,
        limit,
        total: result.count,
        totalPages: Math.ceil(result.count / limit),
      },
    },
  });
};




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
  getCities,
  getAuditLogs,
  updateProfilePermission
};