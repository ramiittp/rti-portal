const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { AppError } = require('./errorHandler');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer '))
      return next(new AppError('Authentication required.', 401));

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { rows } = await db.query(
      'SELECT id, full_name, email, role, authority_id, is_active FROM users WHERE id = $1',
      [decoded.id]
    );
    if (!rows[0] || !rows[0].is_active)
      return next(new AppError('User not found or inactive.', 401));

    req.user = rows[0];
    next();
  } catch (err) { next(err); }
};

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role))
    return next(new AppError('You do not have permission for this action.', 403));
  next();
};

function authRequired(req, res, next) {
  // your JWT logic here, for now you can even just allow all:
  // console.log('authRequired stub');
  // next();

  const auth = req.headers.authorization || '';
  const [, token] = auth.split(' ');
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  // TODO: verify JWT properly
  next();
}

module.exports = { authenticate, authorize, authRequired };
