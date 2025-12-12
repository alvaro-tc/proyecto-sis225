Proyecto SIS225 – Clínica Veterinaria

Protoripo de una cliniva veterinaria desarrollada para la gestión integral de una clínica veterinaria, como parte del trabajo académico de la materia SIS225.

Basado en una arquitectura moderna con React (frontend) y Django REST Framework (backend), este proyecto implementa módulos completos para la administración de usuarios, mascotas, historiales clínicos, citas y personal médico.

<br/>
Características principales:

- Frontend en React con componentes reutilizables y diseño moderno basado en Material UI.

- Backend en Django + DRF, estructurado en módulos para usuarios, clínica y autenticación.

- Autenticación JWT: login, registro, persistencia de sesión y logout.


Administración de mascotas

- Historial clínico

- Gestión de citas

- Gestión de veterinarios y recepcionistas

- Arquitectura Full-Stack lista para producción.

- Compatible con Docker (si se habilita).

<br/>
🗂️ Estructura del proyecto
/
├── django-api/        # Código del backend (API REST)
│   ├── api/           # Enrutadores generales
│   ├── authentication/# Módulo de autenticación (JWT)
│   ├── clinic/        # Módulo de clínica: mascotas, citas, historiales
│   └── user/          # Módulo de usuarios y roles
│
└── react-ui/          # Frontend en React
    ├── src/components # Componentes reutilizables
    ├── src/layouts    # Estructuras de interfaz
    ├── src/pages      # Vistas: mascotas, personal, citas, etc.
    └── src/utils      # Configuración de API y helpers

<br/>
Recomendaciones para explorar el proyecto

Para la documentacion de la API fue hecha con readoc con todos los endpoint listados


⚡ Quick-Start (Ejecución rápida)
 Backend – Django REST Framework
cd django-api
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 5000


El backend correrá en:


 Frontend – React
cd react-ui
nom        
nom start   



🧪 Versiones probadas (Frontend)
NodeJS	NPM	YARN	Estado
v18.x	v9.x	v1.22.x	✔️
v16.x	v8.x	v1.22.x	✔️
<br/>
📎 Recursos y Documentación

Puedes explorar todo el proyecto dentro del repositorio para revisar modelos, endpoints, componentes y flujos completos.
