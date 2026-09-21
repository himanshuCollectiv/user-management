const express = require("express");
const authMiddleware = require("../../middlewares/auth.middleware");
const adminMiddleware = require("../../middlewares/admin.middleware");
const validationMiddleware = require("../../middlewares/validation.middleware");
const { createUser, getUsers, getUserDetails, updateUser, deactivateUser, activateUser, deleteUser } = require("../../controllers/admin/admin.controller");
const { createUserValidation, updateUserValidation } = require("../../validations/admin/admin.validation");

const router = express.Router();

router.use(authMiddleware, adminMiddleware);


router.post("/users", createUserValidation, validationMiddleware, createUser);
router.get("/users", getUsers);
router.get("/users/:id",getUserDetails);
router.patch("/users/:id", updateUserValidation, validationMiddleware, updateUser);
router.patch("/users/:id/deactivate", deactivateUser);
router.patch("/users/:id/activate", activateUser);
router.delete("/users/:id", deleteUser);


module.exports = router;