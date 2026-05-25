import { useSancot } from '../../context/SancotContext'
import './Reporte.css'

function Reportes() {
  const { ventas, setVentas } = useSancot()

  const hoy = new Date().toDateString()

  const ventasHoy = ventas.filter(v =>
    new Date(v.fecha).toDateString() === hoy
  )

  // ── Totales por método de pago ───────────────────────────
  const totalEfectivo      = ventasHoy.filter(v => v.metodoPago === 'Efectivo')
    .reduce((acc, v) => acc + v.total, 0)
  const totalTarjeta       = ventasHoy.filter(v => v.metodoPago === 'Tarjeta')
    .reduce((acc, v) => acc + v.total, 0)
  const totalTransferencia = ventasHoy.filter(v => v.metodoPago === 'Transferencia')
    .reduce((acc, v) => acc + v.total, 0)
  const totalDia           = ventasHoy.reduce((acc, v) => acc + v.total, 0)

  // ── Devolución ───────────────────────────────────────────
  const handleDevolucion = (idx) => {
    const venta = ventasHoy[idx]
    if (!window.confirm(`¿Confirmar devolución de $${venta.total.toFixed(2)}?`)) return
    const idxGlobal = ventas.findIndex(v => v.fecha === venta.fecha)
    const nuevas    = [...ventas]
    nuevas[idxGlobal] = { ...nuevas[idxGlobal], devolucion: true }
    setVentas(nuevas)
  }

  return (
    <div className="rep-wrap">
      <h5 className="rep-titulo">Reportes del día</h5>

      {/* ── Tarjetas de resumen ── */}
      <div className="rep-metrics">
        <div className="rep-card">
          <span className="rep-label">Total del día</span>
          <span className="rep-value blue">${totalDia.toFixed(2)}</span>
          <span className="rep-sub">{ventasHoy.length} ventas</span>
        </div>
        <div className="rep-card">
          <span className="rep-label">Efectivo</span>
          <span className="rep-value green">${totalEfectivo.toFixed(2)}</span>
          <span className="rep-sub">
            {ventasHoy.filter(v => v.metodoPago === 'Efectivo').length} ventas
          </span>
        </div>
        <div className="rep-card">
          <span className="rep-label">Tarjeta</span>
          <span className="rep-value purple">${totalTarjeta.toFixed(2)}</span>
          <span className="rep-sub">
            {ventasHoy.filter(v => v.metodoPago === 'Tarjeta').length} ventas
          </span>
        </div>
        <div className="rep-card">
          <span className="rep-label">Transferencia</span>
          <span className="rep-value amber">${totalTransferencia.toFixed(2)}</span>
          <span className="rep-sub">
            {ventasHoy.filter(v => v.metodoPago === 'Transferencia').length} ventas
          </span>
        </div>
      </div>

      {/* ── Tabla de ventas ── */}
      <div className="rep-tabla-wrap">
        <div className="rep-tabla-header">
          <span className="rep-tabla-titulo">Ventas de hoy</span>
        </div>
        {ventasHoy.length === 0 ? (
          <p className="rep-empty">Sin ventas registradas hoy.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-sm table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Hora</th>
                  <th>Productos</th>
                  <th>Método</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {[...ventasHoy].reverse().map((v, i) => (
                  <tr
                    key={i}
                    style={{
                      background: v.devolucion ? '#fff5f5' : 'transparent',
                      textDecoration: v.devolucion ? 'line-through' : 'none',
                      opacity: v.devolucion ? 0.6 : 1
                    }}
                  >
                    <td style={{ fontSize: '12px', color: '#888' }}>
                      {new Date(v.fecha).toLocaleTimeString('es-MX', {
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td style={{ fontSize: '12px' }}>
                      {v.productos?.join(', ') || '—'}
                    </td>
                    <td>
                      <span className={`badge-metodo metodo-${v.metodoPago?.toLowerCase()}`}>
                        {v.metodoPago}
                      </span>
                    </td>
                    <td style={{ fontWeight: 500 }}>
                      ${v.total.toFixed(2)}
                    </td>
                    <td>
                      {v.devolucion
                        ? <span className="badge-estado devuelta">Devuelta</span>
                        : <span className="badge-estado completada">Completada</span>
                      }
                    </td>
                    <td>
                      {!v.devolucion && (
                        <button
                          className="btn btn-outline-danger btn-sm"
                          style={{ fontSize: '11px', padding: '2px 8px' }}
                          onClick={() => handleDevolucion(
                            ventasHoy.length - 1 - i
                          )}
                        >
                          Devolución
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Reportes