from flask import Flask, jsonify, request
from flask_cors import CORS
from config import get_connection

app = Flask(__name__)
CORS(app)

# ══════════════════════════════════════════════════════════
#  USUARIOS
# ══════════════════════════════════════════════════════════

# GET  /usuarios          → todos
@app.route('/usuarios', methods=['GET'])
def get_usuarios():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id_usuario, Nombre, Rol, Telefono, Contrasena FROM Usuarios")
    rows = cursor.fetchall()
    usuarios = [
        {"id_usuario": r[0], "nombre": r[1], "rol": r[2], "telefono": r[3], "contrasena": r[4]}
        for r in rows
    ]
    return jsonify(usuarios), 200

# GET  /usuarios/<id>     → uno
@app.route('/usuarios/<int:id>', methods=['GET'])
def get_usuario(id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id_usuario, Nombre, Rol, Telefono FROM Usuarios WHERE id_usuario = ?", (id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return jsonify({"mensaje": "Usuario no encontrado"}), 404
    return jsonify({"id_usuario": row[0], "nombre": row[1], "rol": row[2], "telefono": row[3]}), 200

# POST /usuarios          → crear
@app.route('/usuarios', methods=['POST'])
def crear_usuario():
    data = request.json
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO Usuarios (Nombre, Rol, Telefono, Contrasena) VALUES (?, ?, ?, ?)",
        (data['nombre'], data['rol'], data.get('telefono'), data['contrasena'])
    )
    conn.commit()
    conn.close()
    return jsonify({"mensaje": "Usuario creado"}), 201

# PUT  /usuarios/<id>     → actualizar
@app.route('/usuarios/<int:id>', methods=['PUT'])
def actualizar_usuario(id):
    data = request.json
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE Usuarios SET Nombre=?, Rol=?, Telefono=? WHERE id_usuario=?",
        (data['nombre'], data['rol'], data.get('telefono'), id)
    )
    conn.commit()
    conn.close()
    return jsonify({"mensaje": "Usuario actualizado"}), 200

@app.route('/suministros/<int:id>', methods=['PUT'])
def actualizar_suministro(id):
    data = request.json
    conn = get_connection()
    cursor = conn.cursor()
    total = data['cantidad'] * data['precio']
    cursor.execute(
        "UPDATE Suministros SET Nombre=?, Tipo=?, Cantidad=?, Precio=?, TotalCosto=? WHERE id_sum=?",
        (data['nombre'], data.get('tipo', 'limpieza'), data['cantidad'], data['precio'], total, id)
    )
    conn.commit()
    conn.close()
    return jsonify({"mensaje": "Suministro actualizado"}), 200

# DELETE /usuarios/<id>   → eliminar
@app.route('/usuarios/<int:id>', methods=['DELETE'])
def eliminar_usuario(id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM Usuarios WHERE id_usuario = ?", (id,))
    conn.commit()
    conn.close()
    return jsonify({"mensaje": "Usuario eliminado"}), 200


# ══════════════════════════════════════════════════════════
#  PRODUCTOS
# ══════════════════════════════════════════════════════════

@app.route('/productos', methods=['GET'])
def get_productos():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id_prod, Codigo, Nombre, Descripcion, Stock_ch, Stock_m, Stock_g, Precio, id_usuario FROM Productos")
    rows = cursor.fetchall()
    conn.close()
    productos = [
        {"id_prod": r[0], "codigo": r[1], "nombre": r[2], "descripcion": r[3],
         "stock_ch": r[4], "stock_m": r[5], "stock_g": r[6], "precio": float(r[7]), "id_usuario": r[8]}
        for r in rows
    ]
    return jsonify(productos), 200

@app.route('/productos/<int:id>', methods=['GET'])
def get_producto(id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id_prod, Codigo, Nombre, Descripcion, Stock_ch, Stock_m, Stock_g, Precio, id_usuario FROM Productos WHERE id_prod = ?", (id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return jsonify({"mensaje": "Producto no encontrado"}), 404
    return jsonify({"id_prod": row[0], "codigo": row[1], "nombre": row[2], "descripcion": row[3],
                    "stock_ch": row[4], "stock_m": row[5], "stock_g": row[6],
                    "precio": float(row[7]), "id_usuario": row[8]}), 200

@app.route('/productos', methods=['POST'])
def crear_producto():
    data = request.json
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO Productos (Codigo, Nombre, Descripcion, Stock_ch, Stock_m, Stock_g, Precio, id_usuario) VALUES (?,?,?,?,?,?,?,?)",
        (data['codigo'], data['nombre'], data.get('descripcion'), data.get('stock_ch', 0),
         data.get('stock_m', 0), data.get('stock_g', 0), data['precio'], data.get('id_usuario'))
    )
    conn.commit()
    conn.close()
    return jsonify({"mensaje": "Producto creado"}), 201

@app.route('/productos/<int:id>', methods=['PUT'])
def actualizar_producto(id):
    data = request.json
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE Productos SET Codigo=?, Nombre=?, Descripcion=?, Stock_ch=?, Stock_m=?, Stock_g=?, Precio=? WHERE id_prod=?",
        (data['codigo'], data['nombre'], data.get('descripcion'),
         data.get('stock_ch', 0), data.get('stock_m', 0), data.get('stock_g', 0),
         data['precio'], id)
    )
    conn.commit()
    conn.close()
    return jsonify({"mensaje": "Producto actualizado"}), 200

@app.route('/productos/<int:id>', methods=['DELETE'])
def eliminar_producto(id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM Productos WHERE id_prod = ?", (id,))
    conn.commit()
    conn.close()
    return jsonify({"mensaje": "Producto eliminado"}), 200


# ══════════════════════════════════════════════════════════
#  VENTAS  (encabezado + items juntos)
# ══════════════════════════════════════════════════════════

@app.route('/ventas', methods=['GET'])
def get_ventas():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT v.id_venta, v.Total, v.Fecha, v.Devuelta, v.Origen,
               m.Metodo, m.Monto_recibido, m.Cambio, m.Tipo_tarjeta,
               m.Terminacion, m.Num_trans, m.Referencia
        FROM Ventas v
        LEFT JOIN Metodos_Pgo m ON v.id_pago = m.id_pago
        ORDER BY v.Fecha DESC
    """)
    rows = cursor.fetchall()

    ventas = []
    for r in rows:
        cursor.execute("""
            SELECT COALESCE(p.Nombre, 'Producto eliminado'), vi.Talla, vi.Cantidad, vi.Precio_unit
            FROM Venta_Items vi
            LEFT JOIN Productos p ON vi.id_prod = p.id_prod
            WHERE vi.id_venta = ?
        """, (r[0],))
        items = cursor.fetchall()
        productos = [f"{i[0]} ({i[1]}) x{i[2]}" for i in items]

        metodo = r[5] or 'Efectivo'
        if metodo == 'Efectivo':
            datos_extra = {'montoRecibido': float(r[6] or 0), 'cambio': float(r[7] or 0)}
        elif metodo == 'Tarjeta':
            datos_extra = {'tipo': r[8], 'terminacion': r[9], 'transaccion': r[10]}
        else:
            datos_extra = {'transaccion': r[10], 'referencia': r[11]}

        ventas.append({
            "id_venta":    r[0],
            "total":       float(r[1]),
            "fecha":       str(r[2]),
            "devuelta":    bool(r[3]),
            "devolucion":  bool(r[3]),
            "origen":      r[4],
            "metodoPago":  metodo,
            "metodo_pago": metodo,
            "datosExtra":  datos_extra,
            "productos":   productos,
        })

    conn.close()
    return jsonify(ventas), 200

@app.route('/ventas/<int:id>', methods=['GET'])
def get_venta(id):
    conn = get_connection()
    cursor = conn.cursor()
    # Encabezado
    cursor.execute("""
        SELECT v.id_venta, v.Total, v.Fecha, v.Devuelta, v.Origen, m.Metodo
        FROM Ventas v
        LEFT JOIN Metodos_Pgo m ON v.id_pago = m.id_pago
        WHERE v.id_venta = ?
    """, (id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return jsonify({"mensaje": "Venta no encontrada"}), 404
    # Items
    cursor.execute("""
        SELECT vi.id_item, p.Nombre, vi.Talla, vi.Cantidad, vi.Precio_unit
        FROM Venta_Items vi
        JOIN Productos p ON vi.id_prod = p.id_prod
        WHERE vi.id_venta = ?
    """, (id,))
    items = [
        {"id_item": i[0], "producto": i[1], "talla": i[2],
         "cantidad": i[3], "precio_unit": float(i[4])}
        for i in cursor.fetchall()
    ]
    conn.close()
    return jsonify({
        "id_venta": row[0], "total": float(row[1]), "fecha": str(row[2]),
        "devuelta": bool(row[3]), "origen": row[4], "metodo_pago": row[5],
        "items": items
    }), 200

@app.route('/ventas', methods=['POST'])
def crear_venta():
    data = request.json
    conn = get_connection()
    cursor = conn.cursor()

    # 1. Guardar método de pago
    mp = data.get('metodo_pago', {})
    cursor.execute(
        "INSERT INTO Metodos_Pgo (Metodo, Monto_recibido, Cambio, Tipo_tarjeta, Terminacion, Num_trans, Referencia) VALUES (?,?,?,?,?,?,?)",
        (mp.get('metodo'), mp.get('monto_recibido'), mp.get('cambio'),
         mp.get('tipo_tarjeta'), mp.get('terminacion'), mp.get('num_trans'), mp.get('referencia'))
    )
    cursor.execute("SELECT LAST_INSERT_ID()")
    id_pago = cursor.fetchone()[0]

    # 2. Guardar encabezado de venta
    cursor.execute(
        "INSERT INTO Ventas (id_pago, id_usuario, Total, Fecha, Devuelta, Origen) VALUES (?,?,?,NOW(),?,?)",
        (id_pago, data.get('id_usuario'), data['total'], data.get('devuelta', False), data.get('origen', 'directo'))
    )
    cursor.execute("SELECT LAST_INSERT_ID()")
    id_venta = cursor.fetchone()[0]

    # 3. Guardar items y actualizar stock
    for item in data.get('items', []):
        cursor.execute(
            "INSERT INTO Venta_Items (id_venta, id_prod, Talla, Cantidad, Precio_unit) VALUES (?,?,?,?,?)",
            (id_venta, item['id_prod'], item['talla'], item['cantidad'], item['precio_unit'])
        )
        # Descontar stock según talla
        col = {'Ch': 'Stock_ch', 'M': 'Stock_m', 'G': 'Stock_g'}.get(item['talla'])
        if col:
            cursor.execute(f"UPDATE Productos SET {col} = {col} - ? WHERE id_prod = ?",
                           (item['cantidad'], item['id_prod']))

    conn.commit()
    conn.close()
    return jsonify({"mensaje": "Venta registrada", "id_venta": id_venta}), 201


# ══════════════════════════════════════════════════════════
#  APARTADOS
# ══════════════════════════════════════════════════════════

@app.route('/apartados', methods=['GET'])
def get_apartados():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id_apart, Nom_cliente, Telefono, Anticipo, Total_ap, Restante, Fecha, Estado FROM Apartados ORDER BY Fecha DESC")
    rows = cursor.fetchall()

    apartados = []
    for r in rows:
        cursor.execute("""
            SELECT ai.id_item, COALESCE(p.Nombre, 'Producto eliminado'),
                   ai.Talla, ai.Cantidad, ai.Precio_unit
            FROM Apartado_Items ai
            LEFT JOIN Productos p ON ai.id_prod = p.id_prod
            WHERE ai.id_apart = ?
        """, (r[0],))
        items = cursor.fetchall()
        productos = [
            f"{i[1]} ({i[2]}) x{i[3]}"
            for i in items
        ]
        apartados.append({
            "id_apart":   r[0],
            "nom_cliente": r[1],
            "telefono":   r[2],
            "anticipo":   float(r[3]),
            "total_ap":   float(r[4]),
            "restante":   float(r[5]),
            "fecha":      str(r[6]),
            "estado":     r[7],
            "productos":  productos,
        })

    conn.close()
    return jsonify(apartados), 200

@app.route('/apartados/<int:id>', methods=['GET'])
def get_apartado(id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id_apart, Nom_cliente, Telefono, Anticipo, Total_ap, Restante, Fecha, Estado FROM Apartados WHERE id_apart = ?", (id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return jsonify({"mensaje": "Apartado no encontrado"}), 404
    cursor.execute("""
        SELECT ai.id_item, p.Nombre, ai.Talla, ai.Cantidad, ai.Precio_unit
        FROM Apartado_Items ai
        JOIN Productos p ON ai.id_prod = p.id_prod
        WHERE ai.id_apart = ?
    """, (id,))
    items = [{"id_item": i[0], "producto": i[1], "talla": i[2], "cantidad": i[3], "precio_unit": float(i[4])} for i in cursor.fetchall()]
    conn.close()
    return jsonify({
        "id_apart": row[0], "nom_cliente": row[1], "telefono": row[2],
        "anticipo": float(row[3]), "total_ap": float(row[4]),
        "restante": float(row[5]), "fecha": str(row[6]), "estado": row[7],
        "items": items
    }), 200

@app.route('/apartados', methods=['POST'])
def crear_apartado():
    data = request.json
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO Apartados (Nom_cliente, Telefono, Anticipo, Total_ap, Fecha, Estado) VALUES (?,?,?,?,NOW(),?)",
        (data['nom_cliente'], data.get('telefono'), data['anticipo'], data['total_ap'], 'activo')
    )
    cursor.execute("SELECT LAST_INSERT_ID()")
    id_apart = cursor.fetchone()[0]
    for item in data.get('items', []):
        cursor.execute(
            "INSERT INTO Apartado_Items (id_apart, id_prod, Talla, Cantidad, Precio_unit) VALUES (?,?,?,?,?)",
            (id_apart, item['id_prod'], item['talla'], item['cantidad'], item['precio_unit'])
        )
    conn.commit()
    conn.close()
    return jsonify({"mensaje": "Apartado creado", "id_apart": id_apart}), 201

@app.route('/apartados/<int:id>', methods=['PUT'])
def actualizar_apartado(id):
    data = request.json
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE Apartados SET Anticipo=?, Estado=? WHERE id_apart=?",
        (data.get('anticipo'), data.get('estado'), id)
    )
    conn.commit()
    conn.close()
    return jsonify({"mensaje": "Apartado actualizado"}), 200

@app.route('/apartados/<int:id>', methods=['DELETE'])
def eliminar_apartado(id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM Apartados WHERE id_apart = ?", (id,))
    conn.commit()
    conn.close()
    return jsonify({"mensaje": "Apartado eliminado"}), 200


# ══════════════════════════════════════════════════════════
#  MAYOREOS
# ══════════════════════════════════════════════════════════

@app.route('/mayoreos', methods=['GET'])
def get_mayoreos():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id_clm, n_pedido, Nombre, Telefono, Total, Fecha FROM Mayoreos ORDER BY Fecha DESC")
    rows = cursor.fetchall()

    mayoreos = []
    for r in rows:
        cursor.execute("""
            SELECT mi.id_item, COALESCE(p.Nombre, 'Producto eliminado'), 
                mi.Ch_cant, mi.M_cant, mi.G_cant, mi.Precio_unit
            FROM Mayoreo_Items mi
            LEFT JOIN Productos p ON mi.id_prod = p.id_prod
            WHERE mi.id_clm = ?
        """, (r[0],))
        items = cursor.fetchall()
        productos = [
            {
                "producto":     i[1],
                "stockChica":   i[2],
                "stockMediana": i[3],
                "stockGrande":  i[4],
                "precio_unit":  float(i[5])
            }
            for i in items
        ]
        cantidad_total = sum(
            p["stockChica"] + p["stockMediana"] + p["stockGrande"]
            for p in productos
        )
        mayoreos.append({
            "id_clm":    r[0],
            "n_pedido":  r[1],
            "nombre":    r[2],
            "cliente":   r[2],
            "telefono":  r[3],
            "total":     float(r[4]),
            "precio":    float(r[4]),
            "fecha":     str(r[5]),
            "productos": productos,
            "cantidad":  cantidad_total,
        })

    conn.close()
    return jsonify(mayoreos), 200

@app.route('/mayoreos/<int:id>', methods=['GET'])
def get_mayoreo(id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id_clm, n_pedido, Nombre, Telefono, Total, Fecha FROM Mayoreos WHERE id_clm = ?", (id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return jsonify({"mensaje": "Mayoreo no encontrado"}), 404
    cursor.execute("""
        SELECT mi.id_item, p.Nombre, mi.Ch_cant, mi.M_cant, mi.G_cant, mi.Precio_unit
        FROM Mayoreo_Items mi
        JOIN Productos p ON mi.id_prod = p.id_prod
        WHERE mi.id_clm = ?
    """, (id,))
    items = [{"id_item": i[0], "producto": i[1], "ch_cant": i[2], "m_cant": i[3], "g_cant": i[4], "precio_unit": float(i[5])} for i in cursor.fetchall()]
    conn.close()
    return jsonify({
        "id_clm": row[0], "n_pedido": row[1], "nombre": row[2],
        "telefono": row[3], "total": float(row[4]), "fecha": str(row[5]),
        "items": items
    }), 200

@app.route('/mayoreos', methods=['POST'])
def crear_mayoreo():
    data = request.json
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO Mayoreos (n_pedido, Nombre, Telefono, Total, Fecha, id_usuario) VALUES (?,?,?,?,NOW(),?)",
        (data.get('n_pedido'), data['nombre'], data.get('telefono'), data['total'], data.get('id_usuario'))
    )
    cursor.execute("SELECT LAST_INSERT_ID()")
    id_clm = cursor.fetchone()[0]
    for item in data.get('items', []):
        cursor.execute(
            "INSERT INTO Mayoreo_Items (id_clm, id_prod, Ch_cant, M_cant, G_cant, Precio_unit) VALUES (?,?,?,?,?,?)",
            (id_clm, item['id_prod'], item.get('ch_cant', 0), item.get('m_cant', 0), item.get('g_cant', 0), item['precio_unit'])
        )
    conn.commit()
    conn.close()
    return jsonify({"mensaje": "Mayoreo creado", "id_clm": id_clm}), 201

@app.route('/mayoreos/<int:id>', methods=['DELETE'])
def eliminar_mayoreo(id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM Mayoreos WHERE id_clm = ?", (id,))
    conn.commit()
    conn.close()
    return jsonify({"mensaje": "Mayoreo eliminado"}), 200


# ══════════════════════════════════════════════════════════
#  SUMINISTROS
# ══════════════════════════════════════════════════════════

@app.route('/suministros', methods=['GET'])
def get_suministros():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id_sum, Nombre, Tipo, Cantidad, Precio, TotalCosto, Fecha FROM Suministros ORDER BY Fecha DESC")
    rows = cursor.fetchall()
    conn.close()
    return jsonify([
        {"id_sum": r[0], "nombre": r[1], "tipo": r[2], "cantidad": r[3],
         "precio": float(r[4]), "total_costo": float(r[5]), "fecha": str(r[6])}
        for r in rows
    ]), 200

@app.route('/suministros', methods=['POST'])
def crear_suministro():
    data = request.json
    conn = get_connection()
    cursor = conn.cursor()
    total = data['cantidad'] * data['precio']
    cursor.execute(
        "INSERT INTO Suministros (Nombre, Tipo, Cantidad, Precio, TotalCosto, Fecha, id_usuario) VALUES (?,?,?,?,?,NOW(),?)",
        (data['nombre'], data.get('tipo', 'limpieza'), data['cantidad'], data['precio'], total, data.get('id_usuario'))
    )
    conn.commit()
    conn.close()
    return jsonify({"mensaje": "Suministro registrado"}), 201

@app.route('/suministros/<int:id>', methods=['DELETE'])
def eliminar_suministro(id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM Suministros WHERE id_sum = ?", (id,))
    conn.commit()
    conn.close()
    return jsonify({"mensaje": "Suministro eliminado"}), 200


# ─────────────────────────────────────────
import os

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)