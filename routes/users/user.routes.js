const express = require("express");
const router = express.Router();

const validationMiddleware = require("../../middlewares/validation.middleware");

const { registerValidation, loginValidation, forgotPasswordValidation } = require("../../validations/users/user.validator");

const { register, verifyEmail, login, refreshToken, logout, forgotPassword } = require("../../controllers/users/user.controller");



//routes
router.post("/register",registerValidation,validationMiddleware, register);

router.post("/login",loginValidation,validationMiddleware,login);

router.post("/refresh", refreshToken);

router.get("/verify-email", verifyEmail);

router.post("/logout",logout);

router.post("/forgot-password", forgotPasswordValidation, validationMiddleware, forgotPassword);



module.exports = router;