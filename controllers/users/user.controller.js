const sequelize = require("../../data/connection/connection");
const userManager = require("../../data/managers/users/user.manager");

const asyncHandler = require("../../utils/asyncHandler");
const ApiError = require("../../utils/ApiError");

const {
  hashPassword,
} = require("../../utils/password.util");

const {
  generateToken,
  hashToken,
} = require("../../utils/emailToken.util");

const {
  sendVerificationEmail,
} = require("../../services/email.service");

const USER_ROLE = require("../../lib/roles");

const TOKEN_TYPE = require("../../lib/user-token-types")

const register = asyncHandler(async (req, res) => {
  const { name, email, password, state, city } = req.body;

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
        token_type: TOKEN_TYPE.EMAIL_VERIFICATION,
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

module.exports = {
  register,
  verifyEmail
};