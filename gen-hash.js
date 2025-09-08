const bcrypt = require('bcryptjs');

(async () => {
  const hash = await bcrypt.hash('password123', 12);
  console.log('Nuevo hash para password123:', hash);
})();
