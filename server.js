require("dotenv").config();

const express = require("express");
const cookieParser = require("cookie-parser")
const morgan = require("morgan");
const sequelize = require("./data/connection/connection");

require("./data/models/departments/department.model");
require("./data/models/designations/designation.model");
require("./data/models/locations/location.model");
require("./data/models/users/user.model");
require("./data/models/users/refresh-token.model");
require("./data/models/users/user-token.model");

const routes =require("./routes/index");

const errorMiddleware = require("./middlewares/error.middleware")

require("./jobs/cleanup.job");

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));
app.use("/api/v1", routes);
app.use(errorMiddleware);

// Start server after database connection
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log("PostgreSQL connected successfully");

    await sequelize.sync();

    console.log("Database connected and tables synced");

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  }
}

startServer();