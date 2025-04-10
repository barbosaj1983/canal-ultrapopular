import { useEffect, useState } from "react"
import { supabase } from "./supabaseClient"
import useLogger from "./hooks/useLogger"
import html2pdf from "html2pdf.js"

const setores = [
  "Atendimento", "Conferencia de Caixa", "Estoque", "Perfumaria",
  "Financeiro", "RH", "Farmacêutico", "TI",
  "Supervisao", "Diretoria", "Callcenter", "Manutencao", "Gerência"
]

export default function Formulario({ user }) {
  const [dadosFuncionario, setDadosFuncionario] = useState(null)
  const [tipo, setTipo] = useState("sugestao")
  const [setorDestino, setSetorDestino] = useState("")
  const [mensagem, setMensagem] = useState("")
  const [enviado, setEnviado] = useState(false)
  const [protocolo, setProtocolo] = useState("")
  const [hashGerado, setHashGerado] = useState("")
  const [tentouBuscar, setTentouBuscar] = useState(false)

  useLogger(user?.id, "digitou mensagem", "rascunho")

  useEffect(() => {
    async function fetchFuncionario() {
      const { data, error } = await supabase
        .from("funcionarios")
        .select("nome_completo, cpf, setor")
        .ilike("email", user.email.trim())
        .limit(1)
        .maybeSingle()
      if (!error && data) setDadosFuncionario(data)
      setTentouBuscar(true)
    }
    fetchFuncionario()
  }, [user.email])

  const gerarProtocolo = async () => {
    const hoje = new Date()
    const dataStr = hoje.toISOString().split("T")[0].replace(/-/g, "")
    const { count } = await supabase
      .from("mensagens")
      .select("id", { count: "exact", head: true })
      .gte("created_at", `${dataStr.slice(0, 4)}-${dataStr.slice(4, 6)}-${dataStr.slice(6)}T00:00:00.000Z`)
    const numero = String((count || 0) + 1).padStart(4, "0")
    return `#${dataStr}-${numero}`
  }

  const gerarHash = async (conteudo) => {
    const encoder = new TextEncoder()
    const data = encoder.encode(conteudo)
    const hashBuffer = await crypto.subtle.digest("SHA-256", data)
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("")
  }

  const logEnvio = async () => {
    try {
      const res = await fetch("https://api.ipify.org?format=json")
      const json = await res.json()
      await supabase.from("logs").insert([
        {
          user_id: user.id,
          acao: "enviou mensagem",
          status: "enviado",
          ip: json.ip,
          timestamp: new Date().toISOString()
        }
      ])
    } catch (e) {
      console.error("Erro ao registrar log de envio:", e)
    }
  }

  const handleEnviar = async (e) => {
    e.preventDefault()
    await logEnvio()
    const hash = await gerarHash(mensagem)
    const novoProtocolo = await gerarProtocolo()
    setProtocolo(novoProtocolo)
    setHashGerado(hash)

    const { error } = await supabase.from("mensagens").insert([
      {
        tipo,
        setor: setorDestino,
        mensagem,
        nome: dadosFuncionario?.nome_completo || "",
        cpf: dadosFuncionario?.cpf || "",
        user_email: user.email,
        protocolo: novoProtocolo,
        hash,
      },
    ])
    if (error) {
      alert("Erro ao enviar: " + error.message)
    } else {
      setEnviado(true)
      setMensagem("")
      setSetorDestino("")
    }
  }

  const imprimirPDF = () => {
    const conteudoHTML = `
      <div style="font-family: sans-serif; padding: 20px;">
        <h1>Protocolo de Mensagem Confidencial</h1>
        <p><strong>Nome:</strong> ${dadosFuncionario.nome_completo}</p>
        <p><strong>Setor de origem:</strong> ${dadosFuncionario.setor}</p>
        <p><strong>Setor de destino:</strong> ${setorDestino}</p>
        <p><strong>Data:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Protocolo:</strong> ${protocolo}</p>
        <p><strong>Hash:</strong> ${hashGerado}</p>
        <p><strong>Status:</strong> Mensagem oficialmente enviada ao RH</p>
      </div>
    `
    html2pdf().set({
      margin: 10,
      filename: `protocolo-${protocolo}.pdf`,
      html2canvas: { scale: 2 },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
    }).from(conteudoHTML).save()
  }

  if (tentouBuscar && !dadosFuncionario) {
    return (
      <div className="max-w-md mx-auto mt-20 p-6 bg-white shadow rounded text-center">
        <p className="text-red-600 font-semibold mb-4">
          Funcionário não encontrado no cadastro interno.
        </p>
        <button
          onClick={() => {
            alert("Clique em 'Criar meu cadastro' na tela de login para preencher seus dados completos.")
            supabase.auth.signOut().then(() => window.location.reload())
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded shadow"
        >
          Voltar para cadastro completo
        </button>
      </div>
    )
  }

  if (!dadosFuncionario) {
    return <p className="text-center mt-10">Carregando dados do funcionário...</p>
  }

  const sair = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  return (
    <div className={`relative max-w-xl mx-auto mt-10 p-6 bg-white shadow rounded ${!enviado ? "bg-watermark" : ""}`}>
      <style>{`
        .bg-watermark::before {
          content: "⚠️ Visualização temporária – Sem validade jurídica";
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-25deg);
          font-size: 1.25rem;
          color: rgba(220, 38, 38, 0.15);
          z-index: 0;
          white-space: nowrap;
          pointer-events: none;
        }
      `}</style>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Nova mensagem</h2>
        <button onClick={sair} className="text-sm text-red-600 underline">Sair</button>
      </div>

      <p className="text-sm text-gray-600 italic mb-4">
        🛡️ Todas as mensagens são 100% confidenciais. Somente o setor responsável terá acesso ao conteúdo enviado.
      </p>

      {!enviado && (
        <div className="mb-4 text-yellow-700 bg-yellow-100 border border-yellow-300 p-3 rounded text-sm">
          ⚠️ <strong>RASCUNHO:</strong> Esta mensagem ainda <strong>não foi enviada</strong>. Não possui validade jurídica.
        </div>
      )}

      {enviado && (
        <div className="mb-4 text-green-700 bg-green-100 border border-green-300 p-3 rounded text-sm">
          ✅ <strong>PROTOCOLO GERADO:</strong> Sua mensagem foi registrada com validade legal.<br />
          Número do protocolo: <strong>{protocolo}</strong><br />
          <button onClick={imprimirPDF} className="mt-2 underline text-sm text-blue-700">Imprimir Protocolo</button>
        </div>
      )}

      <form onSubmit={handleEnviar} className="flex flex-col gap-3 relative z-10">
        <label className="font-semibold">Tipo</label>
        <select className="p-2 border rounded" value={tipo} onChange={e => setTipo(e.target.value)}>
          <option value="sugestao">Sugestão</option>
          <option value="reclamacao">Reclamação</option>
          <option value="denuncia">Denúncia</option>
        </select>

        <label className="font-semibold">Setor que receberá a mensagem</label>
        <select
          className="p-2 border rounded"
          value={setorDestino}
          onChange={e => setSetorDestino(e.target.value)}
          required
        >
          <option value="">Selecione o setor</option>
          {setores.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <label className="font-semibold">Mensagem</label>
        <textarea
          className="p-2 border rounded"
          placeholder="Digite sua mensagem aqui"
          value={mensagem}
          onChange={e => setMensagem(e.target.value)}
          required
        />

        <label className="font-semibold">Nome</label>
        <input className="p-2 border rounded bg-gray-100" value={dadosFuncionario.nome_completo} disabled />

        <label className="font-semibold">CPF</label>
        <input className="p-2 border rounded bg-gray-100" value={dadosFuncionario.cpf} disabled />

        <button type="submit" className="bg-green-600 text-white p-2 rounded">Enviar</button>
      </form>
    </div>
  )
}