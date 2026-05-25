import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSancot } from '../../context/SancotContext'
import './Ventas.css'

function Ventas() {
  //const { inventario, setInventario, ventas, setVentas } = useSancot()
  const { inventario, agregarVenta } = useSancot()
  const [productoSeleccionado, setProductoSeleccionado] = useState(null)
  const [talla, setTalla] = useState('')
  const [cantidad, setCantidad] = useState(1)
  const [metodoPago, setMetodoPago] = useState('efectivo')
  const [ventasHoy, setVentasHoy] = useState([])
  const navigate = useNavigate()

  const navItems = [
    { path: '/admin/inventario', label: 'Inventario' },
    { path: '/admin/suministros', label: 'Suministros' },
    { path: '/admin/mayoreos', label: 'Mayoreos' },
    { path: '/admin/usuarios', label: 'Usuarios' },
    { path: '/admin/ingresos', label: 'Ingresos' },
    { path: '/admin/apartados', label: 'Apartados' },
  ]

  const handleLogout = () => {
    localStorage.removeItem('rol')
    navigate('/')
  }

  // Combinar todos los productos del inventario
  const todosProductos = [
    ...inventario.dany.map(p => ({ ...p, responsable: 'dany' })),
    ...inventario.erick.map(p => ({ ...p, responsable: 'erick' })),
  ]

  // Obtener stock disponible según talla seleccionada
  const getStockDisponible = () => {
    if (!productoSeleccionado || !talla) return 0
    const key = `stock${talla.charAt(0).toUpperCase() + talla.slice(1)}`
    return productoSeleccionado[key] || 0
  }

  const realizarVenta = async () => {
    if (!productoSeleccionado || !talla || cantidad < 1) {
      alert('Por favor completa todos los campos')
      return
    }

    const stockKey = `stock${talla.charAt(0).toUpperCase() + talla.slice(1)}`
    const stockActual = productoSeleccionado[stockKey] || 0

    if (cantidad > stockActual) {
      alert('No hay suficiente stock')
      return
    }

    const total = productoSeleccionado.precio * cantidad

    const tallaDB = {
      chica: 'Ch',
      mediana: 'M',
      grande: 'G'
    }

    try {
      await agregarVenta({
        total,
        metodoPago,
        carrito: [
          {
            id_prod: productoSeleccionado.id_prod,
            talla: tallaDB[talla],
            cantidad,
            precio: productoSeleccionado.precio
          }
        ]
      })

      alert('¡Venta registrada exitosamente!')

      setProductoSeleccionado(null)
      setTalla('')
      setCantidad(1)
      setMetodoPago('efectivo')

    } catch (error) {
      console.error(error)
      alert('Error al registrar la venta')
    }
  }

  // Calcular totales
  const totalVentasHoy = ventasHoy.reduce((acc, v) => acc + v.total, 0)
  const cantidadVentasHoy = ventasHoy.length

  return (
    <>
      <div className="ventas-container">
            <h5 className="mb-4">Punto de Venta</h5>

            <div className="row g-4">
              {/* Panel de Venta */}
              <div className="col-lg-6">
                <div className="card shadow-sm">
                  <div className="card-header bg-primary text-white fw-semibold">
                    <i className="fa-solid fa-shopping-cart me-2"></i>
                    Registrar Venta
                  </div>
                  <div className="card-body">
                    {/* Selección de Producto */}
                    <div className="mb-3">
                      <label className="form-label">Producto</label>
                      <select
                        className="form-select form-select-sm"
                        value={productoSeleccionado ? productoSeleccionado.codigo : ''}
                        onChange={(e) => {
                          const producto = todosProductos.find(p => p.codigo === e.target.value)
                          setProductoSeleccionado(producto || null)
                          setTalla('')
                          setCantidad(1)
                        }}
                      >
                        <option value="">— Selecciona un producto —</option>
                        {todosProductos.map(p => (
                          <option key={p.codigo} value={p.codigo}>
                            {p.producto} ({p.codigo}) - ${p.precio.toFixed(2)}
                          </option>
                        ))}
                      </select>
                    </div>

                    {productoSeleccionado && (
                      <>
                        {/* Información del Producto */}
                        <div className="alert alert-info py-2 mb-3">
                          <p className="mb-1"><strong>{productoSeleccionado.producto}</strong></p>
                          <small>Código: {productoSeleccionado.codigo}</small>
                        </div>

                        {/* Selección de Talla */}
                        <div className="mb-3">
                          <label className="form-label">Talla</label>
                          <div className="ventas-talla-selector">
                            {[
                              { key: 'chica', label: 'Chica', stock: productoSeleccionado.stockChica },
                              { key: 'mediana', label: 'Mediana', stock: productoSeleccionado.stockMediana },
                              { key: 'grande', label: 'Grande', stock: productoSeleccionado.stockGrande },
                            ].map(t => (
                              <button
                                key={t.key}
                                className={`btn btn-sm ventas-talla-btn ${talla === t.key ? 'active' : ''}`}
                                disabled={t.stock === 0}
                                onClick={() => {
                                  setTalla(t.key)
                                  setCantidad(1)
                                }}
                              >
                                {t.label}
                                <br />
                                <small>({t.stock})</small>
                              </button>
                            ))}
                          </div>
                        </div>

                        {talla && (
                          <>
                            {/* Cantidad */}
                            <div className="mb-3">
                              <label className="form-label">Cantidad</label>
                              <div className="input-group input-group-sm">
                                <button
                                  className="btn btn-outline-secondary"
                                  onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                                >
                                  −
                                </button>
                                <input
                                  type="number"
                                  className="form-control text-center"
                                  value={cantidad}
                                  onChange={(e) => setCantidad(Math.max(1, parseInt(e.target.value) || 1))}
                                  min="1"
                                  max={getStockDisponible()}
                                />
                                <button
                                  className="btn btn-outline-secondary"
                                  onClick={() => setCantidad(Math.min(getStockDisponible(), cantidad + 1))}
                                >
                                  +
                                </button>
                              </div>
                              <small className="text-muted">Stock disponible: {getStockDisponible()}</small>
                            </div>

                            {/* Método de Pago */}
                            <div className="mb-3">
                              <label className="form-label">Método de Pago</label>
                              <select
                                className="form-select form-select-sm"
                                value={metodoPago}
                                onChange={(e) => setMetodoPago(e.target.value)}
                              >
                                <option value="efectivo">Efectivo</option>
                                <option value="tarjeta">Tarjeta</option>
                                <option value="transferencia">Transferencia</option>
                              </select>
                            </div>

                            {/* Resumen */}
                            <div className="ventas-resumen p-3 mb-3">
                              <div className="d-flex justify-content-between mb-2">
                                <span>Precio unitario:</span>
                                <strong>${productoSeleccionado.precio.toFixed(2)}</strong>
                              </div>
                              <div className="d-flex justify-content-between mb-2">
                                <span>Cantidad:</span>
                                <strong>{cantidad}</strong>
                              </div>
                              <hr />
                              <div className="d-flex justify-content-between">
                                <span className="fw-bold">Total:</span>
                                <strong className="ventas-total">${(productoSeleccionado.precio * cantidad).toFixed(2)}</strong>
                              </div>
                            </div>

                            {/* Botón de Venta */}
                            <button
                              className="btn btn-success btn-sm w-100"
                              onClick={realizarVenta}
                            >
                              <i className="fa-solid fa-check me-2"></i>
                              Confirmar Venta
                            </button>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Panel de Resumen */}
              <div className="col-lg-6">
                <div className="card shadow-sm">
                  <div className="card-header bg-success text-white fw-semibold">
                    <i className="fa-solid fa-chart-line me-2"></i>
                    Resumen del Día
                  </div>
                  <div className="card-body">
                    <div className="row g-3 mb-4">
                      <div className="col-6">
                        <div className="ventas-stat">
                          <div className="ventas-stat-label">Total Vendido</div>
                          <div className="ventas-stat-value">${totalVentasHoy.toFixed(2)}</div>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="ventas-stat">
                          <div className="ventas-stat-label">Transacciones</div>
                          <div className="ventas-stat-value">{cantidadVentasHoy}</div>
                        </div>
                      </div>
                    </div>

                    {/* Historial de Ventas */}
                    <h6 className="mb-2">Últimas ventas:</h6>
                    <div className="ventas-historial">
                      {ventasHoy.length === 0 ? (
                        <p className="text-muted text-center py-3">Sin ventas registradas hoy</p>
                      ) : (
                        ventasHoy.map((v, i) => (
                          <div key={i} className="ventas-item">
                            <div className="d-flex justify-content-between align-items-start">
                              <div>
                                <p className="mb-1 fw-semibold">{v.producto}</p>
                                <small className="text-muted">
                                  {v.cantidad} × ${v.precioUnitario.toFixed(2)} - Talla {v.talla.charAt(0).toUpperCase()}
                                </small>
                              </div>
                              <span className="badge bg-primary">${v.total.toFixed(2)}</span>
                            </div>
                            <small className="text-muted">{new Date(v.fecha).toLocaleTimeString('es-MX')}</small>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
    </>
  )
}

export default Ventas
