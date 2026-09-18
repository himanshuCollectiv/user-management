const express = require("express");
const router = express.Router();

const validationMiddleware = require("../../middlewares/validation.middleware");


const {
  registerValidation,
  loginValidation
} = require("../../validations/users/user.validator");

const {
  register,
  verifyEmail,
  login,
  refreshToken
} = require("../../controllers/users/user.controller");

router.post("/register",registerValidation,validationMiddleware, register);

router.post("/login",loginValidation,validationMiddleware,login);

router.post("/refresh", refreshToken);

router.get("/verify-email", verifyEmail);

module.exports = router;