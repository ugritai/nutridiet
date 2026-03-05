db = db.getSiblingDB("admin");

db.createUser({
    user: "app_user",
    pwd: "1234",
    roles: [
        { role: "readWrite", db: "nutridiet" },
        { role: "readWrite", db: "fooddb" }
    ]
});
