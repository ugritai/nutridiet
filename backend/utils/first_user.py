import bcrypt

password = b"string"   
hashed = bcrypt.hashpw(password, bcrypt.gensalt())

print(hashed.decode())
