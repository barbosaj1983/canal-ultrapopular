import { useEffect, useState } from "react"
import { supabase } from "../supabaseClient"
import * as XLSX from "xlsx"

export default function AdminPanel({ user }) {
  const [funcionarios, setFuncionarios] = useState([])
  const [mensagens, setMensagens] = useState([])
  const [logs, setLogs] = useState([])
  const [filtros, setFiltros] = useState({ tipo: "", setor: "", data: "" })

  useEffect(() => {
    async function fetchFuncionarios() {
      const { data, error } = await supabase.from("funcionarios").select("*")
      if (!error) setFuncionarios(data)
    }

    async function fetchMensagens() {
      const { data, error } = await supabase.from("mensagens").select("*").order("created_at", { ascending: false })
      if (!error) setMensagens(data)
    }

    async function fetchLogs() {
      const { data, error } = await supabase.from("logs").select("*").order("timestamp", { ascending: false })
      if (!error) setLogs(data)
    }

    fetchFuncionarios()
    fetchMensagens()
    fetchLogs()
  }, [])

  const sair = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  const exportarExcel = () => {
    const ws = XLSX.utils.json_to_sheet(mensagens.map(msg => ({
      Nome: msg.nome,
      CPF: msg.cpf,
      Email: msg.user_email,
      "Setor Origem": msg.setor_origem || "",
      "Setor Destino": msg.setor,
      Tipo: msg.tipo,
      Mensagem: msg.mensagem,
      Protocolo: msg.protocolo,
      Hash: msg.hash,
      "Data/Hora": msg.created_at
    })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Mensagens")
    XLSX.writeFile(wb, "mensagens_auditoria.xlsx")
  }

  const mensagensFiltradas = mensagens.filter(msg => {
    const tipoOk = filtros.tipo ? msg.tipo === filtros.tipo : true
    const setorOk = filtros.setor ? msg.setor === filtros.setor : true
    const dataOk = filtros.data ? msg.created_at.startsWith(filtros.data) : true
    return tipoOk && setorOk && dataOk
  })

  const setores = [
    "Atendimento", "Conferencia de Caixa", "Estoque", "Perfumaria",
    "Financeiro", "RH", "Farmacêutico", "TI",
    "Supervisao", "Diretoria", "Callcenter", "Manutencao", "Gerência"
  ]

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Painel Administrativo</h1>
        <button onClick={sair} className="text-sm text-red-600 underline">Sair</button>
      </div>

      <div className="mb-4 flex flex-wrap gap-4 items-center">
        <button
          onClick={exportarExcel}
          className="bg-blue-600 text-white px-4 py-2 rounded shadow"
        >
          Exportar Mensagens para Excel
        </button>

        <select className="border p-2 rounded" value={filtros.tipo} onChange={e => setFiltros({ ...filtros, tipo: e.target.value })}>
          <option value="">Tipo</option>
          <option value="sugestao">Sugestão</option>
          <option value="reclamacao">Reclamação</option>
          <option value="denuncia">Denúncia</option>
        </select>

        <select className="border p-2 rounded" value={filtros.setor} onChange={e => setFiltros({ ...filtros, setor: e.target.value })}>
          <option value="">Setor</option>
          {setores.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <input type="date" className="border p-2 rounded" value={filtros.data} onChange={e => setFiltros({ ...filtros, data: e.target.value })} />
      </div>

      <h2 className="text-xl font-semibold mb-2">Histórico de Mensagens</h2>
      <div className="overflow-auto">
        <table className="w-full text-sm border">
          <thead className="bg-gray-200">
            <tr>
              <th className="border px-2 py-1">Data</th>
              <th className="border px-2 py-1">Nome</th>
              <th className="border px-2 py-1">Setor</th>
              <th className="border px-2 py-1">Tipo</th>
              <th className="border px-2 py-1">Mensagem</th>
              <th className="border px-2 py-1">Protocolo</th>
              <th className="border px-2 py-1">Hash</th>
            </tr>
          </thead>
          <tbody>
            {mensagensFiltradas.map((msg) => (
              <tr key={msg.id} className="hover:bg-gray-50">
                <td className="border px-2 py-1">{new Date(msg.created_at).toLocaleString()}</td>
                <td className="border px-2 py-1">{msg.nome}</td>
                <td className="border px-2 py-1">{msg.setor}</td>
                <td className="border px-2 py-1">{msg.tipo}</td>
                <td className="border px-2 py-1 max-w-xs truncate">{msg.mensagem}</td>
                <td className="border px-2 py-1 text-xs text-blue-700 font-mono">{msg.protocolo}</td>
                <td className="border px-2 py-1 text-[10px] font-mono">{msg.hash}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="text-xl font-semibold mt-10 mb-2">📋 Logs de Auditoria</h2>
      <div className="overflow-auto max-h-[400px]">
        <table className="w-full text-sm border">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-2 py-1">Usuário</th>
              <th className="border px-2 py-1">Ação</th>
              <th className="border px-2 py-1">Status</th>
              <th className="border px-2 py-1">IP</th>
              <th className="border px-2 py-1">Data/Hora</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="border px-2 py-1">{log.user_id}</td>
                <td className="border px-2 py-1">{log.acao}</td>
                <td className="border px-2 py-1">{log.status}</td>
                <td className="border px-2 py-1">{log.ip}</td>
                <td className="border px-2 py-1">{new Date(log.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
