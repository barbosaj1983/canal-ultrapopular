import { useState } from "react"
import { authAPI } from "./api"

const SETORES = [
  "Atendimento","Conferencia de Caixa","Estoque","Perfumaria",
  "Financeiro","RH","Farmaceutico","TI",
  "Supervisao","Diretoria","Callcenter","Manutencao","Gerencia"
]

export default function CadastroFuncionario({ onVoltar }) {
  const [form, setForm]       = useState({
    nome_completo: "", cpf: "", setor: "",
    telefone: "", email: "", password: ""
  })
  const [erro, setErro]       = useState("")
  const [ok, setOk]           = useState(false)
  const [loading, setLoading] = useState(false)

  const handle = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const handleCadastro = async (e) => {
    e.preventDefault(); setErro(""); setLoading(true)
    try {
      await authAPI.cadastro(form)
      setOk(true)
    } catch (err) {
      setErro(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white shadow rounded">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Cadastro de Funcionario</h2>
        <button onClick={onVoltar} className="text-sm text-gray-500 underline">
          Voltar ao login
        </button>
      </div>

      {ok ? (
        <div className="text-center py-6">
          <p className="text-green-600 font-semibold mb-2">Cadastro realizado!</p>
          <p className="text-sm text-gray-600 mb-4">
            Aguarde o administrador ativar sua conta.
          </p>
          <button onClick={onVoltar}
            className="bg-blue-600 text-white px-4 py-2 rounded">
            Ir para login
          </button>
        </div>
      ) : (
        <form onSubmit={handleCadastro} className="flex flex-col gap-3">
          <input name="nome_completo" type="text" placeholder="Nome completo"
            required className="p-2 border rounded"
            value={form.nome_completo} onChange={handle} />
          <input name="cpf" type="text" placeholder="CPF"
            required className="p-2 border rounded"
            value={form.cpf} onChange={handle} />
          <select name="setor" required className="p-2 border rounded"
            value={form.setor} onChange={handle}>
            <option value="">Selecione seu setor</option>
            {SETORES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <input name="telefone" type="text" placeholder="Telefone (opcional)"
            className="p-2 border rounded"
            value={form.telefone} onChange={handle} />
          <input name="email" type="email" placeholder="E-mail"
            required className="p-2 border rounded"
            value={form.email} onChange={handle} />
          <input name="password" type="password"
            placeholder="Senha (minimo 6 caracteres)"
            required minLength={6} className="p-2 border rounded"
            value={form.password} onChange={handle} />
          {erro && <p className="text-red-600 text-sm">{erro}</p>}
          <button type="submit" disabled={loading}
            className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50">
            {loading ? "Cadastrando..." : "Cadastrar"}
          </button>
        </form>
      )}
    </div>
  )
}
