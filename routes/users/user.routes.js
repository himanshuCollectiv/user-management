const express = require("express");
const router = express.Router();

const validationMiddleware = require("../../middlewares/validation.middleware");

const {
  registerValidation,
} = require("../../validations/users/user.validator");

const {
  register,
  verifyEmail,
} = require("../../controllers/users/user.controller");

router.post(
  "/register",
  registerValidation,
  validationMiddleware,
  register
);

router.get("/verify-email", verifyEmail);

module.exports = router;