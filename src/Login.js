import { useState } from "react"
import { authAPI, saveToken, saveUser } from "./api"
import CadastroFuncionario from "./CadastroFuncionario"

export default function Login({ onLogin }) {
  const [email, setEmail]           = useState("")
  const [password, setPassword]     = useState("")
  const [erro, setErro]             = useState("")
  const [loading, setLoading]       = useState(false)
  const [resetEmail, setResetEmail] = useState("")
  const [resetOk, setResetOk]       = useState(false)
  const [tela, setTela]             = useState("login")

  const handleLogin = async (e) => {
    e.preventDefault(); setErro(""); setLoading(true)
    try {
      const data = await authAPI.login(email, password)
      saveToken(data.access_token)
      saveUser(data.user)
      onLogin(data.user)
    } catch (err) {
      setErro(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async () => {
    if (!resetEmail) { setErro("Digite seu e-mail"); return }
    setErro(""); setLoading(true)
    try {
      await authAPI.resetPedido(resetEmail)
      setResetOk(true)
    } catch (err) {
      setErro(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (tela === "cadastro") {
    return <CadastroFuncionario onVoltar={() => setTela("login")} />
  }

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white shadow rounded">
      <h2 className="text-xl font-bold mb-1">Canal Ultra Popular</h2>
      <p className="text-sm text-gray-500 mb-5">Sistema de mensagens confidenciais</p>

      {tela === "login" && (
        <form onSubmit={handleLogin} className="flex flex-col gap-3">
          <input type="email" placeholder="E-mail" required
            className="p-2 border rounded"
            value={email} onChange={e => setEmail(e.target.value)} />
          <input type="password" placeholder="Senha" required
            className="p-2 border rounded"
            value={password} onChange={e => setPassword(e.target.value)} />
          {erro && <p className="text-red-600 text-sm">{erro}</p>}
          <button type="submit" disabled={loading}
            className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50">
            {loading ? "Entrando..." : "Entrar"}
          </button>
          <div className="flex justify-between text-sm mt-1">
            <button type="button" onClick={() => setTela("reset")}
              className="text-yellow-600 underline">
              Esqueci minha senha
            </button>
            <button type="button" onClick={() => setTela("cadastro")}
              className="text-blue-600 underline">
              Criar cadastro
            </button>
          </div>
        </form>
      )}

      {tela === "reset" && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-gray-600">
            Digite seu e-mail para solicitar redefincao ao administrador.
          </p>
          <input type="email" placeholder="Seu e-mail"
            className="p-2 border rounded"
            value={resetEmail} onChange={e => setResetEmail(e.target.value)} />
          {erro && <p className="text-red-600 text-sm">{erro}</p>}
          {resetOk ? (
            <p className="text-green-600 text-sm">
              Solicitacao enviada! O administrador ira redefinir sua senha em breve.
            </p>
          ) : (
            <button onClick={handleReset} disabled={loading}
              className="bg-yellow-500 text-white py-2 rounded hover:bg-yellow-600 disabled:opacity-50">
              {loading ? "Enviando..." : "Solicitar reset"}
            </button>
          )}
          <button onClick={() => { setTela("login"); setErro(""); setResetOk(false) }}
            className="text-sm text-gray-500 underline">
            Voltar ao login
          </button>
        </div>
      )}
    </div>
  )
}
