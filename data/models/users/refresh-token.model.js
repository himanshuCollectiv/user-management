const { DataTypes, Model } = require("sequelize");

const sequelize = require("../../connection/connection");
const User = require("./user.model");

class RefreshToken extends Model {}

RefreshToken.init(
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

    family_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },

    token_hash: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },

    device_info: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    ip_address: {
      type: DataTypes.STRING,
      allowNull: true,
    },    

    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    revoked_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },

    replaced_by_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    sequelize,
    modelName: "RefreshToken",
    tableName: "ums_refresh_tokens",
    timestamps: true,
    underscored: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);




module.exports = RefreshToken;