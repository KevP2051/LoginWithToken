# Configuración para Pruebas

## 🎯 Usuarios de Prueba

| Email              | Contraseña  | Rol        | Estado     |
|--------------------|-------------|------------|------------|
| admin@test.com     | admin123    | admin      | ✅ Activo  |
| user@test.com      | user123     | user       | ✅ Activo  |
| moderator@test.com | mod123      | moderator  | ✅ Activo  |
| blocked@test.com   | blocked123  | user       | ❌ Bloqueado |

## 🔗 URLs de Prueba

### Frontend:
- **Login**: http://localhost:3000/login
- **Registro**: http://localhost:3000/register  
- **Dashboard**: http://localhost:3000/dashboard
- **Recuperar Contraseña**: http://localhost:3000/forgot-password
- **Admin Panel**: http://localhost:3000/admin

### API Endpoints:
- **POST** `/api/auth/register` - Registro
- **POST** `/api/auth/login` - Iniciar sesión
- **POST** `/api/auth/logout` - Cerrar sesión
- **POST** `/api/auth/forgot-password` - Solicitar recuperación
- **POST** `/api/auth/reset-password/:token` - Resetear contraseña
- **GET** `/api/users/profile` - Perfil del usuario
- **GET** `/api/admin/users` - Lista de usuarios (solo admin)

## 🧪 Comandos de Prueba

```bash
# Crear datos de prueba
npm run seed

# Resetear todos los datos
npm run reset-data

# Iniciar servidor
npm start

# Desarrollo con recarga automática
npm run dev
```

## 📋 Escenarios de Prueba

### 1. Login Normal
1. Ir a http://localhost:3000/login
2. Email: `user@test.com`
3. Contraseña: `user123`

### 2. Recuperación de Contraseña
1. Ir a http://localhost:3000/forgot-password
2. Email: `user@test.com`
3. Verificar en `data/password_resets.json` el token generado
4. Usar el token para resetear: http://localhost:3000/reset-password?token=TOKEN_GENERADO

### 3. Acceso de Admin
1. Login con `admin@test.com` / `admin123`
2. Ir a http://localhost:3000/admin

### 4. Usuario Bloqueado
1. Intentar login con `blocked@test.com` / `blocked123`
2. Debe mostrar error de usuario bloqueado

## 🔍 Verificar Logs
Los logs se guardan en `data/logs.json` para ver toda la actividad del sistema.
