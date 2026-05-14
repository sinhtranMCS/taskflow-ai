const { validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const result = validationResult(req);

  if (result.isEmpty()) {
    return next();
  }

  return res.status(400).json({
    success: false,
    error: 'Validation failed',
    details: result.array().map((item) => ({
      field: item.path,
      message: item.msg,
    })),
  });
};

module.exports = validate;
