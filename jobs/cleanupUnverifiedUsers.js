const { Op } = require("sequelize");
const User = require("../data/models/users/user.model");

const cleanupUnverifiedUsers = async () => {
  try {
    const expiryTime = new Date(
      Date.now() - 24 * 60 * 60 * 1000
    );

    const deletedUsers = await User.destroy({
      where: {
        is_email_verified: false,
        updated_at: {
          [Op.lt]: expiryTime,
        },
      },
    });

    console.log(
      `Cleanup completed. Deleted ${deletedUsers} unverified users.`
    );
  } catch (error) {
    console.error(
      "Unverified user cleanup failed:",
      error.message
    );
  }
};

module.exports = cleanupUnverifiedUsers;