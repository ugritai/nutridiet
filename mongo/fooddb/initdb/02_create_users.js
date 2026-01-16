db = db.getSiblingDB('fooddb');

db.createUser({
    user: "food_user",
    pwd: "food_pass",
    roles: [
        { role: "readWrite", db: "fooddb" }
    ]
});
