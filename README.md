# Sistema de información de nutrición saludable para uso profesional

Este repositorio contiene el código fuente completo del Trabajo Fin de Grado titulado **“Sistema de información de nutrición saludable para uso profesional”**, desarrollado en la Universidad de Granada. 

## Descripción del proyecto
Este Trabajo Fin de Grado presenta el diseño y desarrollo de un sistema de información interactivo orientado a la creación y gestión de dietas personalizadas, pensado para su aplicación tanto en el ámbito educativo como clínico. La iniciativa surge como respuesta a la limitada disponibilidad de herramientas abiertas y adaptables que permitan a profesionales de la nutrición trabajar con datos actualizados, filtrados y contextualizados según las necesidades de cada paciente.

El sistema integra información nutricional de alimentos y recetas, estructurada a partir de bases de datos validadas y adaptada mediante procesamiento semántico para facilitar su consulta y uso práctico. A través de una interfaz web moderna y accesible, desarrollada con React y Material UI, se permite la planificación dietética diaria o semanal, con filtros inteligentes por tipo de alimento, necesidades energéticas o distribución de macronutrientes.

La plataforma ha sido diseñada como una herramienta modular con el objetivo de facilitar tanto la creación de dietas como el seguimiento individualizado de pacientes, gestionar usuarios con diferentes roles, almacenar recetas personalizadas, calcular información nutricional por ración y generar reportes.

Este sistema está orientado a ser utilizado en contextos docentes (como apoyo a la formación en dietética) y en entornos profesionales donde se requiera una herramienta práctica para la toma de decisiones nutricionales fundamentadas. Todo el código fuente se encuentra disponible públicamente, permitiendo su revisión, adaptación y mejora continua.

## Estructura del repositorio
```
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
```

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



# 🚀  Guía de Despliegue

Este repositorio contiene el ecosistema completo de NutriDiet: Backend (FastAPI), Frontend (React), Bases de Datos (MongoDB) y Proxy Inverso (Nginx).

## 📋 Requisitos Previos

* **Docker** y **Docker Compose** instalados.
* Archivo `.env` en la raíz con las siguientes variables:
```env
MONGO_ROOT_USER=tu_usuario
MONGO_ROOT_PASS=tu_password
PIXABAY_API_KEY=tu_api_key_aqui

```



---

## 🛠️ Pasos de Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/ugritai/nutridiet/tree/release/1.0.0
cd nutridiet

```

### 2. Desplegar los Contenedores

Levantamos toda la infraestructura en segundo plano:

```bash
docker-compose up -d --build

```

*Esto iniciará las dos bases de datos (nutridietdb y fooddb), el backend, el frontend y Nginx.*

### 3. Restaurar Bases de Datos (Dumps)

Si tienes backups previos de MongoDB, restáuralos ahora:

```bash
# Ejemplo para fooddb
docker exec -i fooddb mongorestore --username admin --password password --archive < ruta/al/tu_dump.archive

```
El nombre y contraseña se configuran y consulatan en el `.env` 
---

## 📸 Configuración de Imágenes y Datos (Scripts)

Una vez que los contenedores estén corriendo, debemos ejecutar los scripts de utilidad para descargar imágenes y generar recetas automáticas.

### A. Descarga de Imágenes por Categorías

Este script descarga imágenes generales para las categorías de alimentos y recetas desde Pixabay.

```bash
docker cp backend/utils/descarga_categorias.py nutridiet-backend:/app/utils/descarga_categorias.py
docker exec -it nutridiet-backend python -m utils.descarga_categorias

```

### B. Descarga Masiva de Alimentos

Para obtener imágenes específicas de cada ingrediente en la base de datos `fooddb`:

```bash
docker cp backend/utils/descarga_masiva.py nutridiet-backend:/app/utils/descarga_masiva.py
docker exec -it nutridiet-backend python -m utils.descarga_masiva

```

### C. Generación de Recetas Automáticas (BEDCA)

Este script convierte los ingredientes individuales de BEDCA en "recetas" de un solo ingrediente para el frontend:

```bash
docker cp add_recetas.py nutridiet-backend:/app/add_recetas.py
docker exec -it nutridiet-backend python /app/add_recetas.py

```

---

## 🌐 Puertos y Acceso

| Servicio | Puerto Externo | URL de Acceso |
| --- | --- | --- |
| **App Web (Nginx)** | 80 | `http://localhost/` |
| **API Backend** | 8000 (Interno) | `http://localhost/api/` |
| **Imágenes Estáticas** | - | `http://localhost/img/` |

> **Nota sobre Seguridad:** Las bases de datos MongoDB no tienen puertos expuestos al exterior en el `docker-compose.yml`. Solo son accesibles por el servicio de Backend dentro de la red de Docker.

---

## 📁 Estructura de Volúmenes de Imágenes

Nginx sirve las imágenes directamente desde el sistema de archivos para mayor velocidad:

* `/app/static/images/` -> Imágenes de alimentos.
* `/app/static/images_recipies/` -> Imágenes de recetas.

Estos directorios están persistidos en el host para evitar que se borren al reiniciar los contenedores.

---

## 🛠️ Comandos de Mantenimiento

**Resetear base de datos de imágenes:**

```bash
docker exec -it nutridiet-backend python -c "from database.connection import images_collection; images_collection.drop(); print('✅ Base de datos de imágenes reseteada')"

```

**Ver logs del backend:**

```bash
docker logs -f nutridiet-backend

```
