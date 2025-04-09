import { useState } from "react"
import { supabase } from "./supabaseClient"

const setores = [
  "Atendimento", "Caixa", "Estoque", "Perfumaria", "Financeiro", "RH", "Farmacêutico"
]

export default function CadastroFuncionario({ onCadastroSucesso }) {
  const [form, setForm] = useState({
    nome_completo: "",
    cpf: "",
    setor: "",
    telefone: "",
    email: "",
    senha: ""
  })

  const [erro, setErro] = useState("")
  const [ok, setOk] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleCadastro = async (e) => {
    e.preventDefault()
    setErro("")

    // 1. Criar conta no Supabase Auth
    const { data: auth, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.senha
    })

    if (authError) {
  if (authError.message.includes("User already registered")) {
    setErro("Este e-mail já está registrado. Volte para a tela de login e clique em 'Esqueci minha senha'.")
  } else {
    setErro("Erro ao criar conta: " + authError.message)
  }
  return
}

    // 2. Inserir na tabela `funcionarios`
    const { error: insertError } = await supabase.from("funcionarios").insert([
      {
        nome_completo: form.nome_completo,
        cpf: form.cpf,
        setor: form.setor,
        telefone: form.telefone,
        email: form.email,
        is_admin: false,
      }
    ])

    if (insertError) {
      setErro("Erro ao salvar dados: " + insertError.message)
    } else {
      setOk(true)
      if (onCadastroSucesso) onCadastroSucesso()
    }
  }

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white shadow rounded">
      <h2 className="text-xl font-bold mb-4">Cadastro de Funcionário</h2>
      {ok && <p className="text-green-600 mb-4">Cadastro feito! Verifique seu e-mail e faça login.</p>}
      {erro && <p className="text-red-600 mb-4">{erro}</p>}

      <form onSubmit={handleCadastro} className="flex flex-col gap-3">

        <input
          type="text"
          name="nome_completo"
          placeholder="Nome completo"
          value={form.nome_completo}
          onChange={handleChange}
          required
          className="p-2 border rounded"
        />

        <input
          type="text"
          name="cpf"
          placeholder="CPF"
          value={form.cpf}
          onChange={handleChange}
          required
          className="p-2 border rounded"
        />

        <select
          name="setor"
          value={form.setor}
          onChange={handleChange}
          required
          className="p-2 border rounded"
        >
          <option value="">Selecione o setor</option>
          {setores.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <input
          type="text"
          name="telefone"
          placeholder="Telefone"
          value={form.telefone}
          onChange={handleChange}
          className="p-2 border rounded"
        />

        <input
          type="email"
          name="email"
          placeholder="E-mail"
          value={form.email}
          onChange={handleChange}
          required
          className="p-2 border rounded"
        />

        <input
          type="password"
          name="senha"
          placeholder="Senha"
          value={form.senha}
          onChange={handleChange}
          required
          className="p-2 border rounded"
        />

        <button className="bg-blue-600 text-white p-2 rounded" type="submit">
          Cadastrar
        </button>
      </form>
    </div>
  )
}
