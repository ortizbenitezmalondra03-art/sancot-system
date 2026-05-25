import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import './AdminLayout.css'

const navItems = [
  { path: '/admin/inventario',  label: 'Inventario'  },
  { path: '/admin/suministros', label: 'Suministros' },
  { path: '/admin/mayoreos',    label: 'Mayoreos'    },
  { path: '/admin/usuarios',   label: 'Usuarios'     },
  { path: '/admin/ingresos',    label: 'Ingresos'    },
  { path: '/admin/apartados',   label: 'Apartados'   },
]

function AdminLayout() {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('rol')
    navigate('/')
  }

  return (
    <div className="admin-wrap">
      <aside className="sidebar">
        <div className="sidebar-brand">SANCOT</div>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                'nav-item' + (isActive ? ' active' : '')
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button className="logout-btn" onClick={handleLogout}>
          Cerrar sesión
        </button>
      </aside>

      <div className="admin-main">
        <header className="topbar">
          <span>@Administrador</span>
        </header>
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout