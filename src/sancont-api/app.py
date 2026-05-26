from flask import Flask, request, jsonify
from flask_cors import CORS
from config import get_connection

app = Flask(__name__)
CORS(app)

# ─────────────────────────────────────────
# AUTH
# ─────────────────────────────────────────

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    nombre = data.get('Nombre')
    contrasena = data.get('Contrasena')
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id_usuario, Nombre, Rol FROM usuarios WHERE Nombre=%s AND Contrasena=%s",
                (nombre, contrasena)
            )
            user = cur.fetchone()
            if user:
                return jsonify({'id_usuario': user[0], 'Nombre': user[1], 'Rol': user[2]})
            return jsonify({'error': 'Credenciales incorrectas'}), 401
    finally:
        conn.close()

# ─────────────────────────────────────────
# USUARIOS
# ─────────────────────────────────────────

@app.route('/usuarios', methods=['GET'])
def get_usuarios():
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id_usuario, Nombre, Rol, Telefono FROM usuarios")
            rows = cur.fetchall()
            return jsonify([{'id_usuario': r[0], 'Nombre': r[1], 'Rol': r[2], 'Telefono': r[3]} for r in rows])
    finally:
        conn.close()

@app.route('/usuarios', methods=['POST'])
def crear_usuario():
    data = request.get_json()
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO usuarios (Nombre, Rol, Telefono, Contrasena) VALUES (%s, %s, %s, %s)",
                (data['Nombre'], data['Rol'], data.get('Telefono'), data['Contrasena'])
            )
            conn.commit()
            return jsonify({'mensaje': 'Usuario creado', 'id': cur.lastrowid}), 201
    finally:
        conn.close()

@app.route('/usuarios/<int:id>', methods=['PUT'])
def actualizar_usuario(id):
    data = request.get_json()
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE usuarios SET Nombre=%s, Rol=%s, Telefono=%s WHERE id_usuario=%s",
                (data['Nombre'], data['Rol'], data.get('Telefono'), id)
            )
            conn.commit()
            return jsonify({'mensaje': 'Usuario actualizado'})
    finally:
        conn.close()

@app.route('/usuarios/<int:id>', methods=['DELETE'])
def eliminar_usuario(id):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM usuarios WHERE id_usuario=%s", (id,))
            conn.commit()
            return jsonify({'mensaje': 'Usuario eliminado'})
    finally:
        conn.close()

# ─────────────────────────────────────────
# PRODUCTOS
# ─────────────────────────────────────────

@app.route('/productos', methods=['GET'])
def get_productos():
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id_prod, Codigo, Nombre, Descripcion, Stock_ch, Stock_m, Stock_g, Precio FROM productos")
            rows = cur.fetchall()
            return jsonify([{
                'id_prod': r[0], 'Codigo': r[1], 'Nombre': r[2], 'Descripcion': r[3],
                'Stock_ch': r[4], 'Stock_m': r[5], 'Stock_g': r[6], 'Precio': float(r[7])
            } for r in rows])
    finally:
        conn.close()

@app.route('/productos/<int:id>', methods=['GET'])
def get_producto(id):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id_prod, Codigo, Nombre, Descripcion, Stock_ch, Stock_m, Stock_g, Precio FROM productos WHERE id_prod=%s", (id,))
            r = cur.fetchone()
            if r:
                return jsonify({'id_prod': r[0], 'Codigo': r[1], 'Nombre': r[2], 'Descripcion': r[3],
                                'Stock_ch': r[4], 'Stock_m': r[5], 'Stock_g': r[6], 'Precio': float(r[7])})
            return jsonify({'error': 'No encontrado'}), 404
    finally:
        conn.close()

@app.route('/productos', methods=['POST'])
def crear_producto():
    data = request.get_json()
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO productos (Codigo, Nombre, Descripcion, Stock_ch, Stock_m, Stock_g, Precio, id_usuario) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)",
                (data['Codigo'], data['Nombre'], data.get('Descripcion'), data.get('Stock_ch', 0),
                 data.get('Stock_m', 0), data.get('Stock_g', 0), data['Precio'], data.get('id_usuario'))
            )
            conn.commit()
            return jsonify({'mensaje': 'Producto creado', 'id': cur.lastrowid}), 201
    finally:
        conn.close()

@app.route('/productos/<int:id>', methods=['PUT'])
def actualizar_producto(id):
    data = request.get_json()
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE productos SET Codigo=%s, Nombre=%s, Descripcion=%s, Stock_ch=%s, Stock_m=%s, Stock_g=%s, Precio=%s WHERE id_prod=%s",
                (data['Codigo'], data['Nombre'], data.get('Descripcion'), data.get('Stock_ch', 0),
                 data.get('Stock_m', 0), data.get('Stock_g', 0), data['Precio'], id)
            )
            conn.commit()
            return jsonify({'mensaje': 'Producto actualizado'})
    finally:
        conn.close()

@app.route('/productos/<int:id>', methods=['DELETE'])
def eliminar_producto(id):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM productos WHERE id_prod=%s", (id,))
            conn.commit()
            return jsonify({'mensaje': 'Producto eliminado'})
    finally:
        conn.close()

# ─────────────────────────────────────────
# VENTAS
# ─────────────────────────────────────────

@app.route('/ventas', methods=['GET'])
def get_ventas():
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id_venta, id_pago, id_usuario, Total, Fecha, Devuelta, Origen FROM ventas ORDER BY Fecha DESC")
            rows = cur.fetchall()
            return jsonify([{
                'id_venta': r[0], 'id_pago': r[1], 'id_usuario': r[2],
                'Total': float(r[3]), 'Fecha': str(r[4]), 'Devuelta': r[5], 'Origen': r[6]
            } for r in rows])
    finally:
        conn.close()

@app.route('/ventas', methods=['POST'])
def crear_venta():
    data = request.get_json()
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            # Insertar método de pago
            pago = data.get('pago', {})
            cur.execute(
                "INSERT INTO metodos_pgo (Metodo, Monto_recibido, Cambio, Tipo_tarjeta, Terminacion, Num_trans, Referencia) VALUES (%s,%s,%s,%s,%s,%s,%s)",
                (pago.get('Metodo'), pago.get('Monto_recibido'), pago.get('Cambio'),
                 pago.get('Tipo_tarjeta'), pago.get('Terminacion'), pago.get('Num_trans'), pago.get('Referencia'))
            )
            id_pago = cur.lastrowid

            # Insertar venta
            cur.execute(
                "INSERT INTO ventas (id_pago, id_usuario, Total, Origen) VALUES (%s,%s,%s,%s)",
                (id_pago, data.get('id_usuario'), data['Total'], data.get('Origen', 'directo'))
            )
            id_venta = cur.lastrowid

            # Insertar items y actualizar stock
            for item in data.get('items', []):
                cur.execute(
                    "INSERT INTO venta_items (id_venta, id_prod, Talla, Cantidad, Precio_unit) VALUES (%s,%s,%s,%s,%s)",
                    (id_venta, item['id_prod'], item['Talla'], item['Cantidad'], item['Precio_unit'])
                )
                col = {'CH': 'Stock_ch', 'M': 'Stock_m', 'G': 'Stock_g'}.get(item['Talla'].upper(), 'Stock_m')
                cur.execute(f"UPDATE productos SET {col}={col}-%s WHERE id_prod=%s", (item['Cantidad'], item['id_prod']))

            conn.commit()
            return jsonify({'mensaje': 'Venta registrada', 'id_venta': id_venta}), 201
    finally:
        conn.close()

@app.route('/ventas/<int:id>/items', methods=['GET'])
def get_venta_items(id):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT vi.id_item, vi.id_prod, p.Nombre, vi.Talla, vi.Cantidad, vi.Precio_unit
                FROM venta_items vi JOIN productos p ON vi.id_prod=p.id_prod
                WHERE vi.id_venta=%s
            """, (id,))
            rows = cur.fetchall()
            return jsonify([{'id_item': r[0], 'id_prod': r[1], 'Nombre': r[2],
                             'Talla': r[3], 'Cantidad': r[4], 'Precio_unit': float(r[5])} for r in rows])
    finally:
        conn.close()

@app.route('/ventas/<int:id>/devolucion', methods=['PUT'])
def devolver_venta(id):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("UPDATE ventas SET Devuelta=1 WHERE id_venta=%s", (id,))
            conn.commit()
            return jsonify({'mensaje': 'Devolución registrada'})
    finally:
        conn.close()

# ─────────────────────────────────────────
# APARTADOS
# ─────────────────────────────────────────

@app.route('/apartados', methods=['GET'])
def get_apartados():
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id_apart, Nom_cliente, Telefono, Anticipo, Total_ap, Restante, Fecha, Estado FROM apartados ORDER BY Fecha DESC")
            rows = cur.fetchall()
            return jsonify([{
                'id_apart': r[0], 'Nom_cliente': r[1], 'Telefono': r[2],
                'Anticipo': float(r[3]), 'Total_ap': float(r[4]), 'Restante': float(r[5]),
                'Fecha': str(r[6]), 'Estado': r[7]
            } for r in rows])
    finally:
        conn.close()

@app.route('/apartados', methods=['POST'])
def crear_apartado():
    data = request.get_json()
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO apartados (Nom_cliente, Telefono, Anticipo, Total_ap, Estado) VALUES (%s,%s,%s,%s,'activo')",
                (data['Nom_cliente'], data.get('Telefono'), data['Anticipo'], data['Total_ap'])
            )
            id_apart = cur.lastrowid
            for item in data.get('items', []):
                cur.execute(
                    "INSERT INTO apartado_items (id_apart, id_prod, Talla, Cantidad, Precio_unit) VALUES (%s,%s,%s,%s,%s)",
                    (id_apart, item['id_prod'], item['Talla'], item['Cantidad'], item['Precio_unit'])
                )
            conn.commit()
            return jsonify({'mensaje': 'Apartado creado', 'id_apart': id_apart}), 201
    finally:
        conn.close()

@app.route('/apartados/<int:id>', methods=['PUT'])
def actualizar_apartado(id):
    data = request.get_json()
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE apartados SET Anticipo=%s, Estado=%s WHERE id_apart=%s",
                (data.get('Anticipo'), data.get('Estado'), id)
            )
            conn.commit()
            return jsonify({'mensaje': 'Apartado actualizado'})
    finally:
        conn.close()

@app.route('/apartados/<int:id>/items', methods=['GET'])
def get_apartado_items(id):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT ai.id_item, ai.id_prod, p.Nombre, ai.Talla, ai.Cantidad, ai.Precio_unit
                FROM apartado_items ai JOIN productos p ON ai.id_prod=p.id_prod
                WHERE ai.id_apart=%s
            """, (id,))
            rows = cur.fetchall()
            return jsonify([{'id_item': r[0], 'id_prod': r[1], 'Nombre': r[2],
                             'Talla': r[3], 'Cantidad': r[4], 'Precio_unit': float(r[5])} for r in rows])
    finally:
        conn.close()

# ─────────────────────────────────────────
# MAYOREOS
# ─────────────────────────────────────────

@app.route('/mayoreos', methods=['GET'])
def get_mayoreos():
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id_clm, n_pedido, Nombre, Telefono, Total, Fecha FROM mayoreos ORDER BY Fecha DESC")
            rows = cur.fetchall()
            return jsonify([{
                'id_clm': r[0], 'n_pedido': r[1], 'Nombre': r[2],
                'Telefono': r[3], 'Total': float(r[4]), 'Fecha': str(r[5])
            } for r in rows])
    finally:
        conn.close()

@app.route('/mayoreos', methods=['POST'])
def crear_mayoreo():
    data = request.get_json()
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO mayoreos (n_pedido, Nombre, Telefono, Total, id_usuario) VALUES (%s,%s,%s,%s,%s)",
                (data.get('n_pedido'), data['Nombre'], data.get('Telefono'), data['Total'], data.get('id_usuario'))
            )
            id_clm = cur.lastrowid
            for item in data.get('items', []):
                cur.execute(
                    "INSERT INTO mayoreo_items (id_clm, id_prod, Ch_cant, M_cant, G_cant, Precio_unit) VALUES (%s,%s,%s,%s,%s,%s)",
                    (id_clm, item['id_prod'], item.get('Ch_cant', 0), item.get('M_cant', 0), item.get('G_cant', 0), item['Precio_unit'])
                )
            conn.commit()
            return jsonify({'mensaje': 'Mayoreo registrado', 'id_clm': id_clm}), 201
    finally:
        conn.close()

# ─────────────────────────────────────────
# SUMINISTROS
# ─────────────────────────────────────────

@app.route('/suministros', methods=['GET'])
def get_suministros():
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id_sum, Nombre, Tipo, Cantidad, Precio, TotalCosto, Fecha FROM suministros ORDER BY Fecha DESC")
            rows = cur.fetchall()
            return jsonify([{
                'id_sum': r[0], 'Nombre': r[1], 'Tipo': r[2],
                'Cantidad': r[3], 'Precio': float(r[4]), 'TotalCosto': float(r[5]), 'Fecha': str(r[6])
            } for r in rows])
    finally:
        conn.close()

@app.route('/suministros', methods=['POST'])
def crear_suministro():
    data = request.get_json()
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            total = data['Cantidad'] * data['Precio']
            cur.execute(
                "INSERT INTO suministros (Nombre, Tipo, Cantidad, Precio, TotalCosto, id_usuario) VALUES (%s,%s,%s,%s,%s,%s)",
                (data['Nombre'], data.get('Tipo', 'limpieza'), data['Cantidad'], data['Precio'], total, data.get('id_usuario'))
            )
            conn.commit()
            return jsonify({'mensaje': 'Suministro registrado', 'id': cur.lastrowid}), 201
    finally:
        conn.close()

@app.route('/suministros/<int:id>', methods=['DELETE'])
def eliminar_suministro(id):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM suministros WHERE id_sum=%s", (id,))
            conn.commit()
            return jsonify({'mensaje': 'Suministro eliminado'})
    finally:
        conn.close()

if __name__ == '__main__':
    app.run(debug=True)
