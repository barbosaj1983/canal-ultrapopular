import { useState, useEffect } from "react"
import { mensagensAPI } from "./api"
import html2pdf from "html2pdf.js"

const SETORES = [
  "Atendimento","Conferencia de Caixa","Estoque","Perfumaria",
  "Financeiro","RH","Farmaceutico","TI",
  "Supervisao","Diretoria","Callcenter","Manutencao","Gerencia"
]

const TIPO_LABEL = { sugestao: "Sugestao", reclamacao: "Reclamacao", denuncia: "Denuncia" }

export default function Formulario({ user, onLogout }) {
  const [tipo, setTipo]             = useState("sugestao")
  const [setorDestino, setSetor]    = useState("")
  const [mensagem, setMensagem]     = useState("")
  const [confirmado, setConfirmado] = useState(false)
  const [enviado, setEnviado]       = useState(false)
  const [protocolo, setProtocolo]   = useState("")
  const [hashGerado, setHash]       = useState("")
  const [dataEnvio, setData]        = useState("")
  const [loading, setLoading]       = useState(false)
  const [erro, setErro]             = useState("")
  const [countdown, setCountdown]   = useState(120)

  useEffect(() => {
    if (!enviado || countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [enviado, countdown])

  const handleEnviar = async (e) => {
    e.preventDefault()
    if (!confirmado) { setErro("Confirme a veracidade da mensagem antes de enviar."); return }
    setErro(""); setLoading(true)
    try {
      const r = await mensagensAPI.enviar(tipo, setorDestino, mensagem)
      setProtocolo(r.protocolo); setHash(r.hash)
      setData(new Date().toLocaleString("pt-BR"))
      setEnviado(true); setCountdown(120)
    } catch (err) { setErro(err.message) }
    finally { setLoading(false) }
  }

  const imprimirPDF = () => {
    const linhas = [
      '<div style="font-family:Arial,sans-serif;padding:32px;max-width:620px;margin:0 auto">',
      '<div style="background:#991b1b;color:white;padding:18px 24px;border-radius:8px 8px 0 0;margin-bottom:0">',
      '<h1 style="margin:0;font-size:17px">PROTOCOLO OFICIAL DE MENSAGEM CONFIDENCIAL</h1>',
      '<p style="margin:3px 0 0;font-size:11px;opacity:.8">Fale com a Diretoria — Sistema de Comunicacao Interna</p>',
      '</div>',
      '<div style="border:2px solid #991b1b;border-top:none;padding:20px;border-radius:0 0 8px 8px">',
      '<table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:16px">',
      '<tr><td style="padding:7px 10px;background:#f1f5f9;font-weight:bold;border:1px solid #cbd5e1;width:40%">Protocolo</td>',
      '<td style="padding:7px 10px;border:1px solid #cbd5e1;font-family:monospace;font-weight:bold;color:#991b1b">' + protocolo + '</td></tr>',
      '<tr><td style="padding:7px 10px;background:#f1f5f9;font-weight:bold;border:1px solid #cbd5e1">Data e Hora</td>',
      '<td style="padding:7px 10px;border:1px solid #cbd5e1">' + dataEnvio + '</td></tr>',
      '<tr><td style="padding:7px 10px;background:#f1f5f9;font-weight:bold;border:1px solid #cbd5e1">Nome</td>',
      '<td style="padding:7px 10px;border:1px solid #cbd5e1">' + user.nome_completo + '</td></tr>',
      '<tr><td style="padding:7px 10px;background:#f1f5f9;font-weight:bold;border:1px solid #cbd5e1">Setor de Origem</td>',
      '<td style="padding:7px 10px;border:1px solid #cbd5e1">' + user.setor + '</td></tr>',
      '<tr><td style="padding:7px 10px;background:#f1f5f9;font-weight:bold;border:1px solid #cbd5e1">Setor Destinatario</td>',
      '<td style="padding:7px 10px;border:1px solid #cbd5e1">' + setorDestino + '</td></tr>',
      '<tr><td style="padding:7px 10px;background:#f1f5f9;font-weight:bold;border:1px solid #cbd5e1">Tipo</td>',
      '<td style="padding:7px 10px;border:1px solid #cbd5e1">' + TIPO_LABEL[tipo] + '</td></tr>',
      '</table>',
      '<div style="background:#fefce8;border:1px solid #fbbf24;padding:12px 14px;border-radius:6px;margin-bottom:14px">',
      '<p style="margin:0 0 4px;font-weight:bold;font-size:11px;color:#92400e">HASH DE INTEGRIDADE SHA-256</p>',
      '<p style="margin:0;font-family:monospace;font-size:9px;word-break:break-all;color:#451a03">' + hashGerado + '</p>',
      '<p style="margin:6px 0 0;font-size:10px;color:#78350f">Este codigo prova que o conteudo da mensagem nao foi alterado apos o envio.</p>',
      '</div>',
      '<div style="background:#f0fdf4;border:1px solid #86efac;padding:12px 14px;border-radius:6px;margin-bottom:14px">',
      '<p style="margin:0 0 4px;font-weight:bold;font-size:11px;color:#166534">DECLARACAO DO REMETENTE</p>',
      '<p style="margin:0;font-size:11px;color:#14532d">O remetente declarou expressamente que as informacoes acima sao verdadeiras e de sua inteira responsabilidade no momento do envio.</p>',
      '</div>',
      '<div style="border-top:1px solid #e2e8f0;padding-top:12px;font-size:10px;color:#64748b">',
      '<p style="margin:0;font-style:italic">Documento com validade como registro oficial de comunicacao interna.</p>',
      '</div>',
      '</div></div>'
    ]
    html2pdf().set({
      margin: 10, filename: "protocolo-" + protocolo + ".pdf",
      html2canvas: { scale: 2 }, jsPDF: { unit: "mm", format: "a4" }
    }).from(linhas.join("")).save()
  }

  const novaMensagem = () => {
    setEnviado(false); setMensagem(""); setSetor(""); setConfirmado(false); setCountdown(120)
  }

  // ── Tela pos-envio ───────────────────────────────────────────
  if (enviado) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-red-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 border-t-4 border-green-500">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-9 h-9 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Mensagem Registrada!</h2>
            <p className="text-gray-500 text-sm mt-1">Protocolo oficial gerado com sucesso</p>
          </div>

          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-3 text-center">
            <p className="text-xs text-red-500 font-bold uppercase tracking-widest mb-1">Numero do Protocolo</p>
            <p className="font-mono text-2xl font-bold text-red-800">{protocolo}</p>
            <p className="text-xs text-red-500 mt-1">{dataEnvio}</p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
            <p className="text-xs font-bold text-amber-700 mb-1">Hash SHA-256</p>
            <p className="font-mono text-xs text-amber-800 break-all leading-relaxed">{hashGerado}</p>
          </div>

          {countdown > 0 && (
            <div className="bg-red-50 border border-red-300 rounded-lg p-3 mb-4 text-center">
              <p className="text-sm font-bold text-red-700">
                Imprima o protocolo agora! ({countdown}s)
              </p>
              <p className="text-xs text-red-500 mt-0.5">Esta tela sera apagada em breve</p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <button onClick={imprimirPDF}
              className="w-full bg-red-700 hover:bg-red-800 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
              Baixar PDF do Protocolo
            </button>
            <button onClick={novaMensagem}
              className="w-full border-2 border-gray-200 text-gray-600 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors">
              Enviar Nova Mensagem
            </button>
            <button onClick={onLogout} className="text-sm text-red-400 hover:text-red-600 hover:underline mt-1">
              Sair do sistema
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Formulario principal ─────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-red-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-red-800 to-red-600 px-6 py-5">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-white font-bold text-lg tracking-tight">Fale com a Diretoria</h1>
              <p className="text-red-200 text-xs mt-0.5">Sistema de mensagens confidenciais</p>
            </div>
            <button onClick={onLogout} className="text-red-300 hover:text-white text-xs underline transition-colors">
              Sair
            </button>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <div className="w-9 h-9 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-white font-bold">
              {user.nome_completo.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-white text-sm font-semibold">{user.nome_completo}</p>
              <p className="text-red-200 text-xs">{user.setor}</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Banner RASCUNHO */}
          <div className="mb-5 border-2 border-red-400 rounded-xl overflow-hidden">
            <div className="bg-red-500 px-4 py-2 flex items-center gap-2">
              <svg className="w-4 h-4 text-white flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
              </svg>
              <span className="text-white font-bold text-sm">RASCUNHO — SEM VALIDADE JURIDICA</span>
            </div>
            <div className="bg-red-50 px-4 py-2">
              <p className="text-red-800 text-xs">
                Esta mensagem <strong>NAO foi enviada</strong> e <strong>NAO tem validade</strong> enquanto voce nao clicar em "Enviar". Prints desta tela nao constituem prova de envio.
              </p>
            </div>
          </div>

          <form onSubmit={handleEnviar} className="flex flex-col gap-4">

            {/* Tipo */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de mensagem</label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(TIPO_LABEL).map(([val, label]) => (
                  <button key={val} type="button" onClick={() => setTipo(val)}
                    className={"py-2 rounded-lg text-sm font-semibold border-2 transition-all " +
                      (tipo === val
                        ? "border-red-500 bg-red-50 text-red-700"
                        : "border-gray-200 text-gray-500 hover:border-gray-300")}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Setor */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Setor destinatario</label>
              <select
                className="w-full p-3 border-2 border-gray-200 rounded-xl text-sm focus:border-red-400 focus:outline-none bg-white"
                value={setorDestino} onChange={e => setSetor(e.target.value)} required>
                <option value="">Selecione o setor...</option>
                {SETORES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Mensagem */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Mensagem</label>
              <textarea
                className="w-full p-3 border-2 border-gray-200 rounded-xl text-sm focus:border-red-400 focus:outline-none resize-none"
                rows={5}
                placeholder="Descreva com clareza. Seja objetivo e inclua datas, locais e nomes se necessario."
                value={mensagem} onChange={e => setMensagem(e.target.value)} required />
              <p className="text-xs text-gray-400 mt-1 text-right">{mensagem.length} caracteres</p>
            </div>

            {/* Identificacao */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Sua identificacao</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Nome</p>
                  <p className="font-medium text-gray-700">{user.nome_completo}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Setor</p>
                  <p className="font-medium text-gray-700">{user.setor}</p>
                </div>
              </div>
            </div>

            {/* Checkbox */}
            <label className="flex items-start gap-3 cursor-pointer bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4">
              <input type="checkbox" checked={confirmado} onChange={e => setConfirmado(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-red-600 flex-shrink-0 cursor-pointer" />
              <span className="text-sm text-yellow-900 leading-relaxed">
                <strong>Declaro que as informacoes acima sao verdadeiras.</strong> Estou ciente de que mensagens falsas ou de ma-fe podem acarretar responsabilidade legal.
              </span>
            </label>

            {erro && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <p className="text-red-700 text-sm">{erro}</p>
              </div>
            )}

            <button type="submit" disabled={loading || !confirmado}
              className={"w-full py-3.5 rounded-xl font-bold text-sm transition-all " +
                (confirmado && !loading
                  ? "bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed")}>
              {loading ? "Enviando e gerando protocolo..." : "Enviar Mensagem Oficialmente"}
            </button>

            <p className="text-center text-xs text-gray-400 pb-1">
              Apos o envio um protocolo com hash de integridade sera gerado imediatamente.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
