const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

const log = async (entityType, entityId, action, actorId, oldValue = null, newValue = null, req = null) => {
  await db.query(
    `INSERT INTO audit_log (id, entity_type, entity_id, action, actor_id, old_value, new_value, ip_address, user_agent)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [
      uuidv4(), entityType, entityId, action, actorId,
      oldValue ? JSON.stringify(oldValue) : null,
      newValue ? JSON.stringify(newValue) : null,
      req?.ip || null,
      req?.headers?.['user-agent'] || null,
    ]
  );
};

module.exports = { log };
