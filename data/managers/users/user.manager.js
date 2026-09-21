const User = require("../../models/users/user.model");
const Location = require("../../models/locations/location.model");
const Department = require("../../models/departments/department.model")
const Designation = require("../../models/designations/designation.model")
const UserToken = require("../../models/users/user-token.model");
const RefreshToken = require("../../models/users/refresh-token.model");



const findUserByEmail = async (email, transaction) => {
  return await User.findOne({
    where: { email },
    transaction,
  });
};

const createUser = async (userData, transaction) => {
  return await User.create(userData, {
    transaction,
  });
};

const findLocation = async (state, city, transaction) => {
  return await Location.findOne({
    where: { state, city },
    transaction,
  });
};

const createLocation = async (state, city, transaction) => {
  return await Location.create(
    { state, city },
    { transaction }
  );
};

const updateUser = async (userId, userData, transaction) => {
  return await User.update(
    userData,
    {
      where: {
        id: userId,
      },
      transaction,
    }
  );
};

const createUserToken = async (tokenData, transaction) => {
  return await UserToken.create(tokenData, {
    transaction,
  });


};

const findUserToken = async (tokenHash, tokenType, transaction) => {
  return await UserToken.findOne({
    where: {
      token_hash: tokenHash,
      token_type: tokenType,
    },
    transaction,
  });
};

const updateUserEmailVerified = async (userId, transaction) => {
  return await User.update(
    {
      is_email_verified: true,
    },
    {
      where: {
        id: userId,
      },
      transaction,
    }
  );
};

const deleteUserToken = async (tokenId, transaction) => {
  return await UserToken.destroy({
    where: {
      id: tokenId,
    },
    transaction,
  });
};

const createRefreshToken = async (tokenData, transaction) => {
  return await RefreshToken.create(tokenData);
};


const findCurrentRefreshToken = async (userId, familyId) => {
  return await RefreshToken.findOne({
    where: {
      user_id: userId,
      family_id: familyId,
      revoked_at: null,
      replaced_by_id: null,
    },
  });
};

const updateRefreshToken = async (tokenId, data) => {
  return await RefreshToken.update(data, {
    where: {
      id: tokenId,
    },
  });
};


const findUserById = async (userId) => {
  return await User.findByPk(userId);
};


const findUserProfileById = async (userId) => {
  return await User.findByPk(userId, {
    attributes: [
      "id",
      "name",
      "email",
      "role",
      "is_email_verified",
      "is_active",
      "can_edit_profile",
      "last_seen_at",
    ],
    include: [
      {
        model: Department,
        as: "department",
        attributes: ["id", "name"],
      },
      {
        model: Designation,
        as: "designation",
        attributes: ["id", "name"],
      },
      {
        model: Location,
        as: "location",
        attributes: ["id", "state", "city"],
      },
    ],
  });
};


const findUserSessions = async (userId) => {
  return await RefreshToken.findAll({
    where: {
      user_id: userId,
      revoked_at: null,
      replaced_by_id: null,
    },
    attributes: [
      "family_id",
      "device_info",
      "ip_address",
      "created_at",
      "expires_at",
    ],
    order: [["created_at", "DESC"]],
  });
};

const revokeAllUserSessions = async (userId, transaction) => {
  return await RefreshToken.update(
    {
      revoked_at: new Date(),
    },
    {
      where: {
        user_id: userId,
        revoked_at: null,
        replaced_by_id: null,
      },
      transaction,
    }
  );
};

module.exports = {
  findUserByEmail,
  createUser,
  findLocation,
  createLocation,
  updateUser,
  createUserToken,
  findUserToken,
  updateUserEmailVerified,
  deleteUserToken,
  createRefreshToken,
  findCurrentRefreshToken,
  updateRefreshToken,
  findUserById,
  findUserProfileById,
  findUserSessions,
  revokeAllUserSessions
};