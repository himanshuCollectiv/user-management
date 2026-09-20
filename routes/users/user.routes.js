const express = require("express");
const router = express.Router();

const validationMiddleware = require("../../middlewares/validation.middleware");

const { registerValidation, loginValidation, forgotPasswordValidation, resetPasswordValidation, changePasswordValidation } = require("../../validations/users/user.validator");

const { register, verifyEmail, login, refreshToken, logout, forgotPassword, resetPassword, changePassword, getMyProfile } = require("../../controllers/users/user.controller");

const authMiddleware = require("../../middlewares/auth.middleware")


//routes
router.post("/register",registerValidation,validationMiddleware, register);

router.post("/login",loginValidation,validationMiddleware,login);

router.post("/refresh", refreshToken);

router.get("/verify-email", verifyEmail);

router.post("/logout",logout);

router.post("/forgot-password", forgotPasswordValidation, validationMiddleware, forgotPassword);

router.post("/reset-password", resetPasswordValidation, validationMiddleware, resetPassword);

router.post("/change-password", authMiddleware, changePasswordValidation, validationMiddleware, changePassword);

router.get("/profile", authMiddleware, getMyProfile);

module.exports = router;