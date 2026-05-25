import { useState } from 'react'
import { useSancot } from '../../context/SancotContext'
import './Mayoreos.css'

const formVacio = { cliente: '', telefono: '' }

function Mayoreos() {
  const { mayoreos, setMayoreos, agregarMayoreo, eliminarMayoreo, inventario } = useSancot()
  const [modalAbierto, setModal]        = useState(false)
  const [editandoIdx, setEditandoIdx]   = useState(null)
  const [form, setForm]                 = useState(formVacio)
  const [productosSelec, setProdsSelec] = useState([])
  const [errores, setErrores]           = useState({})

  // Combina inventario sin duplicados
  const inventarioCompleto = [
    ...inventario.dany,
    ...inventario.erick,
  ].filter((p, idx, arr) =>
    arr.findIndex(x => (x.producto || x.nombre) === (p.producto || p.nombre)) === idx
  )

  const cantidadTotal = productosSelec.reduce(
    (acc, p) => acc + (p.stockChica || 0) + (p.stockMediana || 0) + (p.stockGrande || 0), 0
  )

  const precioTotal = productosSelec.reduce((acc, p) => {
    const inv = inventarioCompleto.find(x => (x.producto || x.nombre) === p.producto)
    const cant = (p.stockChica || 0) + (p.stockMediana || 0) + (p.stockGrande || 0)
    return acc + (parseFloat(inv?.precio || 0) * cant)
  }, 0)

  const esEdicion = editandoIdx !== null

  const abrirModal = (idx = null) => {
    setEditandoIdx(idx)
    setErrores({})
    if (idx !== null) {
      const m = mayoreos[idx]
      setForm({ cliente: m.cliente || m.nombre || '', telefono: m.telefono || '' })
      setProdsSelec(m.productos || [])
    } else {
      setForm(formVacio)
      setProdsSelec([])
    }
    setModal(true)
  }

  const cerrarModal = () => {
    setModal(false)
    setEditandoIdx(null)
    setForm(formVacio)
    setProdsSelec([])
    setErrores({})
  }

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value })

  const toggleProducto = (nombreProd) => {
    setProdsSelec(prev => {
      const existe = prev.find(p => p.producto === nombreProd)
      if (existe) return prev.filter(p => p.producto !== nombreProd)

      // Busca el id_prod real del inventario
      const prodInv = inventarioCompleto.find(
        x => (x.producto || x.nombre) === nombreProd
      )

      return [...prev, {
        producto:     nombreProd,
        id_prod:      prodInv?.id_prod,  // ← clave
        precio:       prodInv?.precio || 0,
        stockChica:   0,
        stockMediana: 0,
        stockGrande:  0
      }]
    })
  }

  const actualizarTalla = (nombreProd, talla, valor) => {
    setProdsSelec(prev => prev.map(p =>
      p.producto === nombreProd
        ? { ...p, [talla]: Math.max(0, valor) }
        : p
    ))
  }

  const validar = () => {
    const errs = {}
    if (!form.cliente.trim()) errs.cliente = 'Campo requerido.'
    if (!form.telefono.trim()) errs.telefono = 'Campo requerido.'
    if (productosSelec.length === 0) errs.productos = 'Selecciona al menos un producto.'
    else if (productosSelec.some(p => (p.stockChica + p.stockMediana + p.stockGrande) === 0))
      errs.productos = 'Cada producto debe tener al menos una talla con cantidad.'
    if (cantidadTotal < 1) errs.cantidad = 'Ingresa una cantidad válida.'
    return errs
  }

  const guardar = async () => {
    const errs = validar()
    if (Object.keys(errs).length > 0) { setErrores(errs); return }

    const item = {
      cliente:   form.cliente.trim(),
      telefono:  form.telefono.trim(),
      productos: productosSelec,
      cantidad:  cantidadTotal,
      precio:    precioTotal,
      total:     precioTotal,
      fecha:     new Date().toISOString(),
    }

    if (esEdicion) {
      const actualizada = [...mayoreos]
      actualizada[editandoIdx] = item
      setMayoreos(actualizada)
    } else {
      await agregarMayoreo(item)
    }
    cerrarModal()
  }

  const eliminar = async (idx) => {
    const m = mayoreos[idx]
    if (m.id_clm) {
      await eliminarMayoreo(m.id_clm)
    } else {
      setMayoreos(mayoreos.filter((_, i) => i !== idx))
    }
  }

  return (
    <>
      <h5 className="mb-3">Mayoreos</h5>

      <button className="btn btn-primary btn-sm mb-3" onClick={() => abrirModal()}>
        + Agregar mayoreo
      </button>

      <div className="table-responsive">
        <table className="table table-bordered table-sm align-middle">
          <thead className="table-light">
            <tr>
              <th>Cliente</th>
              <th>Teléfono</th>
              <th>Productos</th>
              <th>Cantidad</th>
              <th>Precio</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {mayoreos.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-muted py-3">
                  Sin mayoreos registrados.
                </td>
              </tr>
            ) : (
              mayoreos.map((m, i) => (
                <tr key={m.id_clm || i}>
                  <td>{m.cliente || m.nombre}</td>
                  <td>{m.telefono || '—'}</td>
                  <td>
                    {(m.productos || []).length === 0 ? (
                      <span className="text-muted">—</span>
                    ) : (
                      (m.productos || []).map((p, pi) => (
                        <div key={pi} className="mayoreos-producto-item">
                          <span className="badge bg-primary">{p.producto}</span>
                          <small className="text-muted ps-1">
                            {(p.stockChica || p.ch_cant || 0) > 0 && `Ch:${p.stockChica || p.ch_cant} `}
                            {(p.stockMediana || p.m_cant || 0) > 0 && `M:${p.stockMediana || p.m_cant} `}
                            {(p.stockGrande || p.g_cant || 0) > 0 && `G:${p.stockGrande || p.g_cant}`}
                          </small>
                        </div>
                      ))
                    )}
                  </td>
                  <td>{m.cantidad}</td>
                  <td>${parseFloat(m.precio || 0).toFixed(2)}</td>
                  <td className="mayoreos-actions-cell">
                    <button className="btn btn-outline-primary btn-sm" onClick={() => abrirModal(i)}>✏</button>
                    <button className="btn btn-outline-danger btn-sm" onClick={() => eliminar(i)}>✕</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalAbierto && (
        <div
          className="modal show d-block modal-overlay"
          onClick={(e) => e.target === e.currentTarget && cerrarModal()}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h6 className="modal-title">
                  {esEdicion ? 'Modificar mayoreo' : 'Agregar mayoreo'}
                </h6>
                <button className="btn-close" onClick={cerrarModal} />
              </div>

              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Cliente</label>
                  <input
                    className={`form-control form-control-sm ${errores.cliente ? 'is-invalid' : ''}`}
                    type="text" name="cliente" value={form.cliente}
                    onChange={handleChange} placeholder="Nombre del cliente" autoFocus
                  />
                  {errores.cliente && <div className="invalid-feedback">{errores.cliente}</div>}
                </div>

                <div className="mb-3">
                  <label className="form-label">Teléfono</label>
                  <input
                    className={`form-control form-control-sm ${errores.telefono ? 'is-invalid' : ''}`}
                    type="text" name="telefono" value={form.telefono}
                    onChange={handleChange} placeholder="Número de teléfono"
                  />
                  {errores.telefono && <div className="invalid-feedback">{errores.telefono}</div>}
                </div>

                <div className="mb-3">
                  <label className="form-label">Productos y Tallas</label>

                  {inventarioCompleto.length === 0 ? (
                    <p className="text-muted" style={{ fontSize: '12px' }}>
                      No hay productos en inventario aún.
                    </p>
                  ) : (
                    <>
                      {/* Lista de productos — una columna para que se vea el nombre */}
                      <div style={{
                        maxHeight: '150px', overflowY: 'auto',
                        border: '1px solid #dee2e6', borderRadius: '4px',
                        padding: '6px', marginBottom: '10px'
                      }}>
                        {inventarioCompleto.map((prod) => {
                          const nombreProd = prod.producto || prod.nombre
                          const seleccionado = productosSelec.find(p => p.producto === nombreProd)
                          return (
                            <div
                              key={nombreProd}
                              onClick={() => toggleProducto(nombreProd)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                padding: '5px 8px', borderRadius: '4px', cursor: 'pointer',
                                marginBottom: '3px', userSelect: 'none',
                                background: seleccionado ? '#E6F1FB' : 'transparent',
                                border: `1px solid ${seleccionado ? '#378ADD' : '#dee2e6'}`,
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={!!seleccionado}
                                onChange={() => {}}
                                style={{ pointerEvents: 'none', flexShrink: 0 }}
                              />
                              <span style={{ fontSize: '13px', flex: 1 }}>
                                {nombreProd}
                              </span>
                              <small className="text-muted" style={{ fontSize: '11px' }}>
                                ${parseFloat(prod.precio || 0).toFixed(2)}
                              </small>
                            </div>
                          )
                        })}
                      </div>

                      {/* Cantidades por talla de cada producto seleccionado */}
                      {productosSelec.length > 0 && (
                        <div style={{ background: '#f8f9fa', borderRadius: '4px', padding: '8px' }}>
                          <small className="fw-semibold d-block mb-2">Cantidades por talla:</small>
                          {productosSelec.map(p => (
                            <div key={p.producto} style={{
                              background: 'white', borderRadius: '4px',
                              border: '1px solid #e9ecef', padding: '8px', marginBottom: '8px'
                            }}>
                              <small className="fw-semibold">{p.producto}</small>
                              <div className="row g-2 mt-1">
                                {[
                                  { key: 'stockChica',   label: 'Ch' },
                                  { key: 'stockMediana', label: 'M'  },
                                  { key: 'stockGrande',  label: 'G'  },
                                ].map(({ key, label }) => (
                                  <div key={key} className="col-4">
                                    <label className="form-label form-label-sm">{label}</label>
                                    <input
                                      type="number"
                                      className="form-control form-control-sm"
                                      value={p[key]}
                                      onChange={(e) => actualizarTalla(p.producto, key, parseInt(e.target.value) || 0)}
                                      min="0"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  {errores.productos && (
                    <div className="text-danger mt-1" style={{ fontSize: '12px' }}>
                      {errores.productos}
                    </div>
                  )}
                </div>

                <div className="row g-2">
                  <div className="col-6">
                    <label className="form-label">Cantidad total</label>
                    <input
                      className="form-control form-control-sm"
                      type="number" value={cantidadTotal} readOnly
                      style={{ background: '#f8f9fa', color: '#555' }}
                    />
                    {errores.cantidad && <div className="text-danger" style={{ fontSize: '12px' }}>{errores.cantidad}</div>}
                  </div>
                  <div className="col-6">
                    <label className="form-label">Precio total ($)</label>
                    <input
                      className="form-control form-control-sm"
                      type="number" value={precioTotal.toFixed(2)} readOnly
                      style={{ background: '#f8f9fa', color: '#555' }}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn btn-secondary btn-sm" onClick={cerrarModal}>Cancelar</button>
                <button className="btn btn-primary btn-sm" onClick={guardar}>
                  {esEdicion ? 'Guardar cambios' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Mayoreos