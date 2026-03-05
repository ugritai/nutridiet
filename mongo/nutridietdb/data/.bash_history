exit
mongodump --out dump_all
mongodump   -u root   -p RootPass123!   --authenticationDatabase admin   --out dump_all
mongodump   -u root   -p RootPass123   --authenticationDatabase admin   --out dump_all
mongorestore   -u root   -p RootPass123 \ 
  --authenticationDatabase admin   --nsFrom="bedca_embeddings.*"   --nsTo="nutridiet.*"   dump_all/bedca_embeddings
mongorestore   -u root   -p RootPass123 \ 
  --authenticationDatabase admin   --nsFrom="bedca_embeddings.*"   --nsTo="nutridiet.*"   dump_all/bedca_embeddings
mongorestore   -u root   -p RootPass123!   --authenticationDatabase admin   --nsFrom="bedca_embeddings.*"   --nsTo="nutridiet.*"   dump_all/bedca_embeddings
mongorestore   -u root   -p RootPass123   --authenticationDatabase admin   --nsFrom="bedca_embeddings.*"   --nsTo="nutridiet.*"   dump_all/bedca_embeddings
mongorestore   -u root -p RootPass123   --authenticationDatabase admin   --nsFrom="bedca_embeddings.*"   --nsTo="nutridiet.*"   --dir=dump_all/bedca_embeddings
ls
ls dump
ls dump/nutridiet/
for db in bedca_embeddings diet food_portions ingredient_image intake nutritionist patient recetas_embeddings; do   for col in $(ls dump/nutridiet/$db/*.bson | xargs -n 1 basename | sed 's/.bson//'); do     mongorestore       -u root -p RootPass123       --authenticationDatabase admin       --nsFrom="$db.$col"       --nsTo="nutridiet.$col"       dump/nutridiet/$db/$col.bson;   done; done
exit
