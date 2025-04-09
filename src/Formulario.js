import { useEffect, useState } from "react"
import { supabase } from "./supabaseClient"

const setores = [
  "Atendimento",
  "Conferencia de Caixa",
  "Estoque",
  "Perfumaria",
  "Financeiro",
  "RH",
  "Farmacêutico",
  "TI",
  "Supervisao",
  "Diretoria",
  "Callcenter",
  "Manutencao",
  "Gerência"
]

export default function Formulario({ user }) {
  const [dadosFuncionario, setDadosFuncionario] = useState(null)
  const [tipo, setTipo] = useState("sugestao")
  const [setorDestino, setSetorDestino] = useState("")
  const [mensagem, setMensagem] = useState("")
  const [enviado, setEnviado] = useState(false)
  const [tentouBuscar, setTentouBuscar] = useState(false)

  useEffect(() => {
    async function fetchFuncionario() {
      console.log("Buscando dados do funcionário para:", user.email)

      const { data, error } = await supabase
        .from("funcionarios")
        .select("nome_completo, cpf, setor")
        .ilike("email", user.email.trim())
        .limit(1)
        .maybeSingle()

      console.log("Resultado do Supabase:", data, error)

      if (!error && data) {
        setDadosFuncionario(data)
      }

      setTentouBuscar(true)
    }

    fetchFuncionario()
  }, [user.email])

  const handleEnviar = async (e) => {
    e.preventDefault()
    const { error } = await supabase.from("mensagens").insert([
      {
        tipo,
        setor: setorDestino,
        mensagem,
        nome: dadosFuncionario?.nome_completo || "",
        cpf: dadosFuncionario?.cpf || "",
        user_email: user.email,
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
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white shadow rounded">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Nova mensagem</h2>
        <button onClick={sair} className="text-sm text-red-600 underline">Sair</button>
      </div>

      <p className="text-sm text-gray-600 italic mb-4">
        🛡️ Todas as mensagens são 100% confidenciais. Somente o setor responsável terá acesso ao conteúdo enviado.
      </p>

      {enviado && <p className="text-green-600 mb-4">Mensagem enviada com sucesso!</p>}
      <form onSubmit={handleEnviar} className="flex flex-col gap-3">

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