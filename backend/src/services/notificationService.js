const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

const create = async (userId, title, message, relatedEntityType = null, relatedEntityId = null) => {
  await db.query(
    `INSERT INTO notifications (id, user_id, type, title, message, related_entity_type, related_entity_id)
     VALUES ($1, $2, 'in_app', $3, $4, $5, $6)`,
    [uuidv4(), userId, title, message, relatedEntityType, relatedEntityId]
  );
};

const markRead = async (notificationId, userId) => {
  await db.query(
    `UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2`,
    [notificationId, userId]
  );
};

const markAllRead = async (userId) => {
  await db.query(`UPDATE notifications SET is_read = true WHERE user_id = $1`, [userId]);
};

const getForUser = async (userId, limit = 20, offset = 0) => {
  const { rows } = await db.query(
    `SELECT * FROM notifications WHERE user_id = $1
     ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  const { rows: count } = await db.query(
    `SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false`, [userId]
  );
  return { notifications: rows, unreadCount: parseInt(count[0].count) };
};

module.exports = { create, markRead, markAllRead, getForUser };
