const db = require('../config/database');

// GET /api/master/ministries
const getMinistries = async (req, res, next) => {
  try {
    const { rows } = await db.query(`SELECT * FROM ministries WHERE is_active=true ORDER BY name`);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

// GET /api/master/departments?ministry_id=
const getDepartments = async (req, res, next) => {
  try {
    const { ministry_id } = req.query;
    const query = ministry_id
      ? `SELECT * FROM departments WHERE is_active=true AND ministry_id=$1 ORDER BY name`
      : `SELECT * FROM departments WHERE is_active=true ORDER BY name`;
    const { rows } = await db.query(query, ministry_id ? [ministry_id] : []);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

// GET /api/master/authorities?q=&department_id=
const searchAuthorities = async (req, res, next) => {
  try {
    const { q = '', department_id, state } = req.query;
    let conditions = ['pa.is_active = true'];
    let params = [];
    let i = 1;
    if (q) { conditions.push(`pa.name ILIKE $${i++}`); params.push(`%${q}%`); }
    if (department_id) { conditions.push(`pa.department_id = $${i++}`); params.push(department_id); }
    if (state) { conditions.push(`pa.state = $${i++}`); params.push(state); }

    const { rows } = await db.query(
      `SELECT pa.id, pa.name, pa.city, pa.state, pa.email, pa.cpio_name,
              d.name AS department_name, m.name AS ministry_name
       FROM public_authorities pa
       JOIN departments d ON pa.department_id = d.id
       JOIN ministries m ON d.ministry_id = m.id
       WHERE ${conditions.join(' AND ')}
       ORDER BY pa.name LIMIT 50`,
      params
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

// GET /api/master/templates
const getTemplates = async (req, res, next) => {
  try {
    const { category, lang = 'en' } = req.query;
    let q = `SELECT * FROM rti_templates WHERE is_active=true AND language=$1`;
    const params = [lang];
    if (category) { q += ` AND category=$2`; params.push(category); }
    q += ' ORDER BY usage_count DESC';
    const { rows } = await db.query(q, params);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

// GET /api/master/templates/:id/use  — increments usage count
const useTemplate = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `UPDATE rti_templates SET usage_count = usage_count + 1 WHERE id=$1 RETURNING *`,
      [req.params.id]
    );
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};

module.exports = { getMinistries, getDepartments, searchAuthorities, getTemplates, useTemplate };
