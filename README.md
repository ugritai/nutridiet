# Aplicación Nutridiet

El frontend de este sistema fue inicializado con [Create React App](https://github.com/facebook/create-react-app).

A partir de esta base, se ha construido una interfaz personalizada utilizando [Material UI](https://mui.com/) y React Router, adaptada a las necesidades específicas del sistema de planificación dietética.

Puedes ver una demo de uso de la aplicación [aquí](https://drive.google.com/file/d/10IC1oFVbOKyTe_VdsKLkdpSt9aNQeZIn/view?usp=sharing)

## Requisitos
Antes de comenzar, asegúrate de tener instalado lo siguiente:
- [Node.js](https://nodejs.org/) (incluye npm)  
  Se recomienda utilizar la versión **18 o superior**. Puedes verificar la versión instalada ejecutando:
```bash
    node -v
    npm -v
```

## Instalación
1. **Clona el repositorio**:
   ```bash
   git clone https://github.com/ugritai/nutridiet
   ```

2. **Navega al directorio del proyecto**:
    ```bash
   cd tu-repositorio
   ```

3. **Instala las dependencias**:
    ```bash
   npm install
   ```

## Ejecución

1. **Inicia la aplicación**:
    ```bash
   npm start
   ```
   Esto iniciará el servidor de desarrollo y podrás ver la aplicación en tu navegador en [http://localhost:3000](http://localhost:3000).

    La página se recargará automáticamente cuando realices cambios en el código.\
    También podrás ver posibles errores de lint en la consola.

## Aprende más

Autor: Linqi Zhu 
Universidad de Granada – Grado en Ingeniería Informática  
Correo: zhulinqi@correo.ugr.es



# 🚀  Guía de Despliegue

Este repositorio contiene el ecosistema completo de NutriDiet: Backend (FastAPI), Frontend (React), Bases de Datos (MongoDB) y Proxy Inverso (Nginx).

## 📋 Requisitos Previos

* **Docker** y **Docker Compose** instalados.
* Archivo `.env` en la raíz con las siguientes variables:
```env
PIXABAY_API_KEY= 
UNSPLASH_ACCESS_KEY= 

MONGO_URI_NUTRIDIET=mongodb://<user>:<user-pass>@nutridietdb:27017/nutridiet?authSource=admin
MONGO_URI_FOODDB=mongodb://<user>:<user-pass>@fooddb:27017/fooddb?authSource=admin

VITE_API_URL=/api


MONGO_ROOT_USER=<root-user>
MONGO_ROOT_PASS=<root-pass>
MONGO_APP_USER=<user>
MONGO_APP_PASS=<user-pass>

```



---

## 🛠️ Pasos de Instalación

### 1. Clonar el repositorio

```bash
git clone -b release/1.0.0 https://github.com/ugritai/nutridiet.git
cd nutridiet

```
Para seguir desarrollando, se recomienda usar la rama de prueba hasta que haya una versión estable antes de unir con release.

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
