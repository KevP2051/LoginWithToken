const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Laboratorio #2 Sistemas Distribuidos',
      version: '1.0.0',
      description: "API completa para gestión de usuarios con autenticación JWT y sistema de recuperación de contraseñas por email.\n\n## Autores:\n- Kevin Poveda \n\n## Roles disponibles:\n- admin: Acceso total\n- moderator: Gestión limitada de usuarios\n- user: Acceso básico a perfil propio",
    
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor de desarrollo'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Ingresa tu token JWT en el formato: Bearer {token}'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'ID único del usuario',
              example: 'user-123-456'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email del usuario',
              example: 'usuario@ejemplo.com'
            },
            username: {
              type: 'string',
              description: 'Nombre de usuario único',
              example: 'usuario123'
            },
            firstName: {
              type: 'string',
              description: 'Nombre del usuario',
              example: 'Juan'
            },
            lastName: {
              type: 'string',
              description: 'Apellido del usuario',
              example: 'Pérez'
            },
            role: {
              type: 'string',
              enum: ['user', 'moderator', 'admin'],
              description: 'Rol del usuario',
              example: 'user'
            },
            isActive: {
              type: 'boolean',
              description: 'Estado de la cuenta',
              example: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de creación',
              example: '2025-09-07T19:00:00.000Z'
            },
            lastLogin: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Último inicio de sesión',
              example: '2025-09-07T20:30:00.000Z'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Error en la solicitud'
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string',
                    example: 'email'
                  },
                  message: {
                    type: 'string',
                    example: 'Email es requerido'
                  }
                }
              }
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Operación exitosa'
            }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js'], // Archivos donde están las rutas documentadas
};

const specs = swaggerJSDoc(options);

module.exports = {
  swaggerUi,
  specs
};
