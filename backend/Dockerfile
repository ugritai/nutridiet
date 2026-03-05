FROM python:3.11-slim

WORKDIR /app

# Instalar dependencias del sistema (Caché pesada)
RUN apt-get update && apt-get install -y build-essential && rm -rf /var/lib/apt/lists/*

# Copiar requerimientos e instalar (Caché de librerías como torch)
COPY requirements.txt .

# 1. Instalar Torch versión CPU (Esto ocupa ~150MB en vez de 3GB)
# Al instalarlo aquí primero, cuando llegue al requirements.txt verá que ya lo tiene y no bajará el gigante.
RUN pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu

# 2. Instalar el resto (con el timeout alto por si acaso)
RUN pip install --default-timeout=1000 --no-cache-dir -r requirements.txt

# Copiar el resto de archivos (Solo cambia esta capa si editas código/scripts)
COPY . .

# Asegurar permisos del script de espera
RUN chmod +x wait-for-it.sh

# El comando se define en el docker-compose, pero dejamos esto por defecto
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]