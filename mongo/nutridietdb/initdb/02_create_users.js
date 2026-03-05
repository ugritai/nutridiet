db = db.getSiblingDB('nutridiet');

// usuario para lectura/escritura en esta DB
db.createUser({
  user: "nutridiet_user",
  pwd: "nutridiet_pass",
  roles: [
    { role: "readWrite", db: "nutridiet" }
  ]
});
