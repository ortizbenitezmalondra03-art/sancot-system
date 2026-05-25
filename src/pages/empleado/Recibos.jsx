import { useSancot } from '../../context/SancotContext'
import './Recibos.css'

function Recibos() {
  const { ventas } = useSancot()

  // Solo ventas no devueltas
  const ventasValidas = ventas.filter(v => !v.devuelta)

  // ── Imprimir recibo individual ───────────────────────────
  const imprimirRecibo = (v) => {
    const fecha = new Date(v.fecha).toLocaleString('es-MX')
    const productos = v.productos?.join('\n  - ') || '—'
    const contenido = `
==============================
         SANCOT
==============================
Fecha:    ${fecha}
Método:   ${v.metodoPago}
------------------------------
Productos:
  - ${productos}
------------------------------
Total:    $${v.total.toFixed(2)}
${v.metodoPago === 'Efectivo' && v.datosExtra
  ? `Recibido: $${v.datosExtra.montoRecibido?.toFixed(2)}
Cambio:   $${v.datosExtra.cambio?.toFixed(2)}`
  : ''}
==============================
      ¡Gracias por su compra!
==============================
    `.trim()

    const ventana = window.open('', '_blank', 'width=300,height=500')
    ventana.document.write(`<pre style="font-family:monospace;padding:20px">${contenido}</pre>`)
    ventana.document.close()
    ventana.print()
  }

  // ── Agrupar por fecha ────────────────────────────────────
  const agrupadosPorFecha = ventasValidas.reduce((acc, v) => {
    const fecha = new Date(v.fecha).toLocaleDateString('es-MX', {
      weekday: 'long', day: 'numeric',
      month: 'long', year: 'numeric'
    })
    if (!acc[fecha]) acc[fecha] = []
    acc[fecha].push(v)
    return acc
  }, {})

  return (
    <div className="rec-wrap">
      <h5 className="rec-titulo">Recibos</h5>

      {ventasValidas.length === 0 ? (
        <div className="rec-empty">
          Sin recibos generados. Las ventas aparecerán aquí.
        </div>
      ) : (
        Object.entries(agrupadosPorFecha)
          .reverse()
          .map(([fecha, lista]) => (
            <div className="rec-grupo" key={fecha}>

              {/* Encabezado de fecha */}
              <div className="rec-fecha-header">
                <span className="rec-fecha-label">{fecha}</span>
                <span className="rec-fecha-total">
                  ${lista.reduce((a, v) => a + v.total, 0).toFixed(2)}
                  {' '}· {lista.length} venta{lista.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Recibos del día */}
              <div className="rec-lista">
                {[...lista].reverse().map((v, i) => (
                  <div className="rec-card" key={i}>

                    <div className="rec-card-top">
                      <div className="rec-hora">
                        {new Date(v.fecha).toLocaleTimeString('es-MX', {
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </div>
                      <span className={`rec-metodo metodo-${v.metodoPago?.toLowerCase()}`}>
                        {v.metodoPago}
                      </span>
                    </div>

                    <div className="rec-productos">
                      {v.productos?.map((p, j) => (
                        <span key={j} className="rec-prod-tag">{p}</span>
                      ))}
                    </div>

                    <div className="rec-card-bottom">
                      <div className="rec-detalles">
                        {v.metodoPago === 'Efectivo' && v.datosExtra && (
                          <span className="rec-detalle-item">
                            Cambio: ${v.datosExtra.cambio?.toFixed(2)}
                          </span>
                        )}
                        {v.metodoPago === 'Tarjeta' && v.datosExtra && (
                          <span className="rec-detalle-item">
                            {v.datosExtra.tipo} ···{v.datosExtra.terminacion}
                          </span>
                        )}
                        {v.metodoPago === 'Transferencia' && v.datosExtra && (
                          <span className="rec-detalle-item">
                            Ref: {v.datosExtra.transaccion}
                          </span>
                        )}
                      </div>

                      <div className="rec-card-right">
                        <span className="rec-total">
                          ${v.total.toFixed(2)}
                        </span>
                        <button
                          className="btn-imprimir"
                          onClick={() => imprimirRecibo(v)}
                        >
                          Imprimir
                        </button>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            </div>
          ))
      )}
    </div>
  )
}

export default Recibos