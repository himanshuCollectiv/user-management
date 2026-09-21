const User = require("../../models/users/user.model")
const {Op} =require("sequelize")
const Department = require("../../models/departments/department.model");
const Designation = require("../../models/designations/designation.model");
const Location = require("../../models/locations/location.model")


const findDepartmentByName = async (name, transaction) => {
  return await Department.findOne({
    where: { name },
    transaction,
  });
};

const findDesignationByName = async ( name, departmentId, transaction) => {
  return await Designation.findOne({
    where: {
      name,
      department_id: departmentId,
    },
    transaction,
  });
};

const createDepartment = async (name, transaction) => {
  return await Department.create(
    { name },
    { transaction }
  );
};


const createDesignation = async (name, departmentId, transaction) => {
  return await Designation.create(
    {
      name,
      department_id: departmentId,
    },
    { transaction }
  );
};

const findAllUsers = async ({
  page,
  limit,
  search,
  state,
  city,
  department,
  designation,
}) => {
  const offset = (page - 1) * limit;

  const where = {};

  if (search) {
    where[Op.or] = [
      {
        name: {
          [Op.iLike]: `%${search}%`,
        },
      },
      {
        email: {
          [Op.iLike]: `%${search}%`,
        },
      },
    ];
  }

  const departmentWhere = department
    ? {
        name: {
          [Op.iLike]: department,
        },
      }
    : undefined;

  const designationWhere = designation
    ? {
        name: {
          [Op.iLike]: designation,
        },
      }
    : undefined;

  const locationWhere =
    state || city
      ? {
          ...(state && {
            state: {
              [Op.iLike]: state,
            },
          }),
          ...(city && {
            city: {
              [Op.iLike]: city,
            },
          }),
        }
      : undefined;

  return await User.findAndCountAll({
    where,
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
        where: departmentWhere,
      },
      {
        model: Designation,
        as: "designation",
        attributes: ["id", "name"],
        where: designationWhere,
      },
      {
        model: Location,
        as: "location",
        attributes: ["id", "state", "city"],
        where: locationWhere,
      },
    ],
    order: [["id", "DESC"]],
    limit,
    offset,
  });
};

const findUserDetails = async (userId) => {
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

const deleteUser = async (userId) => {
  return await User.destroy({
    where: { id: userId },
  });
};

module.exports = {
  findDepartmentByName,
  findDesignationByName,
  createDepartment,
  createDesignation,
  findAllUsers,
  findUserDetails,
  deleteUser
};