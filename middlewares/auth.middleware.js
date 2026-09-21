const ApiError = require("../utils/ApiError");
const { verifyAccessToken } = require("../utils/jwt.utils");
const userManager = require("../data/managers/users/user.manager");

const authMiddleware = async (req, res, next) => {
  const accessToken = req.cookies.accessToken;

  if (!accessToken) {
    throw new ApiError(401, "Authentication required");
  }

  try {
    const decoded = verifyAccessToken(accessToken);

    const user = await userManager.findUserById(decoded.userId);

    if (!user) {
      throw new ApiError(401, "User not found");
    }

    if (!user.is_active) {
      throw new ApiError(403, "Your account has been deactivated");
    }

    req.user = decoded;

    next();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(401, "Invalid or expired access token");
  }
};

module.exports = authMiddleware;