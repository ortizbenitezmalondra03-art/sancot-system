# config.py
import pyodbc
print(pyodbc.drivers())  # Muestra los drivers instalados al arrancar — útil para verificar

def get_connection():
    conn = pyodbc.connect(
        'DRIVER={MariaDB ODBC 3.2 Driver};'
        'SERVER=localhost;'
        'PORT=3306;'
        'DATABASE=sancot;'
        'USER=root;'
        'PASSWORD=;'        # XAMPP no tiene contraseña por default, deja vacío
        'OPTION=3;'
        'CHARSET=UTF8MB4;'
    )
    return conn