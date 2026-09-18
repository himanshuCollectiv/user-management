const { DataTypes, Model } = require("sequelize");

const sequelize = require("../../connection/connection");

const {USER_TOKEN_TYPES,USER_TOKEN_TYPE_VALUES} =require("../../../lib/user-token-types");
const User = require("./user.model");

class UserToken extends Model {}

UserToken.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },

    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    token_type: {
      type: DataTypes.ENUM(...USER_TOKEN_TYPE_VALUES),
      allowNull: false,
    },

    token_hash: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },

    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    used_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    sequelize,
    modelName: "UserToken",
    tableName: "ums_user_tokens",
    timestamps: true,
    underscored: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);




module.exports = UserToken;