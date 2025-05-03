# nutridiet
TFG Linqi Zhu

# Activar Docker
docker start fooddb 
docker stop fooddb 

# Activar FAST Api
source myenv/bin/activate
uvicorn main:app --reload

# Activar React
npm start

# Conectar a mongoDB
mongosh --host localhost --port 27018 
mongosh --host localhost --port 27017