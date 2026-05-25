import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { SancotProvider } from './context/SancotContext'
import React from "react";
//import React from "react";
//https://react-icons.github.io/react-icons/

import LoginPage   from './pages/Login/LoginPages'
import AdminLayout from './Layouts/AdminLayout'
import EmpleadoLayout from './Layouts/EmpleadoLayout'
import Inventario  from './pages/admin/Inventario'
import Suministros from './pages/admin/Suministros'
import Mayoreos    from './pages/admin/Mayoreos'
import Usuarios    from './pages/admin/Usuarios'
import Ingresos    from './pages/admin/Ingresos'
import Apartados   from './pages/admin/Apartados'
import Ventas      from './pages/admin/Ventas'
//Empleados
import InicioEmpleado from './pages/empleado/InicioEmpleado'
import Venta from './pages/empleado/Venta'
import Reporte from './pages/empleado/Reporte'
import Recibos  from './pages/empleado/Recibos'

import { FaBeer } from 'react-icons/fa';

class Question extends React.Component {
  render() {
    return <h3> Lets go for a <FaBeer />? </h3>
  }
}

function App() {
  return (
    <SancotProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="inventario" replace />} />
            <Route path="inventario"  element={<Inventario />} />
            <Route path="suministros" element={<Suministros />} />
            <Route path="mayoreos"    element={<Mayoreos />} />
            <Route path="usuarios"    element={<Usuarios />} />
            <Route path="ingresos"    element={<Ingresos />} />
            <Route path="apartados"   element={<Apartados />} />
            <Route path="ventas"      element={<Ventas />} />
          </Route>
          {/* Dentro de las Routes: */}
          <Route path="/empleado" element={<EmpleadoLayout />}>
            <Route index element={<Navigate to="inicio" replace />} />
            <Route path="inicio" element={<InicioEmpleado />} />
            <Route path="venta" element={<Venta />} />
            <Route path="reportes" element={<Reporte />} />
            <Route path="recibos"  element={<Recibos />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </SancotProvider>
  )
}

export default App