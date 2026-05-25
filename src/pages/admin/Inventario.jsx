import { useState } from 'react'
import { useSancot } from '../../context/SancotContext'
import './Inventario.css'

import { BsFillFloppy2Fill } from "react-icons/bs"

function generarCodigo(responsable, cantidad) {
  const prefijo = responsable === 'dany' ? '01' : '20'
  const numero = String(cantidad + 1).padStart(3, '0')
  return `${prefijo}${numero}`
}

const modalVacio = {
  producto: '',
  descripcion: '',
  precio: '',
  stockChica: 0,
  stockMediana: 0,
  stockGrande: 0
}

function Inventario() {
  const { inventario, setInventario, agregarProducto, eliminarProducto } = useSancot()
  const [tabActual, setTabActual]     = useState('dany')
  const [modalAbierto, setModal]      = useState(false)
  const [form, setForm]               = useState(modalVacio)
  const [guardando, setGuardando]     = useState(false)  // ← estaba faltando

  const listaActual  = inventario[tabActual] || []
  const codigoPreview = generarCodigo(tabActual, listaActual.length)

  const abrirModal  = () => { setForm(modalVacio); setModal(true) }
  const cerrarModal = () => { setModal(false); setForm(modalVacio) }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value })
  }

  // ── Guardar → llama a la API ──────────────────────────────
  const guardar = async () => {
    if (!form.producto.trim()) return
    setGuardando(true)
    try {
      const nuevo = {
        codigo:       generarCodigo(tabActual, listaActual.length),
        producto:     form.producto,
        descripcion:  form.descripcion,
        precio:       parseFloat(form.precio) || 0,
        stockChica:   parseInt(form.stockChica) || 0,
        stockMediana: parseInt(form.stockMediana) || 0,
        stockGrande:  parseInt(form.stockGrande) || 0,
        id_usuario: tabActual === 'dany' ? 5 : 4
      }
      console.log('Enviando producto:', nuevo)
      await agregarProducto(nuevo)
      console.log('Producto guardado OK')
      cerrarModal()
    } catch (err) {
      console.error('Error al guardar:', err)
    } finally {
      setGuardando(false)
    }
  }

  // ── Eliminar → llama a la API ─────────────────────────────
  const eliminar = async (idx) => {
    const producto = listaActual[idx]
    try {
      if (producto.id_prod) {
        await eliminarProducto(producto.id_prod)
      } else {
        const nueva = listaActual.filter((_, i) => i !== idx)
        const prefijo = tabActual === 'dany' ? '01' : '20'
        const recalculada = nueva.map((p, i) => ({
          ...p,
          codigo: `${prefijo}${String(i + 1).padStart(3, '0')}`
        }))
        setInventario({ ...inventario, [tabActual]: recalculada })
      }
    } catch (err) {
      console.error('Error al eliminar:', err)
    }
  }

  return (
    <>
      <h5 className="mb-3">Inventario</h5>

      <div className="btn-group mb-3">
        <button
          className={`btn btn-sm ingresos-filtro-btn ${tabActual === 'dany' ? 'btn-primary' : 'btn-outline-primary'}`}
          onClick={() => setTabActual('dany')}
        >
          Dany (01)
        </button>
        <button
          className={`btn btn-sm ingresos-filtro-btn ${tabActual === 'erick' ? 'btn-success' : 'btn-outline-success'}`}
          onClick={() => setTabActual('erick')}
        >
          Erick (20)
        </button>
      </div>

      <button className="btn btn-primary btn-sm mb-3" onClick={abrirModal}>
        + Agregar producto
      </button>

      <div className="table-responsive">
        <table className="table table-bordered table-sm">
          <thead className="table-light">
            <tr>
              <th>Código</th>
              <th>Producto</th>
              <th>Descripción</th>
              <th>Precio</th>
              <th>Ch</th>
              <th>M</th>
              <th>G</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {listaActual.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center text-muted py-3">
                  Sin productos. Agrega uno.
                </td>
              </tr>
            ) : (
              listaActual.map((p, i) => (
                <tr key={p.id_prod || p.codigo}>
                  <td><strong>{p.codigo}</strong></td>
                  <td>{p.producto || p.nombre}</td>
                  <td>{p.descripcion || '—'}</td>
                  <td>${parseFloat(p.precio).toFixed(2)}</td>
                  <td className="text-center">{p.stockChica ?? p.stock_ch ?? 0}</td>
                  <td className="text-center">{p.stockMediana ?? p.stock_m ?? 0}</td>
                  <td className="text-center">{p.stockGrande ?? p.stock_g ?? 0}</td>
                  <td>
                    <button
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => eliminar(i)}
                    >✕</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modalAbierto && (
        <div
          className="modal show d-block modal-overlay"
          onClick={(e) => e.target === e.currentTarget && cerrarModal()}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">

              <div className="modal-header">
                <h6 className="modal-title">
                  Agregar producto — {tabActual === 'dany' ? 'Dany' : 'Erick'}
                </h6>
                <button className="btn-close" onClick={cerrarModal} />
              </div>

              <div className="modal-body">
                <p><strong>Código:</strong> {codigoPreview}</p>

                <input
                  className="form-control mb-2"
                  name="producto"
                  placeholder="Producto"
                  value={form.producto}
                  onChange={handleChange}
                />
                <input
                  className="form-control mb-2"
                  name="descripcion"
                  placeholder="Descripción"
                  value={form.descripcion}
                  onChange={handleChange}
                />

                <div className="row g-2 mb-3">
                  <div className="col-md-4">
                    <label className="form-label form-label-sm">Stock Chica</label>
                    <input type="number" className="form-control form-control-sm"
                      name="stockChica" placeholder="0" value={form.stockChica}
                      onChange={handleChange} min="0" />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label form-label-sm">Stock Mediana</label>
                    <input type="number" className="form-control form-control-sm"
                      name="stockMediana" placeholder="0" value={form.stockMediana}
                      onChange={handleChange} min="0" />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label form-label-sm">Stock Grande</label>
                    <input type="number" className="form-control form-control-sm"
                      name="stockGrande" placeholder="0" value={form.stockGrande}
                      onChange={handleChange} min="0" />
                  </div>
                </div>

                <input
                  type="number"
                  className="form-control mt-2"
                  name="precio"
                  placeholder="Precio"
                  value={form.precio}
                  onChange={handleChange}
                />
              </div>

              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={cerrarModal}>
                  Cancelar
                </button>
                <button className="btn btn-primary" onClick={guardar} disabled={guardando}>
                  <BsFillFloppy2Fill /> {guardando ? 'Guardando...' : 'Guardar'}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Inventario