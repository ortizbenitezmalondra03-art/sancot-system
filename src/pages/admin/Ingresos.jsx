import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bar, Pie } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  BarElement, ArcElement, Title, Tooltip, Legend
} from 'chart.js'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { useSancot } from '../../context/SancotContext'
import './Ingresos.css'

ChartJS.register(
  CategoryScale, LinearScale, BarElement,
  ArcElement, Title, Tooltip, Legend
)

const PIE_COLORS = ['#378ADD', '#7F77DD', '#EF9F27', '#1D9E75']

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const DIAS  = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']

function Ingresos() {
  const { ventas, suministros, totalIngresos, totalEgresos, balance } = useSancot()
  const [filtro, setFiltro] = useState('semanal')
  const dashboardRef        = useRef(null)
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

  // ── Agrupar ventas por día de la semana ─────────────────
  const agruparSemanal = (lista, campoValor) => {
    const mapa = { Lun: 0, Mar: 0, Mié: 0, Jue: 0, Vie: 0, Sáb: 0, Dom: 0 }
    lista.forEach(item => {
      const dia = DIAS[new Date(item.fecha).getDay()]
      if (dia in mapa) mapa[dia] += parseFloat(item[campoValor] || 0)
    })
    return mapa
  }

  // ── Agrupar ventas por mes ───────────────────────────────
  const agruparMensual = (lista, campoValor) => {
    const mapa = {}
    MESES.forEach(m => mapa[m] = 0)
    lista.forEach(item => {
      const mes = MESES[new Date(item.fecha).getMonth()]
      mapa[mes] += parseFloat(item[campoValor] || 0)
    })
    return mapa
  }

  // ── Elegir agrupación según filtro ──────────────────────
  const agrupar = (lista, campo) =>
    filtro === 'semanal'
      ? agruparSemanal(lista, campo)
      : agruparMensual(lista, campo)

  const mapaIngresos = agrupar(ventas,      'total')
  const mapaEgresos  = agrupar(suministros, 'totalCosto')

  const labels = Object.keys(mapaIngresos)

  const barData = {
    labels,
    datasets: [
      {
        label: 'Ingresos (ventas)',
        data: labels.map(l => mapaIngresos[l] || 0),
        backgroundColor: '#378ADD',
        borderRadius: 4,
      },
      {
        label: 'Egresos (suministros)',
        data: labels.map(l => mapaEgresos[l]  || 0),
        backgroundColor: '#E24B4A',
        borderRadius: 4,
      },
    ],
  }

  // ── Pie: ventas por método de pago ───────────────────────
  const metodos = ventas.reduce((acc, v) => {
    acc[v.metodoPago] = (acc[v.metodoPago] || 0) + v.total
    return acc
  }, {})

  const pieData = {
    labels: Object.keys(metodos).length > 0
      ? Object.keys(metodos)
      : ['Sin ventas'],
    datasets: [{
      data: Object.values(metodos).length > 0
        ? Object.values(metodos)
        : [1],
      backgroundColor: PIE_COLORS,
      borderWidth: 2,
    }]
  }

  // ── Tabla de movimientos filtrados ───────────────────────
  const filtrarPorPeriodo = (lista) => {
    const ahora = new Date()
    return lista.filter(item => {
      const fecha = new Date(item.fecha)
      if (filtro === 'semanal') {
        const diff = (ahora - fecha) / (1000 * 60 * 60 * 24)
        return diff <= 7
      }
      // mensual: mismo mes y año
      return (
        fecha.getMonth()    === ahora.getMonth() &&
        fecha.getFullYear() === ahora.getFullYear()
      )
    })
  }

  const movimientos = [
    ...filtrarPorPeriodo(ventas).map(v => ({
      tipo:     'Ingreso',
      concepto: `Venta — ${v.metodoPago}`,
      monto:    v.total,
      fecha:    new Date(v.fecha).toLocaleDateString('es-MX'),
    })),
    ...filtrarPorPeriodo(suministros).map(s => ({
      tipo:     'Egreso',
      concepto: `Suministro — ${s.producto}`,
      monto:    s.precio * s.cantidad,
      fecha:    s.fecha
        ? new Date(s.fecha).toLocaleDateString('es-MX')
        : '—',
    })),
  ].sort((a, b) => new Date(b.fecha) - new Date(a.fecha))

  // ── Totales del período filtrado ─────────────────────────
  const ingPeriodo = filtrarPorPeriodo(ventas)
    .reduce((acc, v) => acc + v.total, 0)
  const egrPeriodo = filtrarPorPeriodo(suministros)
    .reduce((acc, s) => acc + s.precio * s.cantidad, 0)
  const balPeriodo = ingPeriodo - egrPeriodo

  // ── Exportar PDF ─────────────────────────────────────────
  const exportarPDF = () => {
    const el = dashboardRef.current
    if (!el) return
    html2canvas(el, { scale: 2, useCORS: true }).then(canvas => {
      const imgData   = canvas.toDataURL('image/png')
      const pdf       = new jsPDF('p', 'mm', 'a4')
      const imgWidth  = 208
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      // Si el contenido es más alto que una página, agrega páginas
      const pageHeight = 295
      let position     = 0

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)

      if (imgHeight > pageHeight) {
        let remaining = imgHeight - pageHeight
        while (remaining > 0) {
          position -= pageHeight
          pdf.addPage()
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
          remaining -= pageHeight
        }
      }

      pdf.save(`Ingresos_SANCOT_${filtro}.pdf`)
    })
  }

  const labelFiltro = filtro === 'semanal' ? 'esta semana' : 'este mes'

  return (
    <>
      <div>
            {/* ── Header ── */}
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">Ingresos</h5>
              <button className="btn btn-danger btn-sm" onClick={exportarPDF}>
                <i className="fa-solid fa-file-pdf me-1"></i>
                Exportar PDF — {filtro}
              </button>
            </div>

            {/* ── Filtros ── */}
            <div className="mb-3">
              {['semanal', 'mensual'].map(f => (
                <button
                  key={f}
                  className={`btn btn-sm me-2 ingresos-filtro-btn ${filtro === f ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setFiltro(f)}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            {/* ── Todo lo que entra al PDF ── */}
            <div ref={dashboardRef}>

              {/* Título dentro del PDF */}
              <p className="ingresos-subtitle">
                Reporte {filtro} — SANCOT —{' '}
                {new Date().toLocaleDateString('es-MX', {
                  day: 'numeric', month: 'long', year: 'numeric'
                })}
              </p>

              {/* ── Tarjetas de resumen del período ── */}
              <div className="row g-3 mb-4">
                <div className="col-md-4">
                  <div className="card text-white bg-success h-100">
                    <div className="card-body">
                      <p className="mb-1 ingresos-card-title">
                        <i className="fa-solid fa-arrow-trend-up me-1"></i>
                        Ingresos {labelFiltro}
                      </p>
                      <h4 className="fw-bold mb-0">${ingPeriodo.toFixed(2)}</h4>
                      <small className="ingresos-card-small">
                        {filtrarPorPeriodo(ventas).length} ventas
                      </small>
                    </div>
                  </div>
                </div>

                <div className="col-md-4">
                  <div className="card text-white bg-danger h-100">
                    <div className="card-body">
                      <p className="mb-1 ingresos-card-title">
                        <i className="fa-solid fa-arrow-trend-down me-1"></i>
                        Egresos {labelFiltro}
                      </p>
                      <h4 className="fw-bold mb-0">${egrPeriodo.toFixed(2)}</h4>
                      <small className="ingresos-card-small">
                        {filtrarPorPeriodo(suministros).length} compras
                      </small>
                    </div>
                  </div>
                </div>

                <div className="col-md-4">
                  <div className={`card text-white h-100 ${balPeriodo >= 0 ? 'bg-primary' : 'bg-warning'}`}>
                    <div className="card-body">
                      <p className="mb-1 ingresos-card-title">
                        <i className="fa-solid fa-scale-balanced me-1"></i>
                        Balance {labelFiltro}
                      </p>
                      <h4 className="fw-bold mb-0">${balPeriodo.toFixed(2)}</h4>
                      <small className="ingresos-card-small">
                        {balPeriodo >= 0 ? 'Positivo ✓' : 'Negativo ✗'}
                      </small>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Gráficas ── */}
              <div className="row g-3 mb-4">
                <div className="col-md-7">
                  <div className="card shadow-sm h-100">
                    <div className="card-header bg-white fw-semibold ingresos-card-header">
                      <i className="fa-solid fa-chart-column text-primary me-1"></i>
                      Ingresos vs Egresos —{' '}
                      {filtro === 'semanal' ? 'por día' : 'por mes'}
                    </div>
                    <div className="card-body">
                      <div className="ingresos-chart-area">
                        <Bar
                          data={barData}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { legend: { position: 'top' } },
                            scales: { y: { beginAtZero: true } }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-md-5">
                  <div className="card shadow-sm h-100">
                    <div className="card-header bg-white fw-semibold ingresos-card-header">
                      <i className="fa-solid fa-chart-pie text-warning me-1"></i>
                      Ventas por método de pago
                    </div>
                    <div className="card-body d-flex align-items-center justify-content-center">
                      <div className="ingresos-chart-pie">
                        <Pie
                          data={pieData}
                          options={{
                            maintainAspectRatio: false,
                            plugins: { legend: { position: 'bottom' } }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Tabla de movimientos ── */}
              <div className="card shadow-sm">
                <div className="card-header bg-white fw-semibold ingresos-card-header">
                  <i className="fa-solid fa-list text-success me-1"></i>
                  Movimientos —{' '}
                  {filtro === 'semanal' ? 'últimos 7 días' : 'este mes'}
                </div>
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-hover table-sm mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Tipo</th>
                          <th>Concepto</th>
                          <th>Monto</th>
                          <th>Fecha</th>
                        </tr>
                      </thead>
                      <tbody>
                        {movimientos.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="text-center text-muted py-3">
                              Sin movimientos en este período.
                            </td>
                          </tr>
                        ) : (
                          movimientos.map((m, i) => (
                            <tr key={i}>
                              <td>
                                <span
                                  className={`badge ingresos-badge ${m.tipo === 'Ingreso' ? 'bg-success' : 'bg-danger'}`}
                                >
                                  {m.tipo}
                                </span>
                              </td>
                              <td>{m.concepto}</td>
                              <td className="fw-semibold">
                                <span className={m.tipo === 'Ingreso' ? 'ingresos-monto-ingreso' : 'ingresos-monto-egreso'}>
                                  {m.tipo === 'Ingreso' ? '+' : '-'}${parseFloat(m.monto).toFixed(2)}
                                </span>
                              </td>
                              <td className="ingresos-fecha">{m.fecha}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

            </div>
        </div>
    </>
  )
}

export default Ingresos