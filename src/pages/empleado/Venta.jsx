import { useMemo, useState } from 'react'
import { useSancot } from '../../context/SancotContext'
import './Venta.css'

const formApartadoVacio = {
  nombre: '',
  telefono: '',
  anticipo: '',
}

const VISTAS = [
  { id: 'productos', label: 'Productos' },
  { id: 'apartados', label: 'Apartados' },
  { id: 'mayoreos', label: 'Mayoreos' },
]

function Venta() {
  const {
    inventario,
    ventas,
    setVentas,
    agregarVenta,
    apartados,
    setApartados,
    mayoreos,
    setMayoreos,
  } = useSancot()

  const [vista, setVista] = useState('productos')
  const [carrito, setCarrito] = useState([])
  const [paso, setPaso] = useState('seleccion')
  const [metodoPago, setMetodoPago] = useState('')
  const [montoRecibido, setMonto] = useState('')
  const [datosExtra, setDatosExtra] = useState({ terminacion: '', transaccion: '', tipo: 'Debito' })
  const [ventaActiva, setVentaActiva] = useState({ tipo: 'productos', payload: null })
  const [ventaConfirmada, setVentaConfirmada] = useState(null)
  const [mostrarFormApartado, setMostrarFormApartado] = useState(false)
  const [formApartado, setFormApartado] = useState(formApartadoVacio)
  const [productosApartado, setProductosApartado] = useState([])
  const [erroresApartado, setErroresApartado] = useState({})

  const todosProductos = useMemo(
    () => [...inventario.dany, ...inventario.erick],
    [inventario]
  )

  const apartadosPendientes = useMemo(
    () => apartados.filter(ap => !ap.liquidado && !ap.canceladoAuto),
    [apartados]
  )

  const mayoreosPendientes = useMemo(
    () => mayoreos.filter(m => !m.vendido),
    [mayoreos]
  )

  const cantidadSeleccionada = (codigo, talla) =>
    carrito.find(item => item.key === `${codigo}-${talla}`)?.cantidad || 0

  const estaSeleccionado = (codigo, talla) => cantidadSeleccionada(codigo, talla) > 0

  const tallasDisponibles = (producto) => {
    const tallas = []
    if ((producto.stockChica || 0) > 0) tallas.push('Ch')
    if ((producto.stockMediana || 0) > 0) tallas.push('M')
    if ((producto.stockGrande || 0) > 0) tallas.push('G')
    return tallas
  }

  const tallasApartado = (producto) => {
    const tallas = tallasDisponibles(producto)
    return tallas.length > 0 ? tallas : ['Unica']
  }

  const cambiarCantidadProducto = (producto, talla, nuevaCantidad) => {
    const key = `${producto.codigo}-${talla}`
    const actual = carrito.find(item => item.key === key)

    if (nuevaCantidad <= 0) {
      setCarrito(carrito.filter(item => item.key !== key))
      return
    }

    if (actual) {
      setCarrito(carrito.map(item =>
        item.key === key ? { ...item, cantidad: nuevaCantidad } : item
      ))
      return
    }

    setCarrito([
      ...carrito,
      {
        key,
        id_prod: producto.id_prod,
        codigo: producto.codigo,
        producto: producto.producto,
        talla,
        cantidad: nuevaCantidad,
        precio: parseFloat(producto.precio || 0),
      },
    ])
  }

  const actualizarCantidadProducto = (producto, talla, cambio) => {
    const actual = cantidadSeleccionada(producto.codigo, talla)
    cambiarCantidadProducto(producto, talla, actual + cambio)
  }

  const totalProductos = carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0)
  const totalApartado = productosApartado.reduce((acc, item) => acc + item.precio * item.cantidad, 0)
  const anticipoApartado = parseFloat(formApartado.anticipo) || 0
  const restanteApartado = Math.max(0, totalApartado - anticipoApartado)

  const cantidadApartado = (codigo, talla) =>
    productosApartado.find(item => item.key === `${codigo}-${talla}`)?.cantidad || 0

  const apartadoSeleccionado = (codigo, talla) => cantidadApartado(codigo, talla) > 0

  const cambiarCantidadApartado = (producto, talla, nuevaCantidad) => {
    const key = `${producto.codigo}-${talla}`
    const actual = productosApartado.find(item => item.key === key)

    if (nuevaCantidad <= 0) {
      setProductosApartado(productosApartado.filter(item => item.key !== key))
      return
    }

    if (actual) {
      setProductosApartado(productosApartado.map(item =>
        item.key === key ? { ...item, cantidad: nuevaCantidad } : item
      ))
      return
    }

    const responsable = inventario.dany.some(item => item.codigo === producto.codigo) ? 'dany' : 'erick'

    setProductosApartado([
      ...productosApartado,
      {
        key,
        codigo: producto.codigo,
        producto: producto.producto,
        responsable,
        talla,
        cantidad: nuevaCantidad,
        precio: parseFloat(producto.precio || 0),
      },
    ])
  }

  const actualizarCantidadApartado = (producto, talla, cambio) => {
    const actual = cantidadApartado(producto.codigo, talla)
    cambiarCantidadApartado(producto, talla, actual + cambio)
  }

  const resetApartado = () => {
    setFormApartado(formApartadoVacio)
    setProductosApartado([])
    setErroresApartado({})
  }

  const validarApartado = () => {
    const errores = {}
    if (!formApartado.nombre.trim()) errores.nombre = 'Campo requerido.'
    if (!formApartado.telefono.trim()) errores.telefono = 'Campo requerido.'
    if (productosApartado.length === 0) errores.productos = 'Selecciona al menos un producto.'
    if (anticipoApartado <= 0) errores.anticipo = 'Ingresa un anticipo valido.'
    if (anticipoApartado > totalApartado) errores.anticipo = 'El anticipo no puede ser mayor al total.'
    return errores
  }

  const guardarApartado = () => {
    const errores = validarApartado()
    if (Object.keys(errores).length > 0) {
      setErroresApartado(errores)
      return
    }

    setApartados([
      ...apartados,
      {
        nombre: formApartado.nombre.trim(),
        telefono: formApartado.telefono.trim(),
        productos: productosApartado.map(item => `${item.producto} (${item.talla}) x${item.cantidad}`),
        productosDetalle: productosApartado.map(item => ({
          codigo: item.codigo,
          producto: item.producto,
          responsable: item.responsable,
          talla: item.talla,
          cantidad: item.cantidad,
          precio: item.precio,
          subtotal: item.precio * item.cantidad,
        })),
        anticipo: anticipoApartado,
        total: totalApartado,
        restante: restanteApartado,
        fecha: new Date().toISOString(),
        liquidado: false,
        canceladoAuto: false,
      },
    ])

    resetApartado()
    setMostrarFormApartado(false)
  }

  const resumenVenta = useMemo(() => {
    if (ventaActiva.tipo === 'apartado' && ventaActiva.payload) {
      const ap = ventaActiva.payload
      return {
        titulo: `Apartado de ${ap.nombre}`,
        total: ap.restante,
        items: (ap.productos || []).map(prod => ({ label: prod, detalle: 'Liquidacion de apartado' })),
      }
    }

    if (ventaActiva.tipo === 'mayoreo' && ventaActiva.payload) {
      const m = ventaActiva.payload
      return {
        titulo: `Mayoreo de ${m.cliente}`,
        total: m.total,
        items: (m.productos || []).map(prod => ({
          label: prod.producto,
          detalle: [
            prod.stockChica > 0 ? `Ch:${prod.stockChica}` : '',
            prod.stockMediana > 0 ? `M:${prod.stockMediana}` : '',
            prod.stockGrande > 0 ? `G:${prod.stockGrande}` : '',
          ].filter(Boolean).join(' '),
        })),
      }
    }

    return {
      titulo: 'Venta de productos',
      total: totalProductos,
      items: carrito.map(item => ({
        label: item.producto,
        detalle: `${item.talla} x${item.cantidad}`,
      })),
    }
  }, [carrito, totalProductos, ventaActiva])

  const totalActual = resumenVenta.total || 0
  const cambio = Math.max(0, parseFloat(montoRecibido || 0) - totalActual)

  const resetPago = () => {
    setMetodoPago('')
    setMonto('')
    setDatosExtra({ terminacion: '', transaccion: '', tipo: 'Debito' })
  }

  const iniciarCobroProductos = () => {
    if (carrito.length === 0) return
    setVentaActiva({ tipo: 'productos', payload: null })
    resetPago()
    setPaso('metodo')
  }

  const iniciarCobroApartado = (apartado) => {
    setVentaActiva({ tipo: 'apartado', payload: apartado })
    resetPago()
    setPaso('metodo')
  }

  const iniciarCobroMayoreo = (mayoreo) => {
    setVentaActiva({ tipo: 'mayoreo', payload: mayoreo })
    resetPago()
    setPaso('metodo')
  }

  const confirmarVenta = async () => {
    const ventaNueva = {
      productos: resumenVenta.items.map(item =>
        `${item.label}${item.detalle ? ` (${item.detalle})` : ''}`
      ),
      total: totalActual,
      metodoPago,
      fecha: new Date().toISOString(),
      origen: ventaActiva.tipo,
      datosExtra:
        metodoPago === 'Efectivo'
          ? {
              montoRecibido: parseFloat(montoRecibido || 0),
              cambio,
            }
          : datosExtra,
    }

    try {

      // ===============================
      // CONEXION A FLASK + MYSQL
      // ===============================

      await agregarVenta({
      total: totalActual,

      metodoPago: metodoPago,

      datosExtra:
        metodoPago === 'Efectivo'
          ? {
              montoRecibido: parseFloat(montoRecibido || 0),
              cambio,
            }
          : metodoPago === 'Tarjeta'
          ? {
              tipo: datosExtra.tipo,
              terminacion: datosExtra.terminacion,
              transaccion: datosExtra.transaccion,
            }
          : {
              transaccion: datosExtra.transaccion,
              referencia: datosExtra.terminacion,
            },

      carrito: carrito.map(item => ({
        id_prod: item.id_prod,
        talla: item.talla,
        cantidad: item.cantidad,
        precio: item.precio
      }))
    })

      console.log('Venta guardada en MySQL')

      setVentaConfirmada({
        total: totalActual,
        metodoPago,
        origen: ventaActiva.tipo,
      })

      setVentas([...ventas, ventaNueva])

      if (ventaActiva.tipo === 'apartado' && ventaActiva.payload) {
        setApartados(apartados.map(ap =>
          ap === ventaActiva.payload
            ? { ...ap, restante: 0, liquidado: true }
            : ap
        ))
      }

      if (ventaActiva.tipo === 'mayoreo' && ventaActiva.payload) {
        setMayoreos(mayoreos.map(m =>
          m === ventaActiva.payload
            ? { ...m, vendido: true, fechaVenta: new Date().toISOString() }
            : m
        ))
      }

      if (ventaActiva.tipo === 'productos') {
        setCarrito([])
      }

      setPaso('confirmado')

    } catch (error) {

      console.error('ERROR AL GUARDAR VENTA:', error)

      alert('No se pudo guardar la venta')
    }
  }

  const nuevaVenta = () => {
    setCarrito([])
    setVentaActiva({ tipo: 'productos', payload: null })
    setVentaConfirmada(null)
    resetPago()
    setVista('productos')
    setPaso('seleccion')
  }

  if (paso === 'seleccion') {
    return (
      <div className="venta-wrap">
        <h5 className="venta-titulo">Nueva venta</h5>

        <div className="venta-secciones-tabs">
          {VISTAS.map(item => (
            <button
              key={item.id}
              className={`venta-seccion-tab ${vista === item.id ? 'active' : ''}`}
              onClick={() => setVista(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {vista === 'productos' && (
          <>
            {todosProductos.length === 0 ? (
              <div className="venta-empty">
                Sin productos en inventario. Agrega primero en el modulo Inventario.
              </div>
            ) : (
              <div className="productos-lista">
                {todosProductos.map(producto => {
                  const tallas = tallasDisponibles(producto)
                  console.log(producto)
                  const tieneTallas = tallas.length > 0
                  return (
                    <div
                      key={producto.codigo}
                      className={`producto-row ${carrito.some(item => item.codigo === producto.codigo) ? 'en-carrito' : ''}`}
                    >
                      <div className="prod-avatar">{producto.producto.charAt(0)}</div>
                      <div className="prod-info">
                        <span className="prod-nombre">{producto.producto}</span>
                        <span className="prod-codigo">{producto.codigo}</span>
                      </div>
                      <span className="prod-precio">${parseFloat(producto.precio || 0).toFixed(2)}</span>
                      <div className="tallas-wrap">
                        {tieneTallas ? tallas.map(talla => (
                          <div key={talla} className="talla-item">
                            <button
                              className={`talla-btn ${estaSeleccionado(producto.codigo, talla) ? 'sel' : ''}`}
                              onClick={() => cambiarCantidadProducto(producto, talla, estaSeleccionado(producto.codigo, talla) ? 0 : 1)}
                            >
                              {talla}
                            </button>
                            <div className="cantidad-inline">
                              <button className="cantidad-btn" onClick={() => actualizarCantidadProducto(producto, talla, -1)}>-</button>
                              <span className="cantidad-value">{cantidadSeleccionada(producto.codigo, talla)}</span>
                              <button className="cantidad-btn" onClick={() => actualizarCantidadProducto(producto, talla, 1)}>+</button>
                            </div>
                          </div>
                        )) : (
                          <div className="talla-item">
                            <button
                              className={`talla-btn ${estaSeleccionado(producto.codigo, 'Unica') ? 'sel' : ''}`}
                              onClick={() => cambiarCantidadProducto(producto, 'Unica', estaSeleccionado(producto.codigo, 'Unica') ? 0 : 1)}
                            >
                              Unica
                            </button>
                            <div className="cantidad-inline">
                              <button className="cantidad-btn" onClick={() => actualizarCantidadProducto(producto, 'Unica', -1)}>-</button>
                              <span className="cantidad-value">{cantidadSeleccionada(producto.codigo, 'Unica')}</span>
                              <button className="cantidad-btn" onClick={() => actualizarCantidadProducto(producto, 'Unica', 1)}>+</button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {carrito.length > 0 && (
              <div className="carrito-resumen">
                <div className="carrito-items">
                  {carrito.map(item => (
                    <div className="carrito-item" key={item.key}>
                      <span>{item.producto} <span className="talla-tag">({item.talla}) x{item.cantidad}</span></span>
                      <span>${(item.precio * item.cantidad).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="carrito-total">
                  <span>Total ({carrito.length} articulo{carrito.length !== 1 ? 's' : ''})</span>
                  <span>${totalProductos.toFixed(2)}</span>
                </div>
              </div>
            )}

            <button className="pagar-btn" disabled={carrito.length === 0} onClick={iniciarCobroProductos}>
              PAGAR ${totalProductos.toFixed(2)}
            </button>
          </>
        )}

        {vista === 'apartados' && (
          <div className="venta-listado-especial">
            <div className="apartado-empleado-header">
              <div>
                <span className="apartado-empleado-title">Apartados</span>
                <span className="apartado-empleado-sub">Crear nuevos o cobrar pendientes</span>
              </div>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  resetApartado()
                  setMostrarFormApartado(!mostrarFormApartado)
                }}
              >
                {mostrarFormApartado ? 'Cerrar' : '+ Nuevo apartado'}
              </button>
            </div>

            {mostrarFormApartado && (
              <div className="apartado-form">
                <div className="apartado-form-grid">
                  <div className="form-campo">
                    <label>Nombre del cliente</label>
                    <input
                      className={erroresApartado.nombre ? 'input-error' : ''}
                      type="text"
                      value={formApartado.nombre}
                      onChange={(e) => setFormApartado({ ...formApartado, nombre: e.target.value })}
                      placeholder="Nombre completo"
                    />
                    {erroresApartado.nombre && <span className="campo-error">{erroresApartado.nombre}</span>}
                  </div>

                  <div className="form-campo">
                    <label>Telefono</label>
                    <input
                      className={erroresApartado.telefono ? 'input-error' : ''}
                      type="text"
                      value={formApartado.telefono}
                      onChange={(e) => setFormApartado({ ...formApartado, telefono: e.target.value })}
                      placeholder="Ej: 4421234567"
                    />
                    {erroresApartado.telefono && <span className="campo-error">{erroresApartado.telefono}</span>}
                  </div>
                </div>

                <div className="apartado-productos-box">
                  <div className="apartado-section-title">Productos del inventario</div>
                  {todosProductos.length === 0 ? (
                    <div className="venta-empty">Sin productos en inventario. Agrega primero en Inventario.</div>
                  ) : (
                    <div className={`apartado-productos-grid ${erroresApartado.productos ? 'input-error' : ''}`}>
                      {inventario.dany.length > 0 && <span className="apartado-grupo apartado-grupo-dany">Dany (01)</span>}
                      {inventario.dany.map(producto => (
                        <div
                          key={producto.codigo}
                          className={`apartado-producto ${productosApartado.some(item => item.codigo === producto.codigo) ? 'active' : ''}`}
                        >
                          <div className="apartado-producto-main">
                            <span>{producto.producto}</span>
                            <strong>${parseFloat(producto.precio || 0).toFixed(2)}</strong>
                          </div>
                          <span className="apartado-producto-codigo">{producto.codigo}</span>
                          <div className="apartado-tallas">
                            {tallasApartado(producto).map(talla => (
                              <div key={`${producto.codigo}-${talla}`} className="apartado-talla-control">
                                <button
                                  className={`talla-btn ${apartadoSeleccionado(producto.codigo, talla) ? 'sel' : ''}`}
                                  onClick={() => cambiarCantidadApartado(producto, talla, apartadoSeleccionado(producto.codigo, talla) ? 0 : 1)}
                                >
                                  {talla}
                                </button>
                                <div className="cantidad-inline">
                                  <button className="cantidad-btn" onClick={() => actualizarCantidadApartado(producto, talla, -1)}>-</button>
                                  <span className="cantidad-value">{cantidadApartado(producto.codigo, talla)}</span>
                                  <button className="cantidad-btn" onClick={() => actualizarCantidadApartado(producto, talla, 1)}>+</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}

                      {inventario.erick.length > 0 && <span className="apartado-grupo apartado-grupo-erick">Erick (20)</span>}
                      {inventario.erick.map(producto => (
                        <div
                          key={producto.codigo}
                          className={`apartado-producto apartado-producto-erick ${productosApartado.some(item => item.codigo === producto.codigo) ? 'active' : ''}`}
                        >
                          <div className="apartado-producto-main">
                            <span>{producto.producto}</span>
                            <strong>${parseFloat(producto.precio || 0).toFixed(2)}</strong>
                          </div>
                          <span className="apartado-producto-codigo">{producto.codigo}</span>
                          <div className="apartado-tallas">
                            {tallasApartado(producto).map(talla => (
                              <div key={`${producto.codigo}-${talla}`} className="apartado-talla-control">
                                <button
                                  className={`talla-btn ${apartadoSeleccionado(producto.codigo, talla) ? 'sel' : ''}`}
                                  onClick={() => cambiarCantidadApartado(producto, talla, apartadoSeleccionado(producto.codigo, talla) ? 0 : 1)}
                                >
                                  {talla}
                                </button>
                                <div className="cantidad-inline">
                                  <button className="cantidad-btn" onClick={() => actualizarCantidadApartado(producto, talla, -1)}>-</button>
                                  <span className="cantidad-value">{cantidadApartado(producto.codigo, talla)}</span>
                                  <button className="cantidad-btn" onClick={() => actualizarCantidadApartado(producto, talla, 1)}>+</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {erroresApartado.productos && <span className="campo-error">{erroresApartado.productos}</span>}
                </div>

                {productosApartado.length > 0 && (
                  <div className="carrito-resumen">
                    <div className="carrito-items">
                      {productosApartado.map(item => (
                        <div className="carrito-item" key={item.key}>
                          <span>{item.producto} <span className="talla-tag">({item.talla}) x{item.cantidad}</span></span>
                          <span>${(item.precio * item.cantidad).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="carrito-total">
                      <span>Total</span>
                      <span>${totalApartado.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                <div className="apartado-form-grid">
                  <div className="form-campo">
                    <label>Anticipo ($)</label>
                    <input
                      className={erroresApartado.anticipo ? 'input-error' : ''}
                      type="number"
                      min="0"
                      step="0.01"
                      value={formApartado.anticipo}
                      onChange={(e) => setFormApartado({ ...formApartado, anticipo: e.target.value })}
                      placeholder="0.00"
                    />
                    {erroresApartado.anticipo && <span className="campo-error">{erroresApartado.anticipo}</span>}
                  </div>

                  <div className="apartado-restante">
                    <span>Restante</span>
                    <strong>${restanteApartado.toFixed(2)}</strong>
                  </div>
                </div>

                <button className="pagar-btn" onClick={guardarApartado}>
                  Guardar apartado
                </button>
              </div>
            )}

            {apartadosPendientes.length === 0 ? (
              <div className="venta-empty">No hay apartados pendientes por liquidar.</div>
            ) : (
              apartadosPendientes.map((apartado, idx) => (
                <div key={`${apartado.nombre}-${idx}`} className="venta-especial-card">
                  <div>
                    <div className="venta-especial-titulo">{apartado.nombre}</div>
                    <div className="venta-especial-sub">{apartado.telefono}</div>
                    <div className="venta-especial-tags">
                      {(apartado.productos || []).map((producto, index) => (
                        <span key={`${producto}-${index}`} className="venta-tag">{producto}</span>
                      ))}
                    </div>
                  </div>
                  <div className="venta-especial-side">
                    <strong>${(apartado.restante || 0).toFixed(2)}</strong>
                    <button className="btn btn-primary btn-sm" onClick={() => iniciarCobroApartado(apartado)}>
                      Cobrar restante
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {vista === 'mayoreos' && (
          <div className="venta-listado-especial">
            {mayoreosPendientes.length === 0 ? (
              <div className="venta-empty">No hay mayoreos pendientes por cobrar.</div>
            ) : (
              mayoreosPendientes.map((mayoreo, idx) => (
                <div key={`${mayoreo.cliente}-${idx}`} className="venta-especial-card">
                  <div>
                    <div className="venta-especial-titulo">{mayoreo.cliente}</div>
                    <div className="venta-especial-sub">{mayoreo.telefono || 'Sin telefono'}</div>
                    <div className="venta-especial-tags">
                      {(mayoreo.productos || []).map((producto, index) => (
                        <span key={`${producto.producto}-${index}`} className="venta-tag">
                          {producto.producto}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="venta-especial-side">
                    <strong>${parseFloat(mayoreo.total || 0).toFixed(2)}</strong>
                    <button className="btn btn-primary btn-sm" onClick={() => iniciarCobroMayoreo(mayoreo)}>
                      Registrar venta
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    )
  }

  if (paso === 'metodo') {
    return (
      <div className="venta-wrap">
        <div className="paso-header">
          <button className="btn-back" onClick={() => setPaso('seleccion')}>Volver</button>
          <h5 className="venta-titulo">Metodo de pago</h5>
        </div>

        <div className="total-display">
          <span className="total-label">{resumenVenta.titulo}</span>
          <span className="total-monto">${totalActual.toFixed(2)}</span>
        </div>

        <div className="carrito-resumen">
          <div className="carrito-items">
            {resumenVenta.items.map((item, idx) => (
              <div className="carrito-item" key={`${item.label}-${idx}`}>
                <span>{item.label} <span className="talla-tag">{item.detalle}</span></span>
                <span></span>
              </div>
            ))}
          </div>
        </div>

        <div className="metodos-grid">
          {[
            { id: 'Efectivo', icono: 'E', desc: 'Pago en efectivo' },
            { id: 'Tarjeta', icono: 'T', desc: 'Debito o credito' },
            { id: 'Transferencia', icono: 'S', desc: 'SPEI o transferencia' },
          ].map(item => (
            <div
              key={item.id}
              className={`metodo-card ${metodoPago === item.id ? 'sel' : ''}`}
              onClick={() => setMetodoPago(item.id)}
            >
              <span className="metodo-icono">{item.icono}</span>
              <span className="metodo-nombre">{item.id}</span>
              <span className="metodo-desc">{item.desc}</span>
            </div>
          ))}
        </div>

        <button className="pagar-btn" disabled={!metodoPago} onClick={() => setPaso(metodoPago.toLowerCase())}>
          Continuar con {metodoPago || '...'}
        </button>
      </div>
    )
  }

  if (paso === 'efectivo') {
    return (
      <div className="venta-wrap">
        <div className="paso-header">
          <button className="btn-back" onClick={() => setPaso('metodo')}>Volver</button>
          <h5 className="venta-titulo">Pago en efectivo</h5>
        </div>

        <div className="total-display">
          <span className="total-label">Total a pagar</span>
          <span className="total-monto">${totalActual.toFixed(2)}</span>
        </div>

        <div className="efectivo-wrap">
          <div className="teclado">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'B', '0', '.'].map(key => (
              <button
                key={key}
                className="tecla"
                onClick={() => {
                  if (key === 'B') {
                    setMonto(prev => prev.slice(0, -1))
                    return
                  }
                  setMonto(prev => {
                    if (key === '.' && prev.includes('.')) return prev
                    return prev + key
                  })
                }}
              >
                {key === 'B' ? 'Borrar' : key}
              </button>
            ))}
          </div>

          <div className="efectivo-resumen">
            <div className="ef-row">
              <span>Recibido</span>
              <span className="ef-monto">${parseFloat(montoRecibido || 0).toFixed(2)}</span>
            </div>
            <div className="ef-row">
              <span>Total</span>
              <span>${totalActual.toFixed(2)}</span>
            </div>
            <div className="ef-row cambio">
              <span>Cambio</span>
              <span className="ef-cambio">${cambio.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <button className="pagar-btn" disabled={parseFloat(montoRecibido || 0) < totalActual} onClick={confirmarVenta}>
          Confirmar pago
        </button>
      </div>
    )
  }

  if (paso === 'tarjeta') {
    return (
      <div className="venta-wrap">
        <div className="paso-header">
          <button className="btn-back" onClick={() => setPaso('metodo')}>Volver</button>
          <h5 className="venta-titulo">Pago con tarjeta</h5>
        </div>

        <div className="total-display">
          <span className="total-label">Total a cobrar</span>
          <span className="total-monto">${totalActual.toFixed(2)}</span>
        </div>

        <div className="form-extra">
          <div className="form-campo">
            <label>Terminacion de tarjeta</label>
            <input
              type="text"
              maxLength={4}
              placeholder="Ej: 4521"
              value={datosExtra.terminacion}
              onChange={(e) => setDatosExtra({ ...datosExtra, terminacion: e.target.value })}
            />
          </div>
          <div className="form-campo">
            <label>Numero de transaccion</label>
            <input
              type="text"
              placeholder="Ej: TXN-00123456"
              value={datosExtra.transaccion}
              onChange={(e) => setDatosExtra({ ...datosExtra, transaccion: e.target.value })}
            />
          </div>
          <div className="form-campo">
            <label>Tipo de tarjeta</label>
            <div className="tipo-btns">
              {['Debito', 'Credito'].map(tipo => (
                <button
                  key={tipo}
                  className={`tipo-btn ${datosExtra.tipo === tipo ? 'sel' : ''}`}
                  onClick={() => setDatosExtra({ ...datosExtra, tipo })}
                >
                  {tipo}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button className="pagar-btn" disabled={!datosExtra.terminacion || !datosExtra.transaccion} onClick={confirmarVenta}>
          Confirmar pago
        </button>
      </div>
    )
  }

  if (paso === 'transferencia') {
    return (
      <div className="venta-wrap">
        <div className="paso-header">
          <button className="btn-back" onClick={() => setPaso('metodo')}>Volver</button>
          <h5 className="venta-titulo">Transferencia</h5>
        </div>

        <div className="total-display">
          <span className="total-label">Total a recibir</span>
          <span className="total-monto">${totalActual.toFixed(2)}</span>
        </div>

        <div className="form-extra">
          <div className="form-campo">
            <label>Numero de transaccion</label>
            <input
              type="text"
              placeholder="Ej: SPEI-00123456"
              value={datosExtra.transaccion}
              onChange={(e) => setDatosExtra({ ...datosExtra, transaccion: e.target.value })}
            />
          </div>
          <div className="form-campo">
            <label>Confirmacion o referencia</label>
            <input
              type="text"
              placeholder="Ej: REF-789"
              value={datosExtra.terminacion}
              onChange={(e) => setDatosExtra({ ...datosExtra, terminacion: e.target.value })}
            />
          </div>
        </div>

        <button className="pagar-btn" disabled={!datosExtra.transaccion} onClick={confirmarVenta}>
          Confirmar transferencia
        </button>
      </div>
    )
  }

  return (
    <div className="venta-wrap confirmado-wrap">
      <div className="confirmado-icono">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="24" r="22" stroke="#1D9E75" strokeWidth="2" />
          <path d="M14 24l7 7 13-13" stroke="#1D9E75" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h5 className="confirmado-titulo">Venta registrada</h5>
      <p className="confirmado-sub">La venta se guardo correctamente.</p>

      <div className="confirmado-resumen">
        <div className="cf-row">
          <span>Total cobrado</span>
          <span className="cf-valor">${parseFloat(ventaConfirmada?.total || 0).toFixed(2)}</span>
        </div>
        <div className="cf-row">
          <span>Metodo</span>
          <span className="cf-valor">{ventaConfirmada?.metodoPago || metodoPago}</span>
        </div>
        <div className="cf-row">
          <span>Origen</span>
          <span className="cf-valor">{ventaConfirmada?.origen || ventaActiva.tipo}</span>
        </div>
      </div>

      <button className="pagar-btn" onClick={nuevaVenta}>Nueva venta</button>
    </div>
  )
}

export default Venta
