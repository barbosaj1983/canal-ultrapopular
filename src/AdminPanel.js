import { useEffect, useState } from "react"
import { adminAPI } from "./api"
import * as XLSX from "xlsx"

const SETORES = ["Atendimento","Conferencia de Caixa","Estoque","Perfumaria","Financeiro","RH","Farmacêutico","TI","Supervisao","Diretoria","Callcenter","Manutencao","Gerência"]

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
      const [f,m,l,r] = await Promise.all([adminAPI.funcionarios(), adminAPI.mensagens(), adminAPI.logs(), adminAPI.resetPedidos()])
      setFuncionarios(f); setMensagens(m); setLogs(l); setResets(r)
    } catch (err) { alert("Erro: " + err.message) }
    finally { setLoading(false) }
  }

  const handleFiltro = async (novo) => {
    const f = {...filtros, ...novo}; setFiltros(f)
    const p = Object.fromEntries(Object.entries(f).filter(([,v])=>v))
    setMensagens(await adminAPI.mensagens(p))
  }

  const resetarSenha = async (email) => {
    const nova = prompt(\`Nova senha para \${email} (mín. 6 caracteres):\`)
    if (!nova || nova.length < 6) { alert("Senha curta ou cancelada."); return }
    try { await adminAPI.resetSenha(email, nova); alert("Senha atualizada!"); fetchTudo() }
    catch (err) { alert("Erro: " + err.message) }
  }

  const bloquear = async (id, nome) => {
    if (!window.confirm(\`Bloquear \${nome}?\`)) return
    try { await adminAPI.bloquear(id); fetchTudo() } catch (err) { alert(err.message) }
  }

  const desbloquear = async (id, nome) => {
    if (!window.confirm(\`Desbloquear \${nome}?\`)) return
    try { await adminAPI.desbloquear(id); fetchTudo() } catch (err) { alert(err.message) }
  }

  const exportarExcel = () => {
    const ws = XLSX.utils.json_to_sheet(mensagens.map(m => ({
      Data: new Date(m.created_at).toLocaleString("pt-BR"), Nome: m.nome, Email: m.user_email,
      "Setor Origem": m.setor_origem||"", "Setor Destino": m.setor,
      Tipo: m.tipo, Mensagem: m.mensagem, Protocolo: m.protocolo, Hash: m.hash
    })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Mensagens")
    XLSX.writeFile(wb, \`auditoria_\${new Date().toISOString().split("T")[0]}.xlsx\`)
  }

  const btnAba = (id, label) => (
    <button onClick={() => setAba(id)}
      className={\`px-4 py-2 text-sm rounded-t border-b-2 \${aba===id?"border-blue-600 font-semibold text-blue-700":"border-transparent text-gray-500 hover:text-gray-700"}\`}>
      {label}
    </button>
  )

  if (loading) return <p className="text-center mt-20 text-gray-500">Carregando painel...</p>

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-4">
        <div><h1 className="text-2xl font-bold">Painel Administrativo</h1>
          <p className="text-sm text-gray-500">Logado como {user.nome_completo}</p></div>
        <button onClick={onLogout} className="text-sm text-red-600 underline">Sair</button>
      </div>

      {resets.length > 0 && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">
          🔴 <strong>{resets.length}</strong> reset(s) pendente(s):
          {resets.map(r => (
            <div key={r.id} className="flex items-center gap-3 mt-1">
              <span>{r.nome_completo} — {r.user_email}</span>
              <button onClick={() => resetarSenha(r.user_email)} className="bg-red-600 text-white text-xs px-2 py-1 rounded">Redefinir senha</button>
            </div>
          ))}
        </div>
      )}

      <div className="border-b mb-4 flex gap-1">
        {btnAba("mensagens",    \`Mensagens (\${mensagens.length})\`)}
        {btnAba("funcionarios", \`Funcionários (\${funcionarios.length})\`)}
        {btnAba("logs",         \`Logs (\${logs.length})\`)}
      </div>

      {aba === "mensagens" && (
        <>
          <div className="flex flex-wrap gap-3 mb-4">
            <button onClick={exportarExcel} className="bg-green-600 text-white px-4 py-2 rounded text-sm">Exportar Excel</button>
            <select className="border p-2 rounded text-sm" value={filtros.tipo} onChange={e => handleFiltro({tipo:e.target.value})}>
              <option value="">Todos os tipos</option>
              <option value="sugestao">Sugestão</option><option value="reclamacao">Reclamação</option><option value="denuncia">Denúncia</option>
            </select>
            <select className="border p-2 rounded text-sm" value={filtros.setor} onChange={e => handleFiltro({setor:e.target.value})}>
              <option value="">Todos os setores</option>{SETORES.map(s=><option key={s} value={s}>{s}</option>)}
            </select>
            <input type="date" className="border p-2 rounded text-sm" value={filtros.data} onChange={e => handleFiltro({data:e.target.value})} />
          </div>
          <div className="overflow-auto">
            <table className="w-full text-sm border">
              <thead className="bg-gray-100"><tr>
                {["Data","Nome","Setor Origem","Destino","Tipo","Mensagem","Protocolo"].map(h=><th key={h} className="border px-2 py-1 text-left">{h}</th>)}
              </tr></thead>
              <tbody>{mensagens.map(m=>(
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="border px-2 py-1 whitespace-nowrap">{new Date(m.created_at).toLocaleString("pt-BR")}</td>
                  <td className="border px-2 py-1">{m.nome}</td>
                  <td className="border px-2 py-1">{m.setor_origem||"—"}</td>
                  <td className="border px-2 py-1">{m.setor}</td>
                  <td className="border px-2 py-1 capitalize">{m.tipo}</td>
                  <td className="border px-2 py-1 max-w-xs truncate">{m.mensagem}</td>
                  <td className="border px-2 py-1 font-mono text-xs text-blue-700">{m.protocolo}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </>
      )}

      {aba === "funcionarios" && (
        <div className="overflow-auto"><table className="w-full text-sm border">
          <thead className="bg-gray-100"><tr>
            {["Nome","E-mail","Setor","Status","Ações"].map(h=><th key={h} className="border px-2 py-1 text-left">{h}</th>)}
          </tr></thead>
          <tbody>{funcionarios.map(f=>(
            <tr key={f.id} className="hover:bg-gray-50">
              <td className="border px-2 py-1">{f.nome_completo}</td>
              <td className="border px-2 py-1">{f.email}</td>
              <td className="border px-2 py-1">{f.setor}</td>
              <td className="border px-2 py-1">
                <span className={\`text-xs px-2 py-0.5 rounded-full \${f.ativo?"bg-green-100 text-green-700":"bg-red-100 text-red-700"}\`}>
                  {f.ativo?"Ativo":"Bloqueado"}
                </span>
              </td>
              <td className="border px-2 py-1 flex gap-2">{!f.is_admin&&(
                <>
                  <button onClick={()=>resetarSenha(f.email)} className="bg-blue-600 text-white text-xs px-2 py-1 rounded">Redefinir senha</button>
                  {f.ativo
                    ?<button onClick={()=>bloquear(f.id,f.nome_completo)} className="bg-red-600 text-white text-xs px-2 py-1 rounded">Bloquear</button>
                    :<button onClick={()=>desbloquear(f.id,f.nome_completo)} className="bg-gray-600 text-white text-xs px-2 py-1 rounded">Desbloquear</button>
                  }
                </>
              )}</td>
            </tr>
          ))}</tbody>
        </table></div>
      )}

      {aba === "logs" && (
        <div className="overflow-auto max-h-[500px]"><table className="w-full text-sm border">
          <thead className="bg-gray-100"><tr>
            {["Data/Hora","Usuário","Ação","Status","IP"].map(h=><th key={h} className="border px-2 py-1 text-left">{h}</th>)}
          </tr></thead>
          <tbody>{logs.map(l=>(
            <tr key={l.id} className="hover:bg-gray-50">
              <td className="border px-2 py-1 whitespace-nowrap">{new Date(l.timestamp).toLocaleString("pt-BR")}</td>
              <td className="border px-2 py-1">{l.nome_completo||l.user_email||"—"}</td>
              <td className="border px-2 py-1">{l.acao}</td>
              <td className="border px-2 py-1">{l.status}</td>
              <td className="border px-2 py-1 font-mono text-xs">{l.ip}</td>
            </tr>
          ))}</tbody>
        </table></div>
      )}
    </div>
  )
}
