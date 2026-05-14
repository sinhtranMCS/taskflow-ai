const DEV_JWT_SECRET = 'taskflow_dev_secret_change_me';

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET is required in production');
  }

  return process.env.JWT_SECRET || DEV_JWT_SECRET;
};

module.exports = { getJwtSecret };
