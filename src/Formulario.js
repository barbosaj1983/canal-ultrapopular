import { useState } from "react"
import { mensagensAPI } from "./api"
import html2pdf from "html2pdf.js"

const SETORES = [
  "Atendimento","Conferencia de Caixa","Estoque","Perfumaria",
  "Financeiro","RH","Farmaceutico","TI",
  "Supervisao","Diretoria","Callcenter","Manutencao","Gerencia"
]

export default function Formulario({ user, onLogout }) {
  const [tipo, setTipo]                 = useState("sugestao")
  const [setorDestino, setSetorDestino] = useState("")
  const [mensagem, setMensagem]         = useState("")
  const [enviado, setEnviado]           = useState(false)
  const [protocolo, setProtocolo]       = useState("")
  const [hashGerado, setHashGerado]     = useState("")
  const [loading, setLoading]           = useState(false)
  const [erro, setErro]                 = useState("")

  const handleEnviar = async (e) => {
    e.preventDefault(); setErro(""); setLoading(true)
    try {
      const r = await mensagensAPI.enviar(tipo, setorDestino, mensagem)
      setProtocolo(r.protocolo); setHashGerado(r.hash); setEnviado(true)
    } catch (err) { setErro(err.message) }
    finally { setLoading(false) }
  }

  const imprimirPDF = () => {
    const conteudo = [
      '<div style="font-family:sans-serif;padding:20px">',
      '<h1>Protocolo de Mensagem Confidencial</h1>',
      '<p><strong>Nome:</strong> ' + user.nome_completo + '</p>',
      '<p><strong>Setor origem:</strong> ' + user.setor + '</p>',
      '<p><strong>Setor destino:</strong> ' + setorDestino + '</p>',
      '<p><strong>Data:</strong> ' + new Date().toLocaleString("pt-BR") + '</p>',
      '<hr/>',
      '<p><strong>Protocolo:</strong> ' + protocolo + '</p>',
      '<p><strong>Hash SHA-256:</strong> ' + hashGerado + '</p>',
      '</div>'
    ].join("")

    html2pdf().set({
      margin: 10,
      filename: "protocolo-" + protocolo + ".pdf",
      jsPDF: { unit: "mm", format: "a4" }
    }).from(conteudo).save()
  }

  return (
    <div className="relative max-w-xl mx-auto mt-10 p-6 bg-white shadow rounded">
      <div className="flex justify-between items-center mb-3">
        <div>
          <h2 className="text-xl font-bold">Nova mensagem</h2>
          <p className="text-xs text-gray-500">{user.nome_completo} · {user.setor}</p>
        </div>
        <button onClick={onLogout} className="text-sm text-red-600 underline">Sair</button>
      </div>

      <p className="text-sm text-gray-600 italic mb-4">
        Mensagens 100% confidenciais.
      </p>

      {!enviado && (
        <div className="mb-4 text-yellow-700 bg-yellow-50 border border-yellow-200 p-3 rounded text-sm">
          <strong>RASCUNHO:</strong> ainda nao enviado. Sem validade juridica.
        </div>
      )}

      {enviado && (
        <div className="mb-4 text-green-700 bg-green-50 border border-green-200 p-3 rounded text-sm">
          <strong>ENVIADO.</strong> Protocolo: <strong className="font-mono">{protocolo}</strong>
          <div className="flex gap-3 mt-2">
            <button onClick={imprimirPDF} className="underline text-sm text-blue-700">Imprimir PDF</button>
            <button
              onClick={() => { setEnviado(false); setMensagem(""); setSetorDestino("") }}
              className="underline text-sm text-gray-600">
              Nova mensagem
            </button>
          </div>
        </div>
      )}

      {!enviado && (
        <form onSubmit={handleEnviar} className="flex flex-col gap-3">
          <label className="font-semibold text-sm">Tipo</label>
          <select className="p-2 border rounded" value={tipo} onChange={e => setTipo(e.target.value)}>
            <option value="sugestao">Sugestao</option>
            <option value="reclamacao">Reclamacao</option>
            <option value="denuncia">Denuncia</option>
          </select>

          <label className="font-semibold text-sm">Setor destinatario</label>
          <select className="p-2 border rounded" value={setorDestino}
            onChange={e => setSetorDestino(e.target.value)} required>
            <option value="">Selecione o setor</option>
            {SETORES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <label className="font-semibold text-sm">Mensagem</label>
          <textarea className="p-2 border rounded min-h-32"
            placeholder="Digite sua mensagem..."
            value={mensagem} onChange={e => setMensagem(e.target.value)} required />

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-semibold text-sm">Nome</label>
              <input className="w-full p-2 border rounded bg-gray-50 text-sm"
                value={user.nome_completo} disabled />
            </div>
            <div>
              <label className="font-semibold text-sm">Setor</label>
              <input className="w-full p-2 border rounded bg-gray-50 text-sm"
                value={user.setor} disabled />
            </div>
          </div>

          {erro && <p className="text-red-600 text-sm">{erro}</p>}

          <button type="submit" disabled={loading}
            className="bg-green-600 text-white p-2 rounded hover:bg-green-700 disabled:opacity-50">
            {loading ? "Enviando..." : "Enviar mensagem"}
          </button>
        </form>
      )}
    </div>
  )
}
