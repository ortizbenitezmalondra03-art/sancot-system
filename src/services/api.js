// src/services/api.js
// ─────────────────────────────────────────────────────────
//  Todas las llamadas a la API de Python en un solo lugar
// ─────────────────────────────────────────────────────────

const BASE = 'http://localhost:5000'

const post = (url, body) =>
  fetch(`${BASE}${url}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(r => r.json())

const put = (url, body) =>
  fetch(`${BASE}${url}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(r => r.json())

const del = (url) =>
  fetch(`${BASE}${url}`, { method: 'DELETE' }).then(r => r.json())

const get = (url) =>
  fetch(`${BASE}${url}`).then(r => r.json())

// ── PRODUCTOS ─────────────────────────────────────────────
export const apiProductos = {
  getAll:  ()       => get('/productos'),
  create:  (data)   => post('/productos', data),
  update:  (id, data) => put(`/productos/${id}`, data),
  delete:  (id)     => del(`/productos/${id}`),
}

// ── USUARIOS ──────────────────────────────────────────────
export const apiUsuarios = {
  getAll:  ()         => get('/usuarios'),
  getOne:  (id)       => get(`/usuarios/${id}`),
  create:  (data)     => post('/usuarios', data),
  update:  (id, data) => put(`/usuarios/${id}`, data),
  delete:  (id)       => del(`/usuarios/${id}`),
}

// ── VENTAS ────────────────────────────────────────────────
export const apiVentas = {
  getAll:  ()     => get('/ventas'),
  getOne:  (id)   => get(`/ventas/${id}`),
  create:  (data) => post('/ventas', data),
}

// ── SUMINISTROS ───────────────────────────────────────────
export const apiSuministros = {
  getAll:  ()         => get('/suministros'),
  create:  (data)     => post('/suministros', data),
  update:  (id, data) => put(`/suministros/${id}`, data),
  delete:  (id)       => del(`/suministros/${id}`),
}

// ── APARTADOS ─────────────────────────────────────────────
export const apiApartados = {
  getAll:  ()         => get('/apartados'),
  getOne:  (id)       => get(`/apartados/${id}`),
  create:  (data)     => post('/apartados', data),
  update:  (id, data) => put(`/apartados/${id}`, data),
  delete:  (id)       => del(`/apartados/${id}`),
}

// ── MAYOREOS ──────────────────────────────────────────────
export const apiMayoreos = {
  getAll:  ()     => get('/mayoreos'),
  getOne:  (id)   => get(`/mayoreos/${id}`),
  create:  (data) => post('/mayoreos', data),
  delete:  (id)   => del(`/mayoreos/${id}`),
}
