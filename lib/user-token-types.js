const USER_TOKEN_TYPES = Object.freeze({
  EMAIL_VERIFICATION: "email_verification",
  PASSWORD_RESET: "password_reset",
});

const USER_TOKEN_TYPE_VALUES = Object.values(USER_TOKEN_TYPES);

module.exports = {
  USER_TOKEN_TYPES,
  USER_TOKEN_TYPE_VALUES,
};