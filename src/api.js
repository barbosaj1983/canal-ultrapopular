const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000"

export const saveToken  = (t) => localStorage.setItem("canal_token", t)
export const getToken   = ()  => localStorage.getItem("canal_token")
export const removeToken= ()  => localStorage.removeItem("canal_token")
export const saveUser   = (u) => localStorage.setItem("canal_user", JSON.stringify(u))
export const getUser    = ()  => { try { return JSON.parse(localStorage.getItem("canal_user")) } catch { return null } }
export const removeUser = ()  => localStorage.removeItem("canal_user")

async function api(path, options = {}) {
  const token = getToken()
  const headers = { "Content-Type": "application/json", ...options.headers }
  if (token) headers["Authorization"] = `Bearer ${token}`
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })
  if (res.status === 401) { removeToken(); removeUser(); window.location.href = "/"; return }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.detail || "Erro na requisição")
  return data
}

export const authAPI = {
  login:       (email, password) => api("/auth/login",       { method: "POST", body: JSON.stringify({ email, password }) }),
  cadastro:    (form)            => api("/auth/cadastro",    { method: "POST", body: JSON.stringify(form) }),
  resetPedido: (email)           => api("/auth/reset-pedido",{ method: "POST", body: JSON.stringify({ email }) }),
}

export const mensagensAPI = {
  enviar: (tipo, setor_destino, mensagem) => api("/mensagens/enviar", { method: "POST", body: JSON.stringify({ tipo, setor_destino, mensagem }) }),
  minhas: () => api("/mensagens/me"),
}

export const adminAPI = {
  funcionarios: ()          => api("/admin/funcionarios"),
  bloquear:     (id)        => api("/admin/bloquear",    { method: "POST", body: JSON.stringify({ funcionario_id: id }) }),
  desbloquear:  (id)        => api("/admin/desbloquear", { method: "POST", body: JSON.stringify({ funcionario_id: id }) }),
  resetPedidos: ()          => api("/admin/reset-pedidos"),
  resetSenha:   (email, nova_senha) => api("/admin/reset-senha", { method: "POST", body: JSON.stringify({ email, nova_senha }) }),
  mensagens:    (filtros={})=> { const p = new URLSearchParams(filtros).toString(); return api(`/admin/mensagens${p?"?"+p:""}`) },
  logs:         ()          => api("/admin/logs"),
}
