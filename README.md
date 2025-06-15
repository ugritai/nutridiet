# Sistema de información de nutrición saludable para uso profesional

Este repositorio contiene el código fuente completo del Trabajo Fin de Grado titulado **“Sistema de información de nutrición saludable para uso profesional”**, desarrollado en la Universidad de Granada. 

## Descripción del proyecto
Este Trabajo Fin de Grado presenta el diseño y desarrollo de un sistema de información interactivo orientado a la creación y gestión de dietas personalizadas, pensado para su aplicación tanto en el ámbito educativo como clínico. La iniciativa surge como respuesta a la limitada disponibilidad de herramientas abiertas y adaptables que permitan a profesionales de la nutrición trabajar con datos actualizados, filtrados y contextualizados según las necesidades de cada paciente.

El sistema integra información nutricional de alimentos y recetas, estructurada a partir de bases de datos validadas y adaptada mediante procesamiento semántico para facilitar su consulta y uso práctico. A través de una interfaz web moderna y accesible, desarrollada con React y Material UI, se permite la planificación dietética diaria o semanal, con filtros inteligentes por tipo de alimento, necesidades energéticas o distribución de macronutrientes.

La plataforma ha sido diseñada como una herramienta modular con el objetivo de facilitar tanto la creación de dietas como el seguimiento individualizado de pacientes, gestionar usuarios con diferentes roles, almacenar recetas personalizadas, calcular información nutricional por ración y generar reportes.

Este sistema está orientado a ser utilizado en contextos docentes (como apoyo a la formación en dietética) y en entornos profesionales donde se requiera una herramienta práctica para la toma de decisiones nutricionales fundamentadas. Todo el código fuente se encuentra disponible públicamente, permitiendo su revisión, adaptación y mejora continua.

## Estructura del repositorio
nutridiet/
├── backend/
│   ├── database/              # Conexión y operaciones con MongoDB
│   ├── models/                # Modelos Pydantic (usuarios, recetas, dietas...)
│   ├── routers/               # Endpoints de la API organizados por módulo
│   ├── static/                # Archivos estáticos (PDFs, plantillas, etc.)
│   ├── utils/                 # Funciones auxiliares (cálculos, filtros, seguridad)
│   ├── main.py                # Punto de entrada de la aplicación FastAPI
│   ├── .gitignore             # Exclusiones de Git
│   └── requirements.txt       # Dependencias del backend
│
└── nutridiet-app/
    ├── public/                # Archivos estáticos del frontend
    ├── src/
    │   ├── app/
    │   │   ├── App.css         # Estilos globales
    │   │   └── App.js          # Componente raíz
    │   ├── assets/
    │   │   ├── shared-theme/   # Tema compartido (colores, fuentes...)
    │   │   ├── logo.png
    │   │   └── logo_192.png
    │   ├── features/           # Módulos funcionales del sistema
    │   │   ├── auth/           # Lógica y vistas de autenticación
    │   │   └── dashboard/
    │   │       ├── components/ # Componentes del panel principal
    │   │       └── pages/      # Páginas específicas (inicio, perfil, etc.)
    │   ├── index.js            # Entrada principal de React
    │   ├── index.css           # Estilos base
    │   ├── reportWebVitals.js  # Métricas de rendimiento
    │   └── setupTests.js       # Configuración para testing
    ├── .gitignore              # Exclusiones del frontend
    ├── README.md               # Instrucciones del frontend
    ├── package.json            # Dependencias y scripts de React
    └── package-lock.json       # Versión bloqueada de dependencias

### `backend/`
Contiene la implementación de la API REST del sistema utilizando FastAPI. 
Por razones de derechos de autor, esta no contendrá los datos requeridos para el funcionamiento completo del sistema. Será necesario cargar los datos localmente y configurar.  
Consulta el archivo [`backend/README.md`](./backend/README.md) para más detalles sobre configuración y ejecución.

### `nutridiet-app/`
Contiene el código fuente de la aplicación web del sistema, desarrollada en React + Material UI.  
Puedes ver una demo del sistema en funcionamiento desde el entorno local.  
Consulta el archivo [`nutridiet-app/README.md`](./nutridiet-app/README.md) para instrucciones detalladas de instalación y ejecución del frontend.


## Licencia

Este proyecto ha sido desarrollado con fines académicos, en el marco de un Trabajo Fin de Grado.

Se distribuye bajo la licencia  
**Creative Commons Atribución – No Comercial – Compartir Igual 4.0 Internacional (CC BY-NC-SA 4.0)**.  
![Licencia CC BY-NC-SA](https://mirrors.creativecommons.org/presskit/buttons/88x31/png/by-nc-sa.png)

Esto significa que puede ser compartido y adaptado siempre que se cite correctamente al autor, no se utilice con fines comerciales y cualquier obra derivada se publique bajo la misma licencia.

🔗 Más información sobre los términos de esta licencia:  
[https://creativecommons.org/licenses/by-nc-sa/4.0/deed.es](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.es)

Para consultas o posibles colaboraciones, puedes contactar con el autor.

Autor: Linqi Zhu 
Universidad de Granada – Grado en Ingeniería Informática  
Correo: zhulinqi@correo.ugr.es
