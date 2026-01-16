db = db.getSiblingDB("admin");

// root
db.createUser({
  user: "root",
  pwd: "rootpassword",
  roles: ["root"]
});

// usuario de lectura general
db = db.getSiblingDB("nutridiet_external");
db.createUser({
  user: "theuser",
  pwd: "1234",
  roles: [
    { role: "readWrite", db: "nutridiet_external" }
  ]
});
