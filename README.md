<div align="center">

  # 🚀 Evaluación Aptitudinal (AptitudeEval)

  **Plataforma Integral de Pruebas Psicotécnicas y Análisis de Perfiles**

  [![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
  [![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

  [🐛 Reportar Bug](https://github.com/sebasloO016/evaluacion_aptitudinal/issues) · [✨ Solicitar Feature](https://github.com/sebasloO016/evaluacion_aptitudinal/issues)

</div>

---

## 📖 Sobre el Proyecto

**Evaluación Aptitudinal** es una solución de software diseñada para optimizar los procesos de selección y evaluación de personal. Permite a las organizaciones administrar pruebas psicotécnicas, gestionar candidatos y analizar resultados en tiempo real a través de un panel de control intuitivo y de alto rendimiento.

Desarrollado con un enfoque minimalista y profesional, garantizando la mejor experiencia de usuario (UX) y escalabilidad a nivel empresarial.

### ✨ Características Principales

| Característica | Descripción |
|---|---|
| 🗂️ **Gestión Centralizada** | Crea, edita y administra pruebas lógicas, verbales y espaciales |
| 📊 **Dashboard Analítico** | Visualización de métricas y estadísticas de los evaluados en tiempo real |
| 👥 **Perfiles de Usuario** | Roles separados para Administradores, Reclutadores y Candidatos |
| 📱 **Diseño Responsivo** | Interfaz fluida adaptada a cualquier dispositivo |
| 📄 **Generación de Reportes** | Exportación de resultados detallados por candidato |
| 🔐 **Autenticación Segura** | JWT + encriptación bcrypt para máxima seguridad |

---

## 🏗️ Arquitectura y Tecnologías

El proyecto fue construido utilizando un stack moderno enfocado en velocidad y mantenibilidad:

```
evaluacion_aptitudinal/
├── 🖥️  Frontend    →  React.js + Tailwind CSS + Axios
├── ⚙️  Backend     →  Node.js + Express.js
├── 🗄️  Base de Datos →  PostgreSQL / MySQL
└── 🔑  Auth        →  JSON Web Tokens (JWT) + bcrypt
```

---

## 🚀 Instalación y Configuración Local

Sigue estos pasos para levantar una copia local del proyecto.

### Prerrequisitos

- [Node.js](https://nodejs.org/) v16 o superior
- NPM o Yarn
- PostgreSQL o MySQL instalado y corriendo

### 1️⃣ Clonar el repositorio

```bash
git clone https://github.com/sebasloO016/evaluacion_aptitudinal.git
cd evaluacion_aptitudinal
```

### 2️⃣ Configurar el Backend

```bash
cd backend
npm install
```

Crea un archivo `.env` en la carpeta `backend` con el siguiente contenido:

```env
PORT=5000
DB_HOST=localhost
DB_USER=tu_usuario_db
DB_PASSWORD=tu_password_db
DB_NAME=evaluacion_db
JWT_SECRET=tu_secreto_seguro_aqui
```

Inicia el servidor de desarrollo:

```bash
npm run dev
```

### 3️⃣ Configurar el Frontend

```bash
cd ../frontend
npm install
npm start
```

> La aplicación estará disponible en `http://localhost:3000`

---

## 📂 Estructura del Proyecto

```
evaluacion_aptitudinal/
├── backend/
│   ├── controllers/      # Lógica de negocio
│   ├── models/           # Esquemas de la base de datos
│   ├── routes/           # Endpoints de la API REST
│   ├── middleware/       # Autenticación JWT y validaciones
│   └── server.js         # Punto de entrada del servidor
├── frontend/
│   ├── src/
│   │   ├── components/   # Componentes reutilizables (UI)
│   │   ├── pages/        # Vistas principales (Dashboard, Login, Test)
│   │   ├── services/     # Llamadas a la API (Axios)
│   │   └── App.js        # Configuración de rutas
│   └── tailwind.config.js
└── codigo sql y estructura/
    └── estructura         # Scripts SQL y modelo de base de datos
```

---

## 🗺️ Roadmap Futuro

- [ ] 📧 Integración de notificaciones automáticas por correo (Nodemailer)
- [ ] 📦 Módulo de exportación masiva de resultados en PDF/Excel
- [ ] 🤖 Implementación de análisis predictivo basado en resultados históricos
- [ ] 🌐 Soporte multilenguaje (i18n)

---

## 👨‍💻 Autores y Propiedad

Un producto desarrollado bajo la iniciativa de **Arise Code**.

| Nombre | Rol | Perfil |
|---|---|---|
| **Edison Sebastian Gavilanes Lopez** | Lead Developer / Creative Technical Solutions | [GitHub](https://github.com/sebasloO016) |

---

## 📜 Licencia

Distribuido bajo la Licencia MIT. Consulta el archivo `LICENSE` para más información.

---

<p align="center">Desarrollado con ❤️ por <strong>Arise Code</strong> para transformar la evaluación de talento.</p>
