// src/context/SancotContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  apiProductos, apiUsuarios, apiVentas,
  apiSuministros, apiApartados, apiMayoreos,
} from '../services/api'

const SancotContext = createContext()

function adaptarProducto(p) {
  return {
    id_prod:      p.id_prod,
    codigo:       p.codigo,
    producto:     p.nombre,
    descripcion:  p.descripcion,
    precio:       parseFloat(p.precio),
    stockChica:   p.stock_ch,
    stockMediana: p.stock_m,
    stockGrande:  p.stock_g,
    id_usuario:   p.id_usuario,
    responsable:  p.id_usuario === 1 ? 'dany' : 'erick',
  }
}

export function SancotProvider({ children }) {
  const [ventas,      setVentas]      = useState([])
  const [suministros, setSuministros] = useState([])
  const [inventario,  setInventario]  = useState({ dany: [], erick: [] })
  const [mayoreos,    setMayoreos]    = useState([])
  const [apartados,   setApartados]   = useState([])
  const [usuarios,    setUsuarios]    = useState([])

  // ── Cargas iniciales ──────────────────────────────────────
  const cargarProductos = useCallback(async () => {
    try {
      const data = await apiProductos.getAll()
      const adaptados = data.map(adaptarProducto)
      setInventario({
        dany:  adaptados.filter(p => p.id_usuario === 5),  // ← usa adaptados
        erick: adaptados.filter(p => p.id_usuario === 4)   // ← usa adaptados
      })
    } catch (err) { console.error('Error cargando productos:', err) }
  }, [])

  const cargarUsuarios = useCallback(async () => {
    try { setUsuarios(await apiUsuarios.getAll()) }
    catch (err) { console.error('Error cargando usuarios:', err) }
  }, [])

  const cargarVentas = useCallback(async () => {
    try { setVentas(await apiVentas.getAll()) }
    catch (err) { console.error('Error cargando ventas:', err) }
  }, [])

  const cargarSuministros = useCallback(async () => {
    try { setSuministros(await apiSuministros.getAll()) }
    catch (err) { console.error('Error cargando suministros:', err) }
  }, [])

  const cargarApartados = useCallback(async () => {
    try {
      const data = await apiApartados.getAll()
      setApartados(data.map(ap => ({
        ...ap,
        nombre:         ap.nom_cliente,
        anticipo:       parseFloat(ap.anticipo),
        total:          parseFloat(ap.total_ap),
        restante:       parseFloat(ap.restante),
        liquidado:      ap.estado === 'liquidado',
        canceladoAuto:  ap.estado === 'cancelado',
        productos:      ap.productos || [],  // ← usa los que vienen de la BD
        productosDetalle: [],
      })))
    } catch (err) { console.error('Error cargando apartados:', err) }
  }, [])

  const cargarMayoreos = useCallback(async () => {
    try {
      const data = await apiMayoreos.getAll()
      setMayoreos(data.map(m => ({
        ...m,
        cliente:   m.nombre,
        precio:    parseFloat(m.total),
        vendido:   false,
        productos: m.productos || [],  // ← usa los productos que vienen de la BD
      })))
    } catch (err) { console.error('Error cargando mayoreos:', err) }
  }, [])

  useEffect(() => {
    cargarProductos()
    cargarUsuarios()
    cargarVentas()
    cargarSuministros()
    cargarApartados()
    cargarMayoreos()
  }, [])

  // ── Totales ───────────────────────────────────────────────
  const totalIngresos = ventas.reduce((acc, v) => acc + parseFloat(v.total || 0), 0)
  const totalEgresos  = suministros.reduce((acc, s) => acc + parseFloat(s.total_costo || 0), 0)
  const balance       = totalIngresos - totalEgresos

  // ── PRODUCTOS ─────────────────────────────────────────────
  const agregarProducto = async (p) => {
    await apiProductos.create({ codigo: p.codigo, nombre: p.producto, descripcion: p.descripcion,
      precio: p.precio, stock_ch: p.stockChica, stock_m: p.stockMediana, stock_g: p.stockGrande, id_usuario: p.id_usuario })
    await cargarProductos()
  }
  const actualizarProducto = async (id, p) => {
    await apiProductos.update(id, { codigo: p.codigo, nombre: p.producto, descripcion: p.descripcion,
      precio: p.precio, stock_ch: p.stockChica, stock_m: p.stockMediana, stock_g: p.stockGrande })
    await cargarProductos()
  }
  const eliminarProducto = async (id) => {
    await apiProductos.delete(id)
    await cargarProductos()
  }

  // ── USUARIOS ──────────────────────────────────────────────
  const agregarUsuario = async (u) => {
    await apiUsuarios.create({ nombre: u.nombre, rol: u.rol, telefono: u.telefono, contrasena: u.password })
    await cargarUsuarios()
  }
  const actualizarUsuario = async (id, u) => {
    await apiUsuarios.update(id, { nombre: u.nombre, rol: u.rol, telefono: u.telefono })
    await cargarUsuarios()
  }
  const eliminarUsuario = async (id) => {
    await apiUsuarios.delete(id)
    await cargarUsuarios()
  }

  // ── VENTAS ────────────────────────────────────────────────
  const agregarVenta = async (ventaData) => {
    const res = await apiVentas.create({
      total:      ventaData.total,
      origen:     ventaData.origen || 'directo',
      id_usuario: ventaData.id_usuario || null,
      devuelta:   false,
      metodo_pago: {
        metodo:         ventaData.metodoPago,
        monto_recibido: ventaData.datosExtra?.montoRecibido || null,
        cambio:         ventaData.datosExtra?.cambio        || null,
        tipo_tarjeta:   ventaData.datosExtra?.tipo          || null,
        terminacion:    ventaData.datosExtra?.terminacion   || null,
        num_trans:      ventaData.datosExtra?.transaccion   || null,
        referencia:     ventaData.datosExtra?.referencia    || null,
      },
      items: (ventaData.carrito || []).map(item => ({
        id_prod: item.id_prod, talla: item.talla,
        cantidad: item.cantidad, precio_unit: item.precio,
      })),
    })
    await cargarVentas()
    await cargarProductos()
    return res
  }

  // ── SUMINISTROS ───────────────────────────────────────────
  const agregarSuministro = async (s) => {
    await apiSuministros.create({ 
      nombre:     s.producto, 
      tipo:       s.tipo,        // ← esta línea faltaba
      cantidad:   s.cantidad, 
      precio:     s.precio, 
      id_usuario: null 
    })
    await cargarSuministros()
  }

  const actualizarSuministro = async (id, s) => {
    await apiSuministros.update(id, { 
      nombre:   s.producto, 
      tipo:     s.tipo,          // ← agrega esta línea
      cantidad: s.cantidad, 
      precio:   s.precio 
    })
    await cargarSuministros()
  }
  const eliminarSuministro = async (id) => {
    await apiSuministros.delete(id)
    await cargarSuministros()
  }

  // ── APARTADOS ─────────────────────────────────────────────
  const agregarApartado = async (ap) => {
    await apiApartados.create({
      nom_cliente: ap.nombre, telefono: ap.telefono,
      anticipo: ap.anticipo, total_ap: ap.total,
      items: (ap.productosDetalle || []).map(item => ({
        id_prod: item.id_prod, talla: item.talla,
        cantidad: item.cantidad, precio_unit: item.precio,
      })),
    })
    await cargarApartados()
  }
  const actualizarApartado = async (id, datos) => {
    await apiApartados.update(id, { anticipo: datos.anticipo, estado: datos.estado })
    await cargarApartados()
  }
  const eliminarApartado = async (id) => {
    await apiApartados.delete(id)
    await cargarApartados()
  }

  // ── MAYOREOS ──────────────────────────────────────────────
  const agregarMayoreo = async (m) => {
    await apiMayoreos.create({
      nombre: m.cliente, telefono: m.telefono, total: m.precio,
      n_pedido: m.n_pedido || null, id_usuario: null,
      items: (m.productos || []).map(item => ({
        id_prod:     item.id_prod,
        ch_cant:     item.stockChica  || 0,
        m_cant:      item.stockMediana || 0,
        g_cant:      item.stockGrande  || 0,
        precio_unit: item.precio      || 0,
      })),
    })
    await cargarMayoreos()  // ← faltaba esto
  }

  const eliminarMayoreo = async (id) => {
    await apiMayoreos.delete(id)
    await cargarMayoreos()
  }

  return (
    <SancotContext.Provider value={{
      ventas, setVentas, suministros, setSuministros,
      inventario, setInventario, mayoreos, setMayoreos,
      apartados, setApartados, usuarios, setUsuarios,
      totalIngresos, totalEgresos, balance,
      agregarProducto, actualizarProducto, eliminarProducto,
      agregarUsuario, actualizarUsuario, eliminarUsuario,
      agregarVenta,
      agregarSuministro, actualizarSuministro, eliminarSuministro,
      agregarApartado, actualizarApartado, eliminarApartado,
      agregarMayoreo, eliminarMayoreo,
    }}>
      {children}
    </SancotContext.Provider>
  )
}

export function useSancot() {
  return useContext(SancotContext)
}
