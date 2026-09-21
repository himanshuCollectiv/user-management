const { Op } = require("sequelize");

const UserToken = require("../data/models/users/user-token.model");
const { USER_TOKEN_TYPES } = require("../lib/user-token-types");

const cleanupExpiredPasswordResetTokens = async () => {
  try {
    const deletedTokens = await UserToken.destroy({
      where: {
        token_type: USER_TOKEN_TYPES.PASSWORD_RESET,
        expires_at: {
          [Op.lt]: new Date(),
        },
      },
    });

    console.log(
      `Password reset token cleanup completed. Deleted ${deletedTokens} expired tokens.`
    );
  } catch (error) {
    console.error(
      "Password reset token cleanup failed:",
      error.message
    );
  }
};

module.exports = cleanupExpiredPasswordResetTokens;