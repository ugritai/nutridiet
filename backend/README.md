# Guía de Ejecución de la API

## Introducción
Este documento proporciona instrucciones paso a paso para la configuración y ejecución de la API del sistema.  

## Requisitos Previos

Antes de comenzar, asegúrate de tener instalado lo siguiente:

## Requisitos

Antes de comenzar, asegúrate de tener instalado lo siguiente:

- [Python 3.7 o superior](https://www.python.org/downloads/)
- [pip](https://pip.pypa.io/en/stable/installation/) (gestor de paquetes de Python, normalmente incluido con Python)
- [MongoDB](https://www.mongodb.com/try/download/community) (puede ejecutarse localmente o desde un servicio en la nube)
- [Uvicorn](https://www.uvicorn.org/) (servidor ASGI para ejecutar FastAPI)

## Instalación

1. **Clonar el repositorio**

   Clona el repositorio en tu máquina local:

   ```bash
   git clone https://github.com/ugritai/nutridiet
   cd nutridiet/backend
   ```

2. **Crear un entorno virtual**

   Es recomendable crear un entorno virtual para gestionar las dependencias:

   ```bash
   python3 -m venv myenv
   source myenv/bin/activate  # En Windows us a `myenv\Scripts\activate`
   ```

3. **Instalar las dependencias**

   Instala las dependencias necesarias para ejecutar la API:

   ```bash
   pip install -r requirements.txt
   ```

## Configuración

### Conexión a MongoDB

Por motivos de confidencialidad y derechos de uso, **los datos necesarios para ejecutar el sistema no están incluidos** en el repositorio. Sin embargo, puedes trabajar con tu propia instancia local de MongoDB.

Asegúrate de tener una base de datos creada y poblada con los datos adecuados. Para conectarte a MongoDB desde la terminal puedes utilizar el siguiente comando:

```bash
mongosh --host localhost --port 27017
mongosh --host localhost --port 27018
```

## Ejecución

1. **Inicia la API**:

```bash
 ./myenv/bin/uvicorn main:app --reload
```
Este comando iniciará el servidor de desarrollo de FastAPI con la recarga automática habilitada. La API estará disponible en [ http://127.0.0.1:8000](http://127.0.0.1:8000).

## Verificación

Una vez que hayas iniciado el servidor con `uvicorn`, puedes verificar que la API está funcionando correctamente accediendo a la documentación interactiva generada por FastAPI:

- Swagger UI: [`http://127.0.0.1:8000/docs`](http://127.0.0.1:8000/docs)
- Redoc: [`http://127.0.0.1:8000/redoc`](http://127.0.0.1:8000/redoc)

Desde estas interfaces puedes explorar y probar los endpoints directamente desde el navegador.
