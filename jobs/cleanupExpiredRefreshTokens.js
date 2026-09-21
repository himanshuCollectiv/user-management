const { Op } = require("sequelize");
const RefreshToken = require("../data/models/users/refresh-token.model");

const cleanupExpiredRefreshTokens = async () => {
  try {
    const deletedTokens = await RefreshToken.destroy({
      where: {
        expires_at: {
          [Op.lt]: new Date(),
        },
      },
    });

    console.log(
      `Refresh token cleanup completed. Deleted ${deletedTokens} expired tokens.`
    );
  } catch (error) {
    console.error(
      "Refresh token cleanup failed:",
      error.message
    );
  }
};

module.exports = cleanupExpiredRefreshTokens;