const express = require('express');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// TODO: Configurar middleware
// TODO: Configurar rutas
// TODO: Configurar archivos estáticos
// TODO: Configurar manejo de errores

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = app;
