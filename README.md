# 🥗 Aplicación NutriDiet

Sistema integral de gestión y planificación dietética desarrollado como TFG en la Universidad de Granada. Esta aplicación permite la gestión de alimentos, generación de recetas y visualización mediante una interfaz moderna.

---

## 🏗️ Arquitectura del Sistema

El sistema está completamente dockerizado y se compone de 5 servicios principales que se comunican de la siguiente manera:



* **Frontend:** React (Material UI) - Servido por Nginx.
* **Backend:** FastAPI (Python 3.9+).
* **Bases de Datos:** 2 instancias de MongoDB (NutridietDB y FoodDB).
* **Proxy/Web Server:** Nginx (Gestiona el tráfico y sirve imágenes estáticas).

---

## 🚀 Guía de Despliegue Rápido

### 1. Requisitos Previos
Asegúrate de tener instalados:
* **Docker** y **Docker Compose**.
* Acceso a internet (para la descarga inicial de imágenes de Docker y APIs externas).

### 2. Configuración de Variables de Entorno
Crea un archivo `.env` en la raíz del proyecto. **No olvides solicitar las API Keys** de Pixabay y Unsplash para que los scripts de imágenes funcionen.

```env
# API Keys para imágenes
PIXABAY_API_KEY=tu_key_aqui
UNSPLASH_ACCESS_KEY=tu_key_aqui

# Conexión MongoDB (Interna de Docker)
MONGO_URI_NUTRIDIET=mongodb://user:pass@nutridietdb:27017/nutridiet?authSource=admin
MONGO_URI_FOODDB=mongodb://user:pass@fooddb:27017/fooddb?authSource=admin

# Backend Config
VITE_API_URL=/api

# Credenciales Root y App
MONGO_ROOT_USER=admin
MONGO_ROOT_PASS=password_seguro
MONGO_APP_USER=user
MONGO_APP_PASS=pass

```

### 3. Instalación y Puesta en Marcha

1. **Clonar y acceder:**
```bash
git clone -b release/1.0.0 [https://github.com/ugritai/nutridiet.git](https://github.com/ugritai/nutridiet.git)
cd nutridiet

```


2. **Levantar la infraestructura:**
```bash
docker-compose up -d --build

```


3. **Restaurar Datos (Importante):**
Si tienes un backup de la base de datos `fooddb` (datos de BEDCA), ejecútalo así:
```bash
docker exec -i fooddb mongorestore --username admin --password password --archive < ruta/al/tu_dump.archive

```
El backup de los datos es fundamental para tener datos en la aplicación. 


---

## 📸 Scripts de Inicialización (Imágenes y Recetas)

Una vez los contenedores estén activos, debes poblar la base de datos con imágenes y procesar los ingredientes. Ejecuta estos comandos en orden:

### Paso A: Imágenes de Categorías

Descarga visuales generales para la interfaz.

```bash
docker exec -it nutridiet-backend python -m utils.descarga_categorias

```

### Paso B: Imágenes de Alimentos (Masivo)

Vincula imágenes de Unsplash/Pixabay a los ingredientes de la base de datos.

```bash
docker exec -it nutridiet-backend python -m utils.descarga_masiva

```

### Paso C: Generación de Recetas BEDCA

Transforma los ingredientes básicos en entidades de "recetas" utilizables por el planificador.

```bash
docker exec -it nutridiet-backend python /app/add_recetas.py

```

---

## 🌐 Puertos y Acceso

| Servicio | URL Local | Descripción |
| --- | --- | --- |
| **Frontend (App)** | [http://localhost/](https://www.google.com/search?q=http://localhost/) | Interfaz de usuario final. |
| **Documentación API** | [http://localhost/api/docs](https://www.google.com/search?q=http://localhost/api/docs) | Swagger UI del Backend. |
| **Imágenes** | [http://localhost/img/](https://www.google.com/search?q=http://localhost/img/) | Directorio de recursos estáticos. |


💡 Acceso Remoto: Si accedes desde fuera del servidor (ej. desde tu casa o la red de la facultad), sustituye localhost por la IP pública/privada del servidor o el dominio configurado.

---

## 🛠️ Mantenimiento y Troubleshooting

* **Ver Logs en tiempo real:**
`docker-compose logs -f backend`
* **Limpiar caché de imágenes:**
Si las imágenes no cargan, verifica los permisos de la carpeta `static` en el servidor o ejecuta el reset de la DB de imágenes:
```bash
docker exec -it nutridiet-backend python -c "from database.connection import images_collection; images_collection.drop();"

```


* **Permisos en el Servidor Uni:**
Si Docker da problemas de permisos al crear volúmenes, asegúrate de que tu usuario pertenece al grupo `docker`: `sudo usermod -aG docker $USER`.

---

## 🎓 Créditos y Contacto

**Autor:** Linqi Zhu

* **Institución:** Universidad de Granada (ETSIIT)
* **Titulación:** Grado en Ingeniería Informática
* **Contacto:** [zhulinqi@correo.ugr.es]()

