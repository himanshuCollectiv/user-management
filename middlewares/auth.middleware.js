const ApiError = require("../utils/ApiError");
const { verifyAccessToken } = require("../utils/jwt.utils");

const authMiddleware = (req, res, next) => {
  const accessToken = req.cookies.accessToken;

  if (!accessToken) {
    throw new ApiError(401, "Authentication required");
  }

  try {
    const decoded = verifyAccessToken(accessToken);

    req.user = decoded;

    next();
  } catch (error) {
    throw new ApiError(401, "Invalid or expired access token");
  }
};

module.exports = authMiddleware;