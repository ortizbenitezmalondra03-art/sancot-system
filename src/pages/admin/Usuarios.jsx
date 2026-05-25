import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSancot } from '../../context/SancotContext'
import './Usuarios.css'

const formVacio = {
  nombre: '', rol: '', telefono: '', password: '', confirmar: ''
}

function Usuarios() {
  const { usuarios, setUsuarios } = useSancot() // ← conectado al contexto
  const [modalAbierto, setModal]      = useState(false)
  const [editandoIdx, setEditandoIdx] = useState(null)
  const [form, setForm]               = useState(formVacio)
  const [errores, setErrores]         = useState({})
  const [verPass, setVerPass]         = useState({ pass: false, confirmar: false })
  const navigate = useNavigate()

  const navItems = [
    { path: '/admin/inventario',  label: 'Inventario'  },
    { path: '/admin/suministros', label: 'Suministros' },
    { path: '/admin/mayoreos',    label: 'Mayoreos'    },
    { path: '/admin/usuarios',   label: 'Usuarios'     },
    { path: '/admin/ingresos',    label: 'Ingresos'    },
    { path: '/admin/apartados',   label: 'Apartados'   },
    { path: '/admin/ventas',      label: 'Ventas'      },
  ]

  const handleLogout = () => {
    localStorage.removeItem('rol')
    navigate('/')
  }

  const esEdicion = editandoIdx !== null

  const abrirModal = (idx = null) => {
    setEditandoIdx(idx)
    setErrores({})
    setVerPass({ pass: false, confirmar: false })
    if (idx !== null) {
      const u = usuarios[idx]
      setForm({
        nombre:   u.nombre,
        rol:      u.rol,
        telefono: u.telefono,
        password: u.password,
        confirmar: u.password
      })
    } else {
      setForm(formVacio)
    }
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
    if (!form.nombre.trim())       errs.nombre    = 'Campo requerido.'
    if (!form.rol)                 errs.rol       = 'Selecciona un rol.'
    if (!form.telefono.trim())     errs.telefono  = 'Campo requerido.'
    if (form.password.length < 4)  errs.password  = 'Mínimo 4 caracteres.'
    if (form.password !== form.confirmar)
                                   errs.confirmar = 'Las contraseñas no coinciden.'
    return errs
  }

  const guardar = () => {
    const errs = validar()
    if (Object.keys(errs).length > 0) { setErrores(errs); return }

    const item = {
      nombre:   form.nombre.trim(),
      rol:      form.rol,
      telefono: form.telefono.trim(),
      password: form.password,
    }

    if (esEdicion) {
      const actualizada = [...usuarios]
      actualizada[editandoIdx] = item
      setUsuarios(actualizada)
    } else {
      setUsuarios([...usuarios, item])
    }
    cerrarModal()
  }

  const eliminar = (idx) =>
    setUsuarios(usuarios.filter((_, i) => i !== idx))

  return (
    <>
      <h5 className="mb-3">Usuarios</h5>

            <button className="btn btn-primary btn-sm mb-3" onClick={() => abrirModal()}>
              + Agregar usuario
            </button>

            {/* ── Tabla ── */}
            <div className="table-responsive">
              <table className="table table-bordered table-sm align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Nombre</th>
                    <th>Rol</th>
                    <th>Teléfono</th>
                    <th>Contraseña</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center text-muted py-3">
                        Sin usuarios registrados.
                      </td>
                    </tr>
                  ) : (
                    usuarios.map((u, i) => (
                      <tr key={i}>
                        <td>{u.nombre}</td>
                        <td>
                          <span
                            className={`badge usuarios-badge-rol ${u.rol === 'Admin' ? 'bg-primary' : 'bg-success'}`}
                          >
                            {u.rol}
                          </span>
                        </td>
                        <td>{u.telefono}</td>
                        <td>••••••</td>
                        <td className="usuarios-acciones-cell">
                          <button
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => abrirModal(i)}
                          >
                            ✏ Modificar
                          </button>
                          <button
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => eliminar(i)}
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Nota solo admin */}
            <p className="text-danger mt-2" style={{ fontSize: '12px' }}>
              Solo visible para el administrador.
            </p>

            {/* ── Modal ── */}
            {modalAbierto && (
              <div
                className="modal show d-block modal-overlay"
                onClick={(e) => e.target === e.currentTarget && cerrarModal()}
              >
                <div className="modal-dialog modal-dialog-centered">
                  <div className="modal-content">

                    <div className="modal-header">
                      <h6 className="modal-title">
                        {esEdicion ? 'Modificar usuario' : 'Agregar usuario'}
                      </h6>
                      <button className="btn-close" onClick={cerrarModal} />
                    </div>

                    <div className="modal-body">

                      <div className="mb-3">
                        <label className="form-label">Nombre</label>
                        <input
                          className={`form-control form-control-sm ${errores.nombre ? 'is-invalid' : ''}`}
                          type="text"
                          name="nombre"
                          value={form.nombre}
                          onChange={handleChange}
                          placeholder="Nombre completo"
                          autoFocus
                        />
                        {errores.nombre && <div className="invalid-feedback">{errores.nombre}</div>}
                      </div>

                      <div className="mb-3">
                        <label className="form-label">Rol</label>
                        <select
                          className={`form-select form-select-sm ${errores.rol ? 'is-invalid' : ''}`}
                          name="rol"
                          value={form.rol}
                          onChange={handleChange}
                        >
                          <option value="">— Selecciona un rol —</option>
                          <option value="Admin">Administrador</option>
                          <option value="Empleado">Empleado</option>
                        </select>
                        {errores.rol && <div className="invalid-feedback">{errores.rol}</div>}
                      </div>

                      <div className="mb-3">
                        <label className="form-label">Teléfono</label>
                        <input
                          className={`form-control form-control-sm ${errores.telefono ? 'is-invalid' : ''}`}
                          type="text"
                          name="telefono"
                          value={form.telefono}
                          onChange={handleChange}
                          placeholder="Ej: 442-123-4567"
                        />
                        {errores.telefono && <div className="invalid-feedback">{errores.telefono}</div>}
                      </div>

                      <div className="mb-3">
                        <label className="form-label">Contraseña</label>
                        <div className="input-group input-group-sm">
                          <input
                            className={`form-control ${errores.password ? 'is-invalid' : ''}`}
                            type={verPass.pass ? 'text' : 'password'}
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            placeholder="Contraseña"
                          />
                          <button
                            className="btn btn-outline-secondary"
                            type="button"
                            onClick={() => setVerPass({ ...verPass, pass: !verPass.pass })}
                          >
                            {verPass.pass ? '🙈' : '👁'}
                          </button>
                          {errores.password && <div className="invalid-feedback">{errores.password}</div>}
                        </div>
                      </div>

                      <div className="mb-3">
                        <label className="form-label">Confirmar contraseña</label>
                        <div className="input-group input-group-sm">
                          <input
                            className={`form-control ${errores.confirmar ? 'is-invalid' : ''}`}
                            type={verPass.confirmar ? 'text' : 'password'}
                            name="confirmar"
                            value={form.confirmar}
                            onChange={handleChange}
                            placeholder="Repite la contraseña"
                          />
                          <button
                            className="btn btn-outline-secondary"
                            type="button"
                            onClick={() => setVerPass({ ...verPass, confirmar: !verPass.confirmar })}
                          >
                            {verPass.confirmar ? '🙈' : '👁'}
                          </button>
                          {errores.confirmar && <div className="invalid-feedback">{errores.confirmar}</div>}
                        </div>
                      </div>

                    </div>

                    <div className="modal-footer">
                      <button className="btn btn-secondary btn-sm" onClick={cerrarModal}>
                        Cancelar
                      </button>
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

export default Usuarios