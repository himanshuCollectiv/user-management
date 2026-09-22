const { DataTypes, Model } = require("sequelize");
const sequelize = require("../../connection/connection");
const User = require("../users/user.model")

class AuditLog extends Model {}

AuditLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    admin_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    action: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },

    target_user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    details: {
      type: DataTypes.JSONB,
      allowNull: true,
    },

    ip_address: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "AuditLog",
    tableName: "ums_audit_logs",
    timestamps: true,
    updatedAt: false,
    underscored: true,
  }
);

AuditLog.belongsTo(User, {
  foreignKey: "admin_id",
  as: "admin",
});

AuditLog.belongsTo(User, {
  foreignKey: "target_user_id",
  as: "targetUser",
});

module.exports = AuditLog;