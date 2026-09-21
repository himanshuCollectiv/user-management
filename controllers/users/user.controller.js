const sequelize = require("../../data/connection/connection");
const userManager = require("../../data/managers/users/user.manager");

const asyncHandler = require("../../utils/asyncHandler");
const ApiError = require("../../utils/ApiError");

const { hashPassword, } = require("../../utils/password.util");

const { generateToken, hashToken } = require("../../utils/token.util");

const { sendVerificationEmail, sendPasswordResetEmail,} = require("../../services/email.service");

const { comparePassword } = require("../../utils/password.util");

const { generateAccessToken, generateRefreshToken, verifyRefreshToken, } = require("../../utils/jwt.utils");

const { USER_ROLE } = require("../../lib/roles");

const { USER_TOKEN_TYPES,} = require("../../lib/user-token-types");






//register controller
const register = asyncHandler(async (req, res) => {
  const { name, email, password, state, city } = req.body;

  console.log("name", name);
  const transaction = await sequelize.transaction();

  try {
    // 1. Check whether email already exists
    const existingUser = await userManager.findUserByEmail(
      email,
      transaction
    );

    // 2. Find existing location or create new location
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

    // 3. Hash password
    const passwordHash = await hashPassword(password);

    let user;

    // 4. Existing user found
    if (existingUser) {
      // Verified user cannot register again
      if (existingUser.is_email_verified) {
        throw new ApiError(
          409,
          "Email is already registered"
        );
      }

      // Existing user is unverified
      // Update with latest registration data
      await userManager.updateUser(
        existingUser.id,
        {
            name,
            password_hash: passwordHash,
            location_id: location.id,
        },
        transaction
      );

      user = existingUser;
    } else {
      // 5. Create new user
      user = await userManager.createUser(
        {
          name,
          email,
          password_hash: passwordHash,
          role: USER_ROLE.USER,
          location_id: location.id,
          is_email_verified: false,
        },
        transaction
      );
    }

    // 6. Generate new verification token
    const verificationToken = generateToken();

    // 7. Hash token before storing it
    const tokenHash = hashToken(verificationToken);

    // 8. Token expiry - 24 hours
    const expiresAt = new Date(
      Date.now() + 24 * 60 * 60 * 1000
    );

    // 9. Save verification token
    await userManager.createUserToken(
      {
        user_id: user.id,
        token_hash: tokenHash,
        token_type: USER_TOKEN_TYPES.EMAIL_VERIFICATION,
        expires_at: expiresAt,
      },
      transaction
    );

    // 10. Commit all database changes
    await transaction.commit();

    // 11. Create verification link
    const verificationLink = `${process.env.BACKEND_URL}/api/v1/auth/users/verify-email?token=${verificationToken}`;

    // 12. Send verification email after commit
    await sendVerificationEmail({
      to: email,
      name,
      verificationLink,
      expiryTime: "24 hours",
    });

    // 13. Send response
    res.status(201).json({
      success: true,
      message:
        "Registration successful. Please verify your email.",
    });
  } catch (error) {
    // Rollback if transaction is still active
    if (!transaction.finished) {
      await transaction.rollback();
    }

    throw error;
  }
});



// verify-email controller
const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.query;

  if (!token) {
    throw new ApiError(400, "Verification token is required");
  }

  const tokenHash = hashToken(token);

  const transaction = await sequelize.transaction();

  try {
    const userToken = await userManager.findUserToken(
      tokenHash,
      USER_TOKEN_TYPES.EMAIL_VERIFICATION,
      transaction
    );

    if (!userToken) {
      throw new ApiError(
        400,
        "Invalid or expired verification token"
      );
    }

    if (new Date() > userToken.expires_at) {
      throw new ApiError(
        400,
        "Verification token has expired"
      );
    }

    await userManager.updateUserEmailVerified(
      userToken.user_id,
      transaction
    );

    await userManager.deleteUserToken(
      userToken.id,
      transaction
    );

    await transaction.commit();

    res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }

    throw error;
  }
});



//login controller
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const deviceInfo = req.headers["user-agent"];
  const ipAddress = req.ip;

  // 1. Find user
  const user = await userManager.findUserByEmail(email);



  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  // 2. Check password
  const isPasswordValid = await comparePassword(
    password,
    user.password_hash
  );


  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  // 3. Check email verification
  if (!user.is_email_verified) {
    throw new ApiError(401, "Invalid email or password");
  }

  // 4. Generate refresh token
  const refreshToken = generateRefreshToken({
    userId: user.id,
  });

  // 5. Hash refresh token
  const refreshTokenHash = hashToken(refreshToken);

  // 6. Create new token family
  const familyId = crypto.randomUUID();

  // 7. Refresh token expiry
  const expiresAt = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000
  );

  // 8. Save refresh token in DB
  const savedRefreshToken = await userManager.createRefreshToken({
    user_id: user.id,
    family_id: familyId,
    token_hash: refreshTokenHash,
    expires_at: expiresAt,
    device_info: deviceInfo,
    ip_address: ipAddress,
  });

  if (!savedRefreshToken) {
    throw new ApiError(500, "Failed to create refresh token");
  }

  // 9. Generate access token
  const accessToken = generateAccessToken({
    userId: user.id,
    role: user.role,
  });

  // 10. Store access token in HttpOnly cookie
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 15 * 60 * 1000,
  });

  // 11. Store refresh token in httpOnly cookie
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  // 12. Send response
  res.status(200).json({
    success: true,
    message: "Login successful",
    data: {
      familyId,
    },
  });
});



//refresh controller
const refreshToken = asyncHandler(async (req, res) => {
  // 1. Get refresh token from cookie
  const refreshToken = req.cookies.refreshToken;

  // 2. Get family ID from request body
  const { familyId } = req.body;



  if (!refreshToken) {
    throw new ApiError(401, "Refresh token is required");
  }

  if (!familyId) {
    throw new ApiError(400, "Family ID is required");
  }

  // 3. Verify refresh token
  let decoded;

 try {
  decoded = verifyRefreshToken(refreshToken);

  console.log("DECODED:", decoded);
} catch (error) {
  console.log("REFRESH JWT ERROR:", error.message);

  throw new ApiError(
    401,
    "Invalid or expired refresh token"
  );
}

  const userId = decoded.userId;

  // 4. Find current refresh token
  const storedToken = await userManager.findCurrentRefreshToken(
    userId,
    familyId
  );

 

  if (!storedToken) {
    throw new ApiError(
      401,
      "Invalid or expired refresh token"
    );
  }

  // 5. Hash incoming refresh token
  const refreshTokenHash = hashToken(refreshToken);

  // 6. Compare with stored hash
  if (refreshTokenHash !== storedToken.token_hash) {
    throw new ApiError(
      401,
      "Invalid or expired refresh token"
    );
  }

  
  // 7. Generate new refresh token
  const newRefreshToken = generateRefreshToken({
    userId,
  });

  // 8. Hash new refresh token
  const newRefreshTokenHash = hashToken(newRefreshToken);

  const newExpiresAt = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000
  );

  // 9. Generate new token ID/family stays same
  const newRefreshTokenRecord = await userManager.createRefreshToken({
    user_id: userId,
    family_id: familyId,
    token_hash: newRefreshTokenHash,
    expires_at: newExpiresAt,
    device_info: storedToken.device_info,
    ip_address: storedToken.ip_address,
  });

  // 10. Revoke old token and link it to new token
  await userManager.updateRefreshToken(
    storedToken.id,
    {
      revoked_at: new Date(),
      replaced_by_id: newRefreshTokenRecord.id,
    }
  );

  // 11. Generate new access token
  const user = await userManager.findUserById(userId);

  if (!user) {
    throw new ApiError(401, "User not found");
  }

  const newAccessToken = generateAccessToken({
    userId: user.id,
    role: user.role,
  });

  // 12. Update access token cookie
  res.cookie("accessToken", newAccessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 15 * 60 * 1000,
  });

  // 13. Update refresh token cookie
  res.cookie("refreshToken", newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  // 14. Response
  res.status(200).json({
    success: true,
    message: "Token refreshed successfully",
    data: {
      familyId,
    },
  });
});



//logout
const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  const { familyId } = req.body;

  if (!refreshToken) {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    return res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  }

  if (!familyId) {
    throw new ApiError(400, "Family ID is required");
  }

  let decoded;

  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (error) {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    return res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  }

  const userId = decoded.userId;

  const storedToken = await userManager.findCurrentRefreshToken(
    userId,
    familyId
  );

  if (storedToken) {
    await userManager.updateRefreshToken(
      storedToken.id,
      {
        revoked_at: new Date(),
      }
    );
  }

  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");

  res.status(200).json({
    success: true,
    message: "Logout successful",
  });
});



//forgot password
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await userManager.findUserByEmail(email);

  // Email exist nahi karti toh bhi same response
  if (!user) {
    return res.status(200).json({
      success: true,
      message: "If the email exists, a password reset link has been sent.",
    });
  }

  // Generate reset token
  const resetToken = generateToken();

  // Hash token before storing
  const tokenHash = hashToken(resetToken);

  // Token expiry - 24 hours
  const expiresAt = new Date(
    Date.now() + 24 * 60 * 60 * 1000
  );

  // Save password reset token
  await userManager.createUserToken({
    user_id: user.id,
    token_hash: tokenHash,
    token_type: USER_TOKEN_TYPES.PASSWORD_RESET,
    expires_at: expiresAt,
  });

  // Create reset link
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  // Send email
  await sendPasswordResetEmail({
    to: user.email,
    name: user.name,
    resetLink,
    expiryTime: "24 hours",
  });

  res.status(200).json({
    success: true,
    message: "If the email exists, a password reset link has been sent.",
  });
});



//reset password 
const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  // 1. Hash the raw reset token
  const tokenHash = hashToken(token);

  // 2. Find password reset token
  const userToken = await userManager.findUserToken(
    tokenHash,
    USER_TOKEN_TYPES.PASSWORD_RESET
  );

  if (!userToken) {
    throw new ApiError(400, "Invalid or expired reset token");
  }

  // 3. Check token expiry
  if (userToken.expires_at < new Date()) {
    throw new ApiError(400, "Invalid or expired reset token");
  }

  // 4. Hash new password
  const passwordHash = await hashPassword(newPassword);

  // 5. Start transaction
  const transaction = await sequelize.transaction();

  try {
    // 6. Update password
    await userManager.updateUser(
      userToken.user_id,
      {
        password_hash: passwordHash,
      },
      transaction
    );

    // 7. Delete used reset token
    await userManager.deleteUserToken(
      userToken.id,
      transaction
    );

    // 8. Commit transaction
    await transaction.commit();
  } catch (error) {
    // 9. Rollback if transaction is still active
    if (!transaction.finished) {
      await transaction.rollback();
    }

    throw error;
  }

  // 10. Response
  res.status(200).json({
    success: true,
    message: "Password reset successful",
  });
});



//change-password
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const userId = req.user.userId;

  // Find logged-in user
  const user = await userManager.findUserById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Check current password
  const isPasswordValid = await comparePassword(
    currentPassword,
    user.password_hash
  );

  if (!isPasswordValid) {
    throw new ApiError(401, "Current password is incorrect");
  }

  // Hash new password
  const passwordHash = await hashPassword(newPassword);

  // Update password
  await userManager.updateUser(userId, {
    password_hash: passwordHash,
  });

  res.status(200).json({
    success: true,
    message: "Password changed successfully",
  });
});



//getUserProfile
const getMyProfile = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  const user = await userManager.findUserProfileById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  res.status(200).json({
    success: true,
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      is_email_verified: user.is_email_verified,
      is_active: user.is_active,
      can_edit_profile: user.can_edit_profile,
      last_seen_at: user.last_seen_at,

      department: user.department,
      designation: user.designation,
      location: user.location,
    },
  });
});



//me
const getCurrentUser = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: "User is logged in",
    data: {
      isLoggedIn: true,
      user: {
        userId: req.user.userId,
        role: req.user.role,
      },
    },
  });
});


//updateMyProfile
const updateMyProfile = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { name, state, city } = req.body;

  const user = await userManager.findUserById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const transaction = await sequelize.transaction();

  try {
    const updateData = {};

    if (name !== undefined) {
      updateData.name = name;
    }

    if (state !== undefined || city !== undefined) {
      if (!state || !city) {
        throw new ApiError(400, "State and city are required together");
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

    if (Object.keys(updateData).length === 0) {
      throw new ApiError(400, "No profile data provided");
    }

    await userManager.updateUser(
      userId,
      updateData,
      transaction
    );

    await transaction.commit();

    const updatedUser = await userManager.findUserById(userId);

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        department_id: updatedUser.department_id,
        designation_id: updatedUser.designation_id,
        location_id: updatedUser.location_id,
      },
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }

    throw error;
  }
});



//get-sessions
const getMySessions = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  const sessions = await userManager.findUserSessions(userId);

  res.status(200).json({
    success: true,
    data: {
      sessions,
    },
  });
});



//revoke-session
const revokeSession = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { familyId } = req.params;

  if (!familyId) {
    throw new ApiError(400, "Family ID is required");
  }

  const session = await userManager.findCurrentRefreshToken(
    userId,
    familyId
  );

  if (!session) {
    throw new ApiError(404, "Session not found");
  }

  await userManager.updateRefreshToken(
    session.id,
    {
      revoked_at: new Date(),
    }
  );

  res.status(200).json({
    success: true,
    message: "Session revoked successfully",
  });
});


module.exports = {
  register,
  verifyEmail,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
  getMyProfile,
  getCurrentUser,
  updateMyProfile,
  getMySessions,
  revokeSession
};