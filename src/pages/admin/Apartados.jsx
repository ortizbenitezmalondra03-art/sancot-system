import { useEffect, useMemo, useState } from 'react'
import { useSancot } from '../../context/SancotContext'
import './Apartados.css'

const formVacio = { nombre: '', telefono: '', anticipo: '' }

function diasHabilesTranscurridos(fechaISO) {
  const inicio = new Date(fechaISO)
  const hoy = new Date()
  let dias = 0
  const cur = new Date(inicio)
  while (cur <= hoy) {
    const dow = cur.getDay()
    if (dow !== 0 && dow !== 6) dias++
    cur.setDate(cur.getDate() + 1)
  }
  return Math.max(0, dias - 1)
}

function fechaLimite(fechaISO) {
  const cur = new Date(fechaISO)
  let diasContados = 0
  while (diasContados < 10) {
    cur.setDate(cur.getDate() + 1)
    if (cur.getDay() !== 0 && cur.getDay() !== 6) diasContados++
  }
  cur.setHours(23, 0, 0, 0)
  return cur
}

function getEstado(apartado) {
  if (apartado.liquidado) return 'liquidado'
  const limite = fechaLimite(apartado.fecha)
  const dias = diasHabilesTranscurridos(apartado.fecha)
  if (new Date() >= limite) return 'cancelado'
  if (dias >= 9) return 'por vencer'
  return 'activo'
}

function tallaLabel(talla) {
  if (talla === 'Ch') return 'Chica'
  if (talla === 'M') return 'Mediana'
  if (talla === 'G') return 'Grande'
  return 'Unica'
}

function stockKeyFromTalla(talla) {
  if (talla === 'Ch') return 'stockChica'
  if (talla === 'M') return 'stockMediana'
  if (talla === 'G') return 'stockGrande'
  return null
}

function tallasDisponibles(producto) {
  const tallas = []
  if ((producto.stockChica || 0) > 0) tallas.push('Ch')
  if ((producto.stockMediana || 0) > 0) tallas.push('M')
  if ((producto.stockGrande || 0) > 0) tallas.push('G')
  return tallas.length > 0 ? tallas : ['Unica']
}

function Apartados() {
  // ── Una sola línea de useSancot ──────────────────────────
  const {
    apartados, setApartados,
    inventario, setInventario,
    agregarApartado, eliminarApartado, actualizarApartado,
  } = useSancot()

  const [modalAbierto, setModalAbierto] = useState(false)
  const [form, setForm]                 = useState(formVacio)
  const [seleccionados, setSeleccionados] = useState([])
  const [errores, setErrores]           = useState([])

  const todosProductos = useMemo(
    () => [...inventario.dany, ...inventario.erick],
    [inventario]
  )

  const cantidadSeleccionada = (codigo, talla) =>
    seleccionados.find(item => item.key === `${codigo}-${talla}`)?.cantidad || 0

  const estaSeleccionado = (codigo, talla) => cantidadSeleccionada(codigo, talla) > 0

  const cambiarCantidadProducto = (producto, talla, nuevaCantidad) => {
    const key = `${producto.codigo}-${talla}`
    const actual = seleccionados.find(item => item.key === key)

    if (nuevaCantidad <= 0) {
      setSeleccionados(prev => prev.filter(item => item.key !== key))
      return
    }

    if (actual) {
      setSeleccionados(prev => prev.map(item =>
        item.key === key ? { ...item, cantidad: nuevaCantidad } : item
      ))
      return
    }

    const responsable = inventario.dany.some(item => item.codigo === producto.codigo) ? 'dany' : 'erick'

    setSeleccionados(prev => [...prev, {
      key,
      codigo:      producto.codigo,
      id_prod:     producto.id_prod,   // ← necesario para guardar en BD
      producto:    producto.producto,
      responsable,
      talla,
      cantidad:    nuevaCantidad,
      precio:      parseFloat(producto.precio || 0),
    }])
  }

  const actualizarCantidadProducto = (producto, talla, cambio) => {
    const actual = cantidadSeleccionada(producto.codigo, talla)
    cambiarCantidadProducto(producto, talla, actual + cambio)
  }

  const totalCalculado = seleccionados.reduce(
    (sum, item) => sum + (item.precio * item.cantidad), 0
  )
  const anticipo = parseFloat(form.anticipo) || 0
  const restante = Math.max(0, totalCalculado - anticipo)

  useEffect(() => {
    const revisar = () => {
      const actualizados = apartados.map(ap => ({
        ...ap,
        canceladoAuto: !ap.liquidado && new Date() >= fechaLimite(ap.fecha),
      }))
      const hayCambios = actualizados.some(
        (ap, i) => ap.canceladoAuto !== apartados[i]?.canceladoAuto
      )
      if (hayCambios) setApartados(actualizados)
    }
    revisar()
    const intervalo = setInterval(revisar, 60000)
    return () => clearInterval(intervalo)
  }, [apartados, setApartados])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const validar = () => {
    const errs = {}
    if (!form.nombre.trim())   errs.nombre    = 'Campo requerido.'
    if (!form.telefono.trim()) errs.telefono  = 'Campo requerido.'
    if (seleccionados.length === 0) errs.productos = 'Selecciona al menos un producto con talla.'
    if (anticipo <= 0)         errs.anticipo  = 'Ingresa un anticipo valido.'
    return errs
  }

  // ── Guardar → llama a la API ──────────────────────────────
  const guardar = async () => {
    const errs = validar()
    if (Object.keys(errs).length > 0) { setErrores(errs); return }

    await agregarApartado({
      nombre:           form.nombre.trim(),
      telefono:         form.telefono.trim(),
      anticipo,
      total:            totalCalculado,
      productosDetalle: seleccionados.map(item => ({
        id_prod:  item.id_prod,
        talla:    item.talla,
        cantidad: item.cantidad,
        precio:   item.precio,
      })),
    })

    setModalAbierto(false)
    setForm(formVacio)
    setSeleccionados([])
    setErrores({})
  }

  // ── Liquidar ──────────────────────────────────────────────
  const liquidar = async (idx) => {
    const ap = apartados[idx]
    if (!ap || ap.liquidado) return
    await actualizarApartado(ap.id_apart, { anticipo: ap.anticipo, estado: 'liquidado' })
  }

  // ── Eliminar ──────────────────────────────────────────────
  const eliminar = async (idx) => {
    const ap = apartados[idx]
    if (ap.id_apart) {
      await eliminarApartado(ap.id_apart)
    } else {
      setApartados(apartados.filter((_, i) => i !== idx))
    }
  }

  const porVencer = apartados.filter(ap => getEstado(ap) === 'por vencer')
  const cancelados = apartados.filter(ap => getEstado(ap) === 'cancelado')

  const BadgeEstado = ({ estado }) => {
    const map = {
      activo:       { cls: 'bg-success',              label: 'Activo'      },
      'por vencer': { cls: 'bg-warning text-dark',    label: 'Por vencer'  },
      cancelado:    { cls: 'bg-danger',               label: 'Cancelado'   },
      liquidado:    { cls: 'bg-primary',              label: 'Liquidado'   },
    }
    const { cls, label } = map[estado] || map.activo
    return <span className={`badge ${cls}`} style={{ fontWeight: 400 }}>{label}</span>
  }

  return (
    <>
      <h5 className="mb-3">Apartados</h5>

      {porVencer.length > 0 && (
        <div className="alert alert-warning py-2 mb-3" style={{ fontSize: '13px' }}>
          <strong>{porVencer.length} apartado(s)</strong> vencen pronto. Contacta al cliente.
        </div>
      )}
      {cancelados.length > 0 && (
        <div className="alert alert-danger py-2 mb-3" style={{ fontSize: '13px' }}>
          <strong>{cancelados.length} apartado(s)</strong> cancelados por superar los 10 dias habiles.
        </div>
      )}

      <button
        className="btn btn-primary btn-sm mb-3"
        onClick={() => { setForm(formVacio); setSeleccionados([]); setErrores({}); setModalAbierto(true) }}
      >
        + Agregar apartado
      </button>

      <div className="table-responsive">
        <table className="table table-bordered table-sm align-middle">
          <thead className="table-light">
            <tr>
              <th>Nombre</th>
              <th>Telefono</th>
              <th>Productos</th>
              <th>Anticipo</th>
              <th>Total</th>
              <th>Restante</th>
              <th>Fecha</th>
              <th>Dias hab.</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {apartados.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center text-muted py-3">Sin apartados registrados.</td>
              </tr>
            ) : (
              apartados.map((ap, i) => {
                const dias   = diasHabilesTranscurridos(ap.fecha)
                const estado = getEstado(ap)
                const limite = fechaLimite(ap.fecha)
                return (
                  <tr key={ap.id_apart || i}
                    className={
                      estado === 'cancelado'   ? 'apartados-table-row-cancelado' :
                      estado === 'por vencer'  ? 'apartados-table-row-por-vencer' : ''
                    }
                  >
                    <td>{ap.nombre}</td>
                    <td>{ap.telefono}</td>
                    <td style={{ fontSize: '11px' }}>
                      {(ap.productos || []).map((producto, j) => (
                        <span key={j} className="badge bg-primary me-1"
                          style={{ fontWeight: 400, fontSize: '10px' }}>
                          {typeof producto === 'string' ? producto : producto.producto || producto.nombre}
                        </span>
                      ))}
                    </td>
                    <td>${parseFloat(ap.anticipo || 0).toFixed(2)}</td>
                    <td>${parseFloat(ap.total || ap.total_ap || 0).toFixed(2)}</td>
                    <td style={{
                      color: parseFloat(ap.restante) === 0 ? '#1D9E75' : 'inherit',
                      fontWeight: parseFloat(ap.restante) === 0 ? 500 : 400,
                    }}>
                      {parseFloat(ap.restante) === 0 ? 'Liquidado' : `$${parseFloat(ap.restante || 0).toFixed(2)}`}
                    </td>
                    <td style={{ fontSize: '11px' }}>
                      {new Date(ap.fecha).toLocaleDateString('es-MX')}
                    </td>
                    <td className="text-center">
                      <div style={{ fontSize: '11px', marginBottom: '3px' }}>{dias}/10</div>
                      <div style={{ height: '4px', borderRadius: '2px', background: '#e9ecef', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${Math.min((dias / 10) * 100, 100)}%`,
                          background: dias >= 9 ? '#E24B4A' : dias >= 7 ? '#EF9F27' : '#1D9E75',
                          transition: 'width .3s',
                        }} />
                      </div>
                      <div style={{ fontSize: '10px', color: '#aaa', marginTop: '2px' }}>
                        Limite: {limite.toLocaleDateString('es-MX')} 23:00
                      </div>
                    </td>
                    <td><BadgeEstado estado={estado} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {(estado === 'activo' || estado === 'por vencer') && (
                          <button className="btn btn-outline-success btn-sm"
                            style={{ fontSize: '11px', padding: '2px 7px' }}
                            onClick={() => liquidar(i)}>
                            Liquidar
                          </button>
                        )}
                        <button className="btn btn-outline-danger btn-sm"
                          style={{ fontSize: '11px', padding: '2px 7px' }}
                          onClick={() => eliminar(i)}>
                          X
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {modalAbierto && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={(e) => e.target === e.currentTarget && setModalAbierto(false)}>
          <div className="modal-dialog apartados-modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h6 className="modal-title">Agregar apartado</h6>
                <button className="btn-close" onClick={() => setModalAbierto(false)} />
              </div>

              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Nombre del cliente</label>
                  <input
                    className={`form-control form-control-sm ${errores.nombre ? 'is-invalid' : ''}`}
                    type="text" name="nombre" value={form.nombre}
                    onChange={handleChange} placeholder="Nombre completo" autoFocus
                  />
                  {errores.nombre && <div className="invalid-feedback">{errores.nombre}</div>}
                </div>

                <div className="mb-3">
                  <label className="form-label">Telefono</label>
                  <input
                    className={`form-control form-control-sm ${errores.telefono ? 'is-invalid' : ''}`}
                    type="text" name="telefono" value={form.telefono}
                    onChange={handleChange} placeholder="Ej: 4421234567"
                  />
                  {errores.telefono && <div className="invalid-feedback">{errores.telefono}</div>}
                </div>

                <div className="mb-3">
                  <label className="form-label">Productos del inventario</label>
                  {todosProductos.length === 0 ? (
                    <div className="text-muted p-2 border rounded" style={{ fontSize: '12px' }}>
                      Sin productos en inventario. Agrega primero en Inventario.
                    </div>
                  ) : (
                    <div className={`border rounded p-2 apartados-productos-grid ${errores.productos ? 'border-danger' : ''}`}>
                      {inventario.dany.length > 0 && (
                        <>
                          <div className="apartados-grupo-label apartados-grupo-dany">Dany (01)</div>
                          {inventario.dany.map(producto => (
                            <div key={producto.codigo}
                              className={`apartados-producto-item ${seleccionados.some(item => item.codigo === producto.codigo) ? 'active' : ''}`}>
                              <div style={{ fontWeight: 500 }}>{producto.producto}</div>
                              <div style={{ fontSize: '10px', opacity: 0.7 }}>
                                {producto.codigo} · ${parseFloat(producto.precio || 0).toFixed(2)}
                              </div>
                              <div className="apartados-tallas-wrap">
                                {tallasDisponibles(producto).map(talla => (
                                  <div key={`${producto.codigo}-${talla}`} className="apartados-talla-item">
                                    <button type="button"
                                      className={`apartados-talla-btn ${estaSeleccionado(producto.codigo, talla) ? 'active' : ''}`}
                                      onClick={() => cambiarCantidadProducto(producto, talla, estaSeleccionado(producto.codigo, talla) ? 0 : 1)}>
                                      {talla}
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                      {inventario.erick.length > 0 && (
                        <>
                          <div className="apartados-grupo-label apartados-grupo-erick">Erick (20)</div>
                          {inventario.erick.map(producto => (
                            <div key={producto.codigo}
                              className={`apartados-producto-item apartados-producto-item-erick ${seleccionados.some(item => item.codigo === producto.codigo) ? 'active' : ''}`}>
                              <div style={{ fontWeight: 500 }}>{producto.producto}</div>
                              <div style={{ fontSize: '10px', opacity: 0.7 }}>
                                {producto.codigo} · ${parseFloat(producto.precio || 0).toFixed(2)}
                              </div>
                              <div className="apartados-tallas-wrap">
                                {tallasDisponibles(producto).map(talla => (
                                  <div key={`${producto.codigo}-${talla}`} className="apartados-talla-item">
                                    <button type="button"
                                      className={`apartados-talla-btn ${estaSeleccionado(producto.codigo, talla) ? 'active' : ''}`}
                                      onClick={() => cambiarCantidadProducto(producto, talla, estaSeleccionado(producto.codigo, talla) ? 0 : 1)}>
                                      {talla}
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                  {errores.productos && (
                    <div className="text-danger" style={{ fontSize: '12px', marginTop: '4px' }}>
                      {errores.productos}
                    </div>
                  )}
                </div>

                {seleccionados.length > 0 && (
                  <div className="mb-3 p-2 rounded" style={{ background: '#f8f9fa', fontSize: '12px', border: '1px solid #e9ecef' }}>
                    {seleccionados.map(item => (
                      <div key={item.key} className="d-flex justify-content-between align-items-center gap-2 apartado-resumen-item">
                        <div>
                          <div>{item.producto} <span className="apartado-talla-tag">({tallaLabel(item.talla)})</span></div>
                          <div className="apartados-cantidad-inline">
                            <button type="button" className="apartados-cantidad-btn"
                              onClick={() => actualizarCantidadProducto(item, item.talla, -1)}>-</button>
                            <span className="apartados-cantidad-value">{item.cantidad}</span>
                            <button type="button" className="apartados-cantidad-btn"
                              onClick={() => actualizarCantidadProducto(item, item.talla, 1)}>+</button>
                          </div>
                        </div>
                        <span>${(item.precio * item.cantidad).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="d-flex justify-content-between fw-semibold mt-1 pt-1" style={{ borderTop: '1px solid #dee2e6' }}>
                      <span>Total</span>
                      <span>${totalCalculado.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                <div className="mb-3">
                  <label className="form-label">Anticipo ($)</label>
                  <input
                    className={`form-control form-control-sm ${errores.anticipo ? 'is-invalid' : ''}`}
                    type="number" name="anticipo" value={form.anticipo}
                    onChange={handleChange} placeholder="0.00" min="0" step="0.01"
                  />
                  {errores.anticipo && <div className="invalid-feedback">{errores.anticipo}</div>}
                </div>

                <div className="mb-3">
                  <label className="form-label">Total ($)</label>
                  <input className="form-control form-control-sm" type="number"
                    value={totalCalculado.toFixed(2)} readOnly
                    style={{ background: '#f8f9fa', color: '#555' }} />
                  <small className="text-muted" style={{ fontSize: '11px' }}>
                    Calculado automaticamente segun productos, tallas y cantidades.
                  </small>
                </div>

                <div className="mb-3">
                  <label className="form-label">Restante ($)</label>
                  <input className="form-control form-control-sm" type="number"
                    value={restante.toFixed(2)} readOnly
                    style={{ background: '#f8f9fa', color: restante === 0 ? '#1D9E75' : '#E24B4A', fontWeight: 500 }} />
                </div>

                <div className="alert alert-info py-2 mb-0" style={{ fontSize: '12px' }}>
                  <strong>10 dias habiles</strong> para liquidar. El sistema avisara cuando este por vencer.
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn btn-secondary btn-sm" onClick={() => setModalAbierto(false)}>Cancelar</button>
                <button className="btn btn-primary btn-sm" onClick={guardar}>Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Apartados