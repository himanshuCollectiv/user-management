const { body } = require("express-validator");

const createUserValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required"),

  body("email")
    .trim()
    .isEmail()
    .withMessage("Valid email is required"),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),

  body("role")
    .isIn(["user", "admin"])
    .withMessage("Role must be either user or admin"),

  body("state")
    .trim()
    .notEmpty()
    .withMessage("State is required"),

  body("city")
    .trim()
    .notEmpty()
    .withMessage("City is required"),

  body("department")
    .trim()
    .notEmpty()
    .withMessage("Department is required"),

  body("designation")
    .trim()
    .notEmpty()
    .withMessage("Designation is required"),
];

module.exports = {
  createUserValidation,
};