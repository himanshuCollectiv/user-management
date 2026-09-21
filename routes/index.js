const express = require("express");
const router = express.Router();

router.use("/auth/users", require("./users/user.routes"));

router.use("/admin", require("./admin/admin.routes"));

module.exports = router;