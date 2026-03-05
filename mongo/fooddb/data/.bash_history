ls /dump
ls /dump/fooddb
exit
mongorestore   -u root   -p RootPass123   --authenticationDatabase admin   --nsInclude="*.*"   --nsFrom="*.**"   --nsTo="fooddb.*"   /dump
exit
ls dump/
mongorestore -u root -p RootPass123 --authenticationDatabase admin --nsInclude="*.*" --nsFrom="*.**" --nsTo="fooddb.*" /dump
mongorestore -u root -p RootPass123 --authenticationDatabase admin --nsFrom="abuela_bedca.*" --nsTo="fooddb.*" /dump/fooddb/abuela_bedca
ls dump/
ls dump/fooddb/
ls dump/fooddb/fooddb/
mongorestore -u root -p RootPass123 --authenticationDatabase admin --db fooddb /dump/fooddb/fooddb
mongosh -u root -p RootPass123 --authenticationDatabase admin
exit
ls
ls dump/
cd dump/
ls
ls dump/
ls fooddb/
ls fooddb/
ls fooddb/fooddb/
ls dump/
ls dump/fooddb/
ls dump/fooddb/fooddb/
mongorestore   -u root   -p RootPass123   --authenticationDatabase admin   --drop   --db fooddb   /dump/fooddb/fooddb
exit
