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
│   │   └── Producto.js          # Modelo Producto (POO)
│   │
│   ├── controllers/
│   │   ├── authController.js    # Lógica autenticación
│   │   ├── usuarioController.js # Lógica usuarios CRUD
│   │   └── productoController.js# Lógica productos CRUD
│   │
│   ├── routes/
│   │   ├── authRoutes.js        # Rutas /api/auth
│   │   ├── usuarioRoutes.js     # Rutas /api/usuarios
│   │   └── productoRoutes.js    # Rutas /api/productos
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
│   │   │   └── Productos/
│   │   │       └── ProductosList.jsx
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