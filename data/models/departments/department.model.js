const { Model, DataTypes } = require("sequelize");
const sequelize = require("../../connection/connection");

const Designation = require("../designations/designation.model");
const User = require("../users/user.model");

class Department extends Model {}

Department.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
  },
  {
    sequelize,
    modelName: "Department",
    tableName: "ums_departments",
    timestamps: true,
    underscored: true,
  }
);

Department.hasMany(Designation, {
  foreignKey: "department_id",
  as: "designations",
});

Designation.belongsTo(Department, {
  foreignKey: "department_id",
  as: "department",
});


Department.hasMany(User, {
  foreignKey: "department_id",
  as: "users",
});

User.belongsTo(Department, {
  foreignKey: "department_id",
  as: "department",
});



module.exports = Department;