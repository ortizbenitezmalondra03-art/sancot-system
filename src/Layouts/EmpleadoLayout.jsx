import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import './EmpleadoLayout.css'

const navItems = [
  { path: '/empleado/inicio', label: 'Inicio', helper: 'Resumen del dia', tone: 'blue' },
  { path: '/empleado/venta', label: 'Nueva venta', helper: 'Registrar venta', tone: 'blue' },
  { path: '/empleado/reportes', label: 'Reportes', helper: 'Ver ventas del dia', tone: 'green' },
  { path: '/empleado/recibos', label: 'Recibos', helper: 'Historial de pagos', tone: 'purple' },
]

function EmpleadoLayout() {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('empleadoActual')
    localStorage.removeItem('tipoUsuario')
    navigate('/')
  }

  return (
    <div className="empleado-wrap">
      <aside className="empleado-sidebar">
        <div className="empleado-sidebar-brand">SANCOT</div>
        <nav className="empleado-sidebar-nav">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `empleado-nav-item empleado-nav-${item.tone}` + (isActive ? ' active' : '')
              }
            >
              <span className="empleado-nav-label">{item.label}</span>
              <span className="empleado-nav-helper">{item.helper}</span>
            </NavLink>
          ))}
        </nav>
        <button className="empleado-logout-btn" onClick={handleLogout}>
          Cerrar sesion
        </button>
      </aside>

      <div className="empleado-main">
        <header className="empleado-topbar">
          <span>@Empleado</span>
        </header>
        <main className="empleado-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default EmpleadoLayout
