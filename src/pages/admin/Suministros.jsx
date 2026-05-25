import { useState } from 'react'
import { useSancot } from '../../context/SancotContext'
import './Suministros.css'

const formVacio = { producto: '', tipo: 'limpieza', cantidad: '', precio: '' }

const TIPOS = [
  { value: 'limpieza',         label: '🧹 Limpieza' },
  { value: 'reabastecimiento', label: '📦 Reabastecimiento' },
]

function Suministros() {
  const { suministros, agregarSuministro, actualizarSuministro, eliminarSuministro } = useSancot()

  const [modalAbierto, setModal]      = useState(false)
  const [editandoIdx, setEditandoIdx] = useState(null)
  const [form, setForm]               = useState(formVacio)
  const [errores, setErrores]         = useState({})
  const [guardando, setGuardando]     = useState(false)
  const [filtro, setFiltro]           = useState('todos')

  const esEdicion = editandoIdx !== null

  const suministrosFiltrados = filtro === 'todos'
    ? suministros
    : suministros.filter(s => s.tipo === filtro)

  const abrirModal = (idx = null) => {
    setEditandoIdx(idx)
    if (idx !== null) {
      const s = suministrosFiltrados[idx]
      setForm({
        producto: s.nombre || s.producto || '',
        tipo:     s.tipo || 'limpieza',
        cantidad: s.cantidad,
        precio:   s.precio,
      })
    } else {
      setForm(formVacio)
    }
    setErrores({})
    setModal(true)
  }

  const cerrarModal = () => {
    setModal(false)
    setEditandoIdx(null)
    setForm(formVacio)
    setErrores({})
  }

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value })

  const validar = () => {
    const errs = {}
    if (!form.producto.trim())               errs.producto = 'Este campo es requerido.'
    if (!form.cantidad || form.cantidad < 1) errs.cantidad = 'Ingresa una cantidad válida.'
    if (!form.precio   || form.precio < 0)   errs.precio   = 'Ingresa un precio válido.'
    return errs
  }

  const guardar = async () => {
    const errs = validar()
    if (Object.keys(errs).length > 0) { setErrores(errs); return }

    setGuardando(true)
    try {
      const item = {
        producto:  form.producto.trim(),
        tipo:      form.tipo,
        cantidad:  parseInt(form.cantidad),
        precio:    parseFloat(form.precio),
      }
      if (esEdicion) {
        await actualizarSuministro(suministrosFiltrados[editandoIdx].id_sum, item)
      } else {
        await agregarSuministro(item)
      }
      cerrarModal()
    } catch (err) {
      console.error('Error guardando suministro:', err)
    } finally {
      setGuardando(false)
    }
  }

  const eliminar = async (idx) => {
    try {
      await eliminarSuministro(suministrosFiltrados[idx].id_sum)
    } catch (err) {
      console.error('Error eliminando suministro:', err)
    }
  }

  const badgeColor = (tipo) =>
    tipo === 'reabastecimiento' ? 'bg-primary' : 'bg-success'

  const badgeLabel = (tipo) =>
    tipo === 'reabastecimiento' ? '📦 Reabastecimiento' : '🧹 Limpieza'

  return (
    <>
      <h5 className="mb-3">Suministros</h5>

      <div className="d-flex align-items-center gap-2 mb-3">
        <div className="btn-group">
          {['todos', 'limpieza', 'reabastecimiento'].map(t => (
            <button
              key={t}
              className={`btn btn-sm ${filtro === t ? 'btn-dark' : 'btn-outline-secondary'}`}
              onClick={() => setFiltro(t)}
            >
              {t === 'todos' ? 'Todos' : t === 'limpieza' ? '🧹 Limpieza' : '📦 Reabastecimiento'}
            </button>
          ))}
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => abrirModal()}>
          + Agregar suministro
        </button>
      </div>

      <div className="table-responsive">
        <table className="table table-bordered table-sm align-middle">
          <thead className="table-light">
            <tr>
              <th>Tipo</th>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>$ Compra * pieza</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {suministrosFiltrados.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-muted py-3">
                  Sin suministros registrados.
                </td>
              </tr>
            ) : (
              suministrosFiltrados.map((s, i) => (
                <tr key={s.id_sum || i}>
                  <td>
                    <span className={`badge ${badgeColor(s.tipo)}`}>
                      {badgeLabel(s.tipo)}
                    </span>
                  </td>
                  <td>{s.nombre || s.producto}</td>
                  <td>{s.cantidad}</td>
                  <td>${parseFloat(s.precio).toFixed(2)}</td>
                  <td className="suministros-acciones-cell">
                    <button
                      className="btn btn-outline-primary btn-sm suministros-action-btn"
                      onClick={() => abrirModal(i)}
                    >✏</button>
                    <button
                      className="btn btn-outline-danger btn-sm suministros-action-btn"
                      onClick={() => eliminar(i)}
                    >✕</button>
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
                  {esEdicion ? 'Modificar suministro' : 'Agregar suministro'}
                </h6>
                <button className="btn-close" onClick={cerrarModal} />
              </div>

              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Tipo de suministro</label>
                  <div className="d-flex gap-2">
                    {TIPOS.map(t => (
                      <button
                        key={t.value}
                        type="button"
                        className={`btn btn-sm flex-fill ${form.tipo === t.value ? 'btn-dark' : 'btn-outline-secondary'}`}
                        onClick={() => setForm({ ...form, tipo: t.value })}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    {form.tipo === 'reabastecimiento' ? 'Producto a reabastecer' : 'Artículo de limpieza'}
                  </label>
                  <input
                    className={`form-control form-control-sm ${errores.producto ? 'is-invalid' : ''}`}
                    type="text"
                    name="producto"
                    value={form.producto}
                    onChange={handleChange}
                    placeholder={form.tipo === 'reabastecimiento' ? 'Ej: Playera azul talla M...' : 'Ej: Escoba, Sabuloso...'}
                    autoFocus
                  />
                  {errores.producto && <div className="invalid-feedback">{errores.producto}</div>}
                </div>

                <div className="mb-3">
                  <label className="form-label">Cantidad</label>
                  <input
                    className={`form-control form-control-sm ${errores.cantidad ? 'is-invalid' : ''}`}
                    type="number"
                    name="cantidad"
                    value={form.cantidad}
                    onChange={handleChange}
                    placeholder="0"
                    min="1"
                  />
                  {errores.cantidad && <div className="invalid-feedback">{errores.cantidad}</div>}
                </div>

                <div className="mb-3">
                  <label className="form-label">Precio de compra ($)</label>
                  <input
                    className={`form-control form-control-sm ${errores.precio ? 'is-invalid' : ''}`}
                    type="number"
                    name="precio"
                    value={form.precio}
                    onChange={handleChange}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                  {errores.precio && <div className="invalid-feedback">{errores.precio}</div>}
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn btn-secondary btn-sm" onClick={cerrarModal}>
                  Cancelar
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={guardar}
                  disabled={guardando}
                >
                  {guardando ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Suministros