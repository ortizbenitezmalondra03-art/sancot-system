import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './LoginPage.css'

const API = 'http://localhost:5000'

function LoginPage() {
  const [usuario,  setUsuario]  = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [cargando, setCargando] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')

    if (!usuario || !password) {
      setError('Por favor completa todos los campos.')
      return
    }

    setCargando(true)
    try {
      const res  = await fetch(`${API}/usuarios`)
      const data = await res.json()

      const encontrado = data.find(
        u => u.nombre.toLowerCase() === usuario.toLowerCase()
          && u.contrasena === password
      )

      if (!encontrado) {
        setError('Usuario o contraseña incorrectos.')
        return
      }

      const rol = encontrado.rol.toLowerCase()
      localStorage.setItem('rol',        rol)
      localStorage.setItem('id_usuario', encontrado.id_usuario)
      localStorage.setItem('nombre',     encontrado.nombre)

      if (rol === 'administrador' || rol === 'admin') {
        navigate('/admin')
      } else {
        navigate('/empleado')
      }

    } catch (err) {
      setError('No se pudo conectar con el servidor. Verifica que Flask esté corriendo.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-titulo">SANCOT</h2>
        <div className="login-avatar">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="18" r="10" stroke="#888" strokeWidth="2"/>
            <path d="M4 46c0-11 8.954-20 20-20s20 8.954 20 20"
              stroke="#888" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <form onSubmit={handleLogin}>
          <div className="login-campo">
            <label>Usuario:</label>
            <input
              type="text"
              placeholder="Ingrese nombre de usuario"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
            />
          </div>
          <div className="login-campo">
            <label>Contraseña:</label>
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="login-error">{error}</p>}
          <button type="submit" className="btn btn-primary w-100 mt-2" disabled={cargando}>
            {cargando ? 'Verificando...' : 'Acceder'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default LoginPage