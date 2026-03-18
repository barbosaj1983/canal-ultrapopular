import { useEffect, useState } from "react"
import { adminAPI } from "./api"
import * as XLSX from "xlsx"

const SETORES = ["Atendimento","Conferencia de Caixa","Estoque","Perfumaria","Financeiro","RH","Farmaceutico","TI","Supervisao","Diretoria","Callcenter","Manutencao","Gerencia"]

const TIPO_BADGE = {
  sugestao:  "bg-blue-100 text-blue-700",
  reclamacao:"bg-yellow-100 text-yellow-700",
  denuncia:  "bg-red-100 text-red-700"
}

export default function AdminPanel({ user, onLogout }) {
  const [funcionarios, setFuncionarios] = useState([])
  const [mensagens, setMensagens]       = useState([])
  const [logs, setLogs]                 = useState([])
  const [resets, setResets]             = useState([])
  const [filtros, setFiltros]           = useState({ tipo:"", setor:"", data:"" })
  const [loading, setLoading]           = useState(true)
  const [aba, setAba]                   = useState("mensagens")

  useEffect(() => { fetchTudo() }, [])

  const fetchTudo = async () => {
    setLoading(true)
    try {
      const [f,m,l,r] = await Promise.all([
        adminAPI.funcionarios(), adminAPI.mensagens(),
        adminAPI.logs(), adminAPI.resetPedidos()
      ])
      setFuncionarios(f); setMensagens(m); setLogs(l); setResets(r)
    } catch (err) { alert("Erro ao carregar: " + err.message) }
    finally { setLoading(false) }
  }

  const handleFiltro = async (novo) => {
    const f = {...filtros, ...novo}; setFiltros(f)
    const p = Object.fromEntries(Object.entries(f).filter(([,v])=>v))
    setMensagens(await adminAPI.mensagens(p))
  }

  const resetarSenha = async (email) => {
    const nova = prompt("Nova senha para " + email + " (minimo 6 caracteres):")
    if (!nova || nova.length < 6) { alert("Senha curta ou cancelada."); return }
    try { await adminAPI.resetSenha(email, nova); alert("Senha atualizada!"); fetchTudo() }
    catch (err) { alert("Erro: " + err.message) }
  }

  const bloquear = async (id, nome) => {
    if (!window.confirm("Bloquear " + nome + "?")) return
    try { await adminAPI.bloquear(id); fetchTudo() }
    catch (err) { alert(err.message) }
  }

  const desbloquear = async (id, nome) => {
    if (!window.confirm("Desbloquear " + nome + "?")) return
    try { await adminAPI.desbloquear(id); fetchTudo() }
    catch (err) { alert(err.message) }
  }

  const exportarExcel = () => {
    const ws = XLSX.utils.json_to_sheet(mensagens.map(m => ({
      Data:            new Date(m.created_at).toLocaleString("pt-BR"),
      Nome:            m.nome,
      Email:           m.user_email,
      "Setor Origem":  m.setor_origem || "",
      "Setor Destino": m.setor,
      Tipo:            m.tipo,
      Mensagem:        m.mensagem,
      Protocolo:       m.protocolo,
      Hash:            m.hash
    })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Mensagens")
    XLSX.writeFile(wb, "auditoria_" + new Date().toISOString().split("T")[0] + ".xlsx")
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-gray-500 text-sm">Carregando painel...</p>
      </div>
    </div>
  )

  const totalDenuncias   = mensagens.filter(m => m.tipo === "denuncia").length
  const totalReclamacoes = mensagens.filter(m => m.tipo === "reclamacao").length
  const totalSugestoes   = mensagens.filter(m => m.tipo === "sugestao").length

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Topbar */}
      <div className="bg-gradient-to-r from-blue-800 to-blue-600 px-6 py-4 flex justify-between items-center shadow">
        <div>
          <h1 className="text-white font-bold text-lg">Painel Administrativo</h1>
          <p className="text-blue-200 text-xs">Canal Ultra Popular — {user.nome_completo}</p>
        </div>
        <button onClick={onLogout}
          className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white text-sm px-4 py-2 rounded-lg transition-colors">
          Sair
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* Cards de resumo */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total de mensagens", valor: mensagens.length, cor: "bg-blue-50 border-blue-200 text-blue-700" },
            { label: "Denuncias",          valor: totalDenuncias,   cor: "bg-red-50 border-red-200 text-red-700" },
            { label: "Reclamacoes",        valor: totalReclamacoes, cor: "bg-yellow-50 border-yellow-200 text-yellow-700" },
            { label: "Sugestoes",          valor: totalSugestoes,   cor: "bg-green-50 border-green-200 text-green-700" }
          ].map(c => (
            <div key={c.label} className={"border rounded-xl p-4 " + c.cor}>
              <p className="text-2xl font-bold">{c.valor}</p>
              <p className="text-xs font-medium mt-0.5 opacity-80">{c.label}</p>
            </div>
          ))}
        </div>

        {/* Alertas de reset */}
        {resets.length > 0 && (
          <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 mb-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
              <p className="font-bold text-red-800 text-sm">{resets.length} solicitacao(oes) de reset pendente(s)</p>
            </div>
            <div className="flex flex-col gap-2">
              {resets.map(r => (
                <div key={r.id} className="flex items-center justify-between bg-white rounded-lg px-4 py-2 border border-red-200">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{r.nome_completo}</p>
                    <p className="text-xs text-gray-500">{r.user_email}</p>
                  </div>
                  <button onClick={() => resetarSenha(r.user_email)}
                    className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors">
                    Redefinir senha
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Abas */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex border-b border-gray-200">
            {[
              { id: "mensagens",    label: "Mensagens",     badge: mensagens.length },
              { id: "funcionarios", label: "Funcionarios",  badge: funcionarios.length },
              { id: "logs",         label: "Logs",          badge: null }
            ].map(a => (
              <button key={a.id} onClick={() => setAba(a.id)}
                className={"flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-all " +
                  (aba === a.id
                    ? "border-blue-600 text-blue-700 bg-blue-50"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50")}>
                {a.label}
                {a.badge !== null && (
                  <span className={"text-xs px-2 py-0.5 rounded-full font-bold " +
                    (aba === a.id ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500")}>
                    {a.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Mensagens */}
          {aba === "mensagens" && (
            <div className="p-5">
              <div className="flex flex-wrap gap-3 mb-4 items-center">
                <button onClick={exportarExcel}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Exportar Excel
                </button>
                <select className="border border-gray-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-400"
                  value={filtros.tipo} onChange={e => handleFiltro({tipo: e.target.value})}>
                  <option value="">Todos os tipos</option>
                  <option value="sugestao">Sugestao</option>
                  <option value="reclamacao">Reclamacao</option>
                  <option value="denuncia">Denuncia</option>
                </select>
                <select className="border border-gray-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-400"
                  value={filtros.setor} onChange={e => handleFiltro({setor: e.target.value})}>
                  <option value="">Todos os setores</option>
                  {SETORES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <input type="date" className="border border-gray-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-blue-400"
                  value={filtros.data} onChange={e => handleFiltro({data: e.target.value})} />
              </div>

              <div className="overflow-auto rounded-xl border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {["Data","Nome","Origem","Destino","Tipo","Mensagem","Protocolo"].map(h => (
                        <th key={h} className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {mensagens.length === 0 && (
                      <tr><td colSpan={7} className="px-3 py-8 text-center text-gray-400 text-sm">Nenhuma mensagem encontrada</td></tr>
                    )}
                    {mensagens.map(m => (
                      <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-500">{new Date(m.created_at).toLocaleString("pt-BR")}</td>
                        <td className="px-3 py-3 font-medium text-gray-800">{m.nome}</td>
                        <td className="px-3 py-3 text-gray-500 text-xs">{m.setor_origem || "—"}</td>
                        <td className="px-3 py-3 text-gray-500 text-xs">{m.setor}</td>
                        <td className="px-3 py-3">
                          <span className={"text-xs px-2 py-1 rounded-full font-semibold " + (TIPO_BADGE[m.tipo] || "bg-gray-100 text-gray-600")}>
                            {m.tipo}
                          </span>
                        </td>
                        <td className="px-3 py-3 max-w-xs">
                          <p className="truncate text-gray-700">{m.mensagem}</p>
                        </td>
                        <td className="px-3 py-3 font-mono text-xs text-blue-600 whitespace-nowrap">{m.protocolo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Funcionarios */}
          {aba === "funcionarios" && (
            <div className="p-5">
              <div className="overflow-auto rounded-xl border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {["Nome","E-mail","Setor","Status","Acoes"].map(h => (
                        <th key={h} className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {funcionarios.map(f => (
                      <tr key={f.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xs flex-shrink-0">
                              {f.nome_completo.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-gray-800">{f.nome_completo}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-gray-500 text-xs">{f.email}</td>
                        <td className="px-3 py-3 text-gray-600 text-xs">{f.setor}</td>
                        <td className="px-3 py-3">
                          <span className={"text-xs px-2 py-1 rounded-full font-semibold " + (f.ativo ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                            {f.ativo ? "Ativo" : "Bloqueado"}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          {!f.is_admin && (
                            <div className="flex gap-2">
                              <button onClick={() => resetarSenha(f.email)}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors">
                                Redefinir senha
                              </button>
                              {f.ativo
                                ? <button onClick={() => bloquear(f.id, f.nome_completo)}
                                    className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors">
                                    Bloquear
                                  </button>
                                : <button onClick={() => desbloquear(f.id, f.nome_completo)}
                                    className="bg-gray-500 hover:bg-gray-600 text-white text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors">
                                    Desbloquear
                                  </button>
                              }
                            </div>
                          )}
                          {f.is_admin && <span className="text-xs text-gray-400 italic">Administrador</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Logs */}
          {aba === "logs" && (
            <div className="p-5">
              <div className="overflow-auto max-h-96 rounded-xl border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                    <tr>
                      {["Data/Hora","Usuario","Acao","Status","IP"].map(h => (
                        <th key={h} className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {logs.map(l => (
                      <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-500">{new Date(l.timestamp).toLocaleString("pt-BR")}</td>
                        <td className="px-3 py-3 text-gray-700">{l.nome_completo || l.user_email || "—"}</td>
                        <td className="px-3 py-3 text-gray-600">{l.acao}</td>
                        <td className="px-3 py-3">
                          <span className={"text-xs px-2 py-1 rounded-full font-semibold " + (l.status === "enviado" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600")}>
                            {l.status}
                          </span>
                        </td>
                        <td className="px-3 py-3 font-mono text-xs text-gray-500">{l.ip}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
