import sqlite3

conn = sqlite3.connect("complain_db.sqlite")
c = conn.cursor()

try:
    c.execute("ALTER TABLE users ADD COLUMN department VARCHAR")
    print("Added department to users")
except sqlite3.OperationalError as e:
    print(e)

try:
    c.execute("ALTER TABLE complaints ADD COLUMN assigned_to INTEGER REFERENCES users(user_id)")
    print("Added assigned_to to complaints")
except sqlite3.OperationalError as e:
    print(e)

conn.commit()
conn.close()
