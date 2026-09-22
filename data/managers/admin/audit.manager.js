const AuditLog = require("../../models/audit-logs/audit-log.model");
const User = require("../../models/users/user.model")

const createAuditLog = async ({
  adminId,
  action,
  targetUserId,
  details,
  ipAddress,
  transaction,
}) => {
  return await AuditLog.create(
    {
      admin_id: adminId,
      action,
      target_user_id: targetUserId,
      details,
      ip_address: ipAddress,
    },
    { transaction }
  );
};

const findAuditLogs = async ({ page, limit }) => {
  const offset = (page - 1) * limit;

  return await AuditLog.findAndCountAll({
    include: [
      {
        model: User,
        as: "admin",
        attributes: ["id", "name", "email"],
      },
      {
        model: User,
        as: "targetUser",
        attributes: ["id", "name", "email"],
      },
    ],
    order: [["created_at", "DESC"]],
    limit,
    offset,
  });
};

module.exports = {
  createAuditLog,
  findAuditLogs
};