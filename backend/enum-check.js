const db = require('./src/config/database');
async function test() {
  try {
    const { rows } = await db.query(
      `SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE typname = 'request_status';`
    );
    console.log("ENUM VALUES:", rows.map(r => r.enumlabel).join(', '));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
test();
