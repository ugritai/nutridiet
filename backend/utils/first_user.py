import bcrypt

password = b"123456"   
hashed = bcrypt.hashpw(password, bcrypt.gensalt())

print(hashed.decode())
