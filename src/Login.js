import { useState } from "react"
import { authAPI, saveToken, saveUser } from "./api"
import CadastroFuncionario from "./CadastroFuncionario"

const LOGOS = [
  { nome: "Ultrapopular", arquivo: "/logos/logo-ultrapopular.png" },
  { nome: "Bobs",         arquivo: "/logos/logo-bobs.png" },
  { nome: "Fini",         arquivo: "/logos/logo-fini.png" },
]

function LogoBar() {
  return (
    <div className="flex justify-center gap-4 mb-6">
      {LOGOS.map(({ nome, arquivo }) => (
        <LogoPlaceholder key={nome} nome={nome} arquivo={arquivo} />
      ))}
    </div>
  )
}

function LogoPlaceholder({ nome, arquivo }) {
  const [erro, setErro] = useState(false)
  return (
    <div className="w-28 h-16 bg-white rounded-xl shadow border-2 border-dashed border-red-200 flex flex-col items-center justify-center gap-1 overflow-hidden">
      {!erro ? (
        <img
          src={arquivo}
          alt={nome}
          className="max-h-14 max-w-full object-contain px-2"
          onError={() => setErro(true)}
        />
      ) : (
        <>
          <svg className="w-5 h-5 text-red-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-xs font-bold text-red-300 uppercase tracking-widest">{nome}</span>
        </>
      )}
    </div>
  )
}

export default function Login({ onLogin, avisoInatividade = "" }) {
  const [email, setEmail]           = useState("")
  const [password, setPassword]     = useState("")
  const [erro, setErro]             = useState("")
  const [loading, setLoading]       = useState(false)
  const [resetEmail, setResetEmail] = useState("")
  const [resetOk, setResetOk]       = useState(false)
  const [tela, setTela]             = useState("login")
  const [showPass, setShowPass]     = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault(); setErro(""); setLoading(true)
    try {
      const data = await authAPI.login(email, password)
      saveToken(data.access_token); saveUser(data.user); onLogin(data.user)
    } catch (err) { setErro(err.message) }
    finally { setLoading(false) }
  }

  const handleReset = async () => {
    if (!resetEmail) { setErro("Digite seu e-mail"); return }
    setErro(""); setLoading(true)
    try { await authAPI.resetPedido(resetEmail); setResetOk(true) }
    catch (err) { setErro(err.message) }
    finally { setLoading(false) }
  }

  if (tela === "cadastro") return <CadastroFuncionario onVoltar={() => setTela("login")} />

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-red-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md flex flex-col items-center">

        <LogoBar />

        {/* Aviso de logout por inatividade */}
        {avisoInatividade && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-xl px-4 py-3 mb-4 flex items-start gap-2">
            <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-amber-800 text-sm font-medium">{avisoInatividade}</p>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-2xl w-full overflow-hidden">

          {/* Header */}
          <div className="bg-gradient-to-r from-red-800 to-red-600 px-8 py-8 text-center">
            <div className="w-14 h-14 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-white text-xl font-bold">Fale com a Diretoria</h1>
            <p className="text-red-200 text-sm mt-1">Sistema de mensagens confidenciais</p>
          </div>

          <div className="px-8 py-7">
            {tela === "login" && (
              <>
                <h2 className="text-lg font-bold text-gray-800 mb-5">Acessar sistema</h2>
                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">E-mail</label>
                    <input type="email" placeholder="seu@email.com" required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:border-red-400 focus:outline-none transition-colors"
                      value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">Senha</label>
                    <div className="relative">
                      <input type={showPass ? "text" : "password"} placeholder="Sua senha" required
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:border-red-400 focus:outline-none transition-colors pr-12"
                        value={password} onChange={e => setPassword(e.target.value)} />
                      <button type="button" onClick={() => setShowPass(s => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPass
                          ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                          : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                        }
                      </button>
                    </div>
                  </div>
                  {erro && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{erro}</p>}
                  <button type="submit" disabled={loading}
                    className="w-full bg-red-700 hover:bg-red-800 text-white py-3 rounded-xl font-bold text-sm transition-colors disabled:opacity-50 mt-1">
                    {loading ? "Entrando..." : "Entrar"}
                  </button>
                </form>
                <div className="flex justify-between text-sm mt-5 pt-4 border-t border-gray-100">
                  <button onClick={() => { setTela("reset"); setErro("") }}
                    className="text-yellow-600 hover:text-yellow-700 font-medium">
                    Esqueci minha senha
                  </button>
                  <button onClick={() => { setTela("cadastro"); setErro("") }}
                    className="text-red-600 hover:text-red-700 font-medium">
                    Criar cadastro
                  </button>
                </div>
              </>
            )}

            {tela === "reset" && (
              <>
                <button onClick={() => { setTela("login"); setErro(""); setResetOk(false) }}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Voltar
                </button>
                <h2 className="text-lg font-bold text-gray-800 mb-1">Redefinir senha</h2>
                <p className="text-sm text-gray-500 mb-5">O administrador ira redefinir sua senha manualmente.</p>
                {resetOk ? (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                    <svg className="w-10 h-10 text-green-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-green-700 font-semibold text-sm">Solicitacao enviada!</p>
                    <p className="text-green-600 text-xs mt-1">O administrador ira redefinir sua senha em breve.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <input type="email" placeholder="Seu e-mail"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:border-red-400 focus:outline-none"
                      value={resetEmail} onChange={e => setResetEmail(e.target.value)} />
                    {erro && <p className="text-red-600 text-sm">{erro}</p>}
                    <button onClick={handleReset} disabled={loading}
                      className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded-xl font-bold text-sm transition-colors disabled:opacity-50">
                      {loading ? "Enviando..." : "Solicitar redefinicao"}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
