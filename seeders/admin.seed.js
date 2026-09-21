require("dotenv").config();

const sequelize = require("../data/connection/connection");
const User = require("../data/models/users/user.model");
const Location = require("../data/models/locations/location.model");
const { USER_ROLE } = require("../lib/roles");
const { hashPassword } = require("../utils/password.util");

const seedAdmin = async () => {
  const transaction = await sequelize.transaction();

  try {
    await sequelize.authenticate();

    const existingAdmin = await User.findOne({
      where: {
        role: USER_ROLE.ADMIN,
      },
      transaction,
    });

    if (existingAdmin) {
      console.log("Admin already exists.");
      await transaction.rollback();
      return;
    }

    const state = "Uttarakhand";
    const city = "Dehradun";

    let location = await Location.findOne({
      where: {
        state,
        city,
      },
      transaction,
    });

    if (!location) {
      location = await Location.create(
        {
          state,
          city,
        },
        { transaction }
      );
    }

    const passwordHash = await hashPassword(
      process.env.ADMIN_PASSWORD
    );

    await User.create(
      {
        name: process.env.ADMIN_NAME,
        email: process.env.ADMIN_EMAIL,
        password_hash: passwordHash,
        role: USER_ROLE.ADMIN,
        location_id: location.id,
        is_email_verified: true,
        is_active: true,
      },
      { transaction }
    );

    await transaction.commit();

    console.log("Admin seeded successfully.");
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }

    console.error("Admin seed failed:", error.message);
  } finally {
    await sequelize.close();
  }
};

seedAdmin();