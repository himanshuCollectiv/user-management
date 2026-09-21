const Department = require("../../models/departments/department.model");
const Designation = require("../../models/designations/designation.model");

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



module.exports = {
  findDepartmentByName,
  findDesignationByName,
};