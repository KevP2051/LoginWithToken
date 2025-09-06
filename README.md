# Login With Token

Sistema de autenticación con JWT, gestión de roles y recuperación de contraseñas.

## Estructura del Proyecto

```
LoginWithToken/
├── src/
│   ├── controllers/      # Controladores de rutas
│   ├── middleware/       # Middleware personalizado
│   ├── models/          # Modelos de datos
│   ├── routes/          # Definición de rutas
│   ├── services/        # Lógica de negocio
│   ├── utils/           # Utilidades generales
│   └── server.js        # Punto de entrada del servidor
├── public/              # Archivos estáticos
│   ├── css/
│   ├── js/
│   └── images/
├── views/               # Plantillas HTML
├── data/                # Archivos de datos (JSON)
├── tests/               # Pruebas
└── docs/                # Documentación
```

## Características

- ✅ Autenticación con JWT
- ✅ Gestión de roles (admin, moderator, user)
- ✅ Recuperación de contraseñas por email
- ✅ Bloqueo de cuenta tras 5 intentos fallidos
- ✅ Logs de seguridad
- ✅ Encriptación de datos sensibles
- ✅ Frontend con Bootstrap

## Instalación

```bash
npm install
npm run dev
```
