import { useState } from "react"
import { authAPI } from "./api"
import { SETORES } from "./constants"

function formatCPF(value) {
  return value
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
}

export default function CadastroFuncionario({ onVoltar }) {
  const [form, setForm]       = useState({
    nome_completo: "", cpf: "", setor: "",
    telefone: "", email: "", password: ""
  })
  const [erro, setErro]       = useState("")
  const [ok, setOk]           = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const handle = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const handleCPF = e => {
    setForm(p => ({ ...p, cpf: formatCPF(e.target.value) }))
  }

  const handleCadastro = async (e) => {
    e.preventDefault()
    const cpfLimpo = form.cpf.replace(/\D/g, "")
    if (cpfLimpo.length !== 11) { setErro("CPF invalido. Digite os 11 digitos."); return }
    if (form.password.length < 6) { setErro("Senha deve ter no minimo 6 caracteres."); return }
    setErro(""); setLoading(true)
    try {
      await authAPI.cadastro({ ...form, cpf: form.cpf })
      setOk(true)
    } catch (err) {
      setErro(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-red-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-red-800 to-red-600 px-8 py-7 text-center">
          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-white text-lg font-bold">Criar Cadastro</h1>
          <p className="text-red-200 text-xs mt-1">Fale com a Diretoria</p>
        </div>

        <div className="px-8 py-6">
          {ok ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-9 h-9 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-gray-800 mb-1">Cadastro realizado!</h2>
              <p className="text-sm text-gray-500 mb-6">
                Aguarde o administrador ativar sua conta antes de acessar.
              </p>
              <button onClick={onVoltar}
                className="w-full bg-red-700 hover:bg-red-800 text-white py-3 rounded-xl font-bold text-sm transition-colors">
                Ir para login
              </button>
            </div>
          ) : (
            <form onSubmit={handleCadastro} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Nome completo</label>
                <input name="nome_completo" type="text" placeholder="Seu nome completo" required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:border-red-400 focus:outline-none transition-colors"
                  value={form.nome_completo} onChange={handle} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">CPF</label>
                  <input name="cpf" type="text" placeholder="000.000.000-00" required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:border-red-400 focus:outline-none transition-colors"
                    value={form.cpf} onChange={handleCPF} inputMode="numeric" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Telefone</label>
                  <input name="telefone" type="text" placeholder="(00) 00000-0000"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:border-red-400 focus:outline-none transition-colors"
                    value={form.telefone} onChange={handle} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Setor</label>
                <select name="setor" required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:border-red-400 focus:outline-none transition-colors bg-white"
                  value={form.setor} onChange={handle}>
                  <option value="">Selecione seu setor</option>
                  {SETORES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">E-mail</label>
                <input name="email" type="email" placeholder="seu@email.com" required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:border-red-400 focus:outline-none transition-colors"
                  value={form.email} onChange={handle} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Senha</label>
                <div className="relative">
                  <input name="password" type={showPass ? "text" : "password"}
                    placeholder="Minimo 6 caracteres" required minLength={6}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:border-red-400 focus:outline-none transition-colors pr-12"
                    value={form.password} onChange={handle} />
                  <button type="button" onClick={() => setShowPass(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPass
                      ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                      : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                    }
                  </button>
                </div>
              </div>

              {erro && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <p className="text-red-700 text-sm">{erro}</p>
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full bg-red-700 hover:bg-red-800 text-white py-3 rounded-xl font-bold text-sm transition-colors disabled:opacity-50 mt-1">
                {loading ? "Cadastrando..." : "Criar cadastro"}
              </button>

              <button type="button" onClick={onVoltar}
                className="w-full text-sm text-gray-400 hover:text-gray-600 py-2">
                Voltar ao login
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
