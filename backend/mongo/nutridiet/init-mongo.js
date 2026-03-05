db = db.getSiblingDB("admin");

// Crear el usuario root
db.createUser({
  user: "root",
  pwd: "rootpassword",
  roles: ["root"]
});

// Crear usuario de aplicación
db = db.getSiblingDB("nutridiet");
db.createUser({
  user: "theuser",
  pwd: "1234",
  roles: [
    { role: "readWrite", db: "nutridiet" }
  ]
});
