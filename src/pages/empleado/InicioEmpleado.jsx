import { useSancot } from '../../context/SancotContext'
import './InicioEmpleado.css'

function InicioEmpleado() {
  const { ventas, apartados } = useSancot()

  const hoy = new Date().toDateString()

  const ventasHoy = ventas.filter(v =>
    new Date(v.fecha).toDateString() === hoy
  )

  const totalHoy = ventasHoy.reduce((acc, v) => acc + v.total, 0)

  const ultimaVenta = ventas.length > 0
    ? ventas[ventas.length - 1]
    : null

  const tiempoUltimaVenta = (fechaISO) => {
    const diff = Math.floor((new Date() - new Date(fechaISO)) / 60000)
    if (diff < 1) return 'Hace un momento'
    if (diff < 60) return `Hace ${diff} min`
    const hrs = Math.floor(diff / 60)
    return `Hace ${hrs} hr${hrs > 1 ? 's' : ''}`
  }

  const apartadosActivos = apartados.filter(ap => {
    if (ap.liquidado) return false
    const dias = Math.floor(
      (new Date() - new Date(ap.fecha)) / (1000 * 60 * 60 * 24)
    )
    return dias < 10
  })

  const porVencer = apartadosActivos.filter(ap => {
    const dias = Math.floor(
      (new Date() - new Date(ap.fecha)) / (1000 * 60 * 60 * 24)
    )
    return dias >= 9
  })

  return (
    <div className="inicio-wrap">
      {porVencer.length > 0 && (
        <div className="alerta-warn">
          {porVencer.length} apartado(s) vencen manana. Avisa al cliente.
        </div>
      )}

      <div className="metrics-grid">
        <div className="metric-card">
          <span className="metric-label">Ventas hoy</span>
          <span className="metric-value blue">{ventasHoy.length}</span>
          <span className="metric-sub">
            ${totalHoy.toFixed(2)} total
          </span>
        </div>

        <div className="metric-card">
          <span className="metric-label">Ultima venta</span>
          <span className="metric-value green">
            {ultimaVenta
              ? `$${ultimaVenta.total.toFixed(2)}`
              : '-'}
          </span>
          <span className="metric-sub">
            {ultimaVenta
              ? tiempoUltimaVenta(ultimaVenta.fecha)
              : 'Sin ventas aun'}
          </span>
        </div>

        <div className="metric-card">
          <span className="metric-label">Apartados activos</span>
          <span className="metric-value amber">
            {apartadosActivos.length}
          </span>
          <span className="metric-sub">
            {porVencer.length > 0
              ? `${porVencer.length} por vencer`
              : 'Al dia'}
          </span>
        </div>
      </div>

      <div className="ultimas-wrap">
        <h6 className="ultimas-title">Ultimas ventas de hoy</h6>
        {ventasHoy.length === 0 ? (
          <p className="sin-ventas">Sin ventas registradas hoy.</p>
        ) : (
          <div className="ultimas-list">
            {[...ventasHoy].reverse().slice(0, 5).map((v, i) => (
              <div className="venta-row" key={i}>
                <div className="venta-info">
                  <span className="venta-productos">
                    {v.productos?.join(', ') || 'Venta'}
                  </span>
                  <span className="venta-hora">
                    {new Date(v.fecha).toLocaleTimeString('es-MX', {
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                </div>
                <div className="venta-derecha">
                  <span className="venta-total">
                    ${v.total.toFixed(2)}
                  </span>
                  <span className={`venta-metodo metodo-${v.metodoPago?.toLowerCase()}`}>
                    {v.metodoPago}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default InicioEmpleado
