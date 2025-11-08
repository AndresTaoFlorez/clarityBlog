## BACK END
```
proyecto-api/
│
├── src/
│   ├── config/
│   │   └── database.js          # Configuración MySQL
│   │
│   ├── models/
│   │   ├── Usuario.js           # Modelo Usuario (POO)
│   │   └── Nota.js          # Modelo Nota (POO)
│   │
│   ├── controllers/
│   │   ├── authController.js    # Lógica autenticación
│   │   ├── usuarioController.js # Lógica usuarios CRUD
│   │   └── NotaController.js# Lógica Notas CRUD
│   │
│   ├── routes/
│   │   ├── authRoutes.js        # Rutas /api/auth
│   │   ├── usuarioRoutes.js     # Rutas /api/usuarios
│   │   └── NotaRoutes.js    # Rutas /api/Notas
│   │
│   ├── middlewares/
│   │   ├── authMiddleware.js    # Validar JWT
│   │   └── errorHandler.js      # Manejo de errores
│   │
│   └── app.js                   # Configuración Express
│

```


## FRONT END
```
├── frontend/                    # React + Vite
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/
│   │   │   │   ├── Login.jsx
│   │   │   │   └── Register.jsx
│   │   │   ├── Usuarios/
│   │   │   │   └── UsuariosList.jsx
│   │   │   └── Notas/
│   │   │       └── NotasList.jsx
│   │   ├── services/
│   │   │   └── api.js          # Axios config
│   │   └── App.jsx
│   └── package.json
│
├── database/
│   └── schema.sql               # Script de base de datos
│
├── .env                         # Variables de entorno
├── .env.example                 # Ejemplo de variables
├── package.json
└── server.js                    # Punto de entrada
```