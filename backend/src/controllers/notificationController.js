const { getForUser, markRead, markAllRead } = require('../services/notificationService');

const list = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const data = await getForUser(req.user.id, limit, (page - 1) * limit);
    res.json({ success: true, ...data });
  } catch (err) { next(err); }
};

const readOne = async (req, res, next) => {
  try {
    await markRead(req.params.id, req.user.id);
    res.json({ success: true, message: 'Marked as read.' });
  } catch (err) { next(err); }
};

const readAll = async (req, res, next) => {
  try {
    await markAllRead(req.user.id);
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) { next(err); }
};

module.exports = { list, readOne, readAll };
