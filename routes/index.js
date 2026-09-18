const express = require("express");
const router = express.Router();

router.use("/auth/users", require("./users/user.routes"));

module.exports = router;