import { useState, useEffect, useCallback, useRef } from "react"
import { getUser, removeToken, removeUser } from "./api"
import Login from "./Login"
import Formulario from "./Formulario"
import AdminPanel from "./AdminPanel"

const INATIVIDADE_MS  = 15 * 60 * 1000  // 15 minutos
const AVISO_ANTES_MS  =  2 * 60 * 1000  //  2 minutos antes

export default function App() {
  const [user, setUser]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [aviso, setAviso]       = useState(false)
  const [segundos, setSegundos] = useState(120)
  const timerRef  = useRef(null)
  const avisoRef  = useRef(null)
  const countRef  = useRef(null)

  const logout = useCallback((motivo) => {
    clearTimeout(timerRef.current)
    clearTimeout(avisoRef.current)
    clearInterval(countRef.current)
    removeToken(); removeUser()
    setUser(null); setAviso(false)
    if (motivo === "inatividade") {
      alert("Voce foi desconectado por inatividade (15 minutos sem uso).")
    }
  }, [])

  const resetarTimer = useCallback(() => {
    if (!getUser()) return
    clearTimeout(timerRef.current)
    clearTimeout(avisoRef.current)
    clearInterval(countRef.current)
    setAviso(false)

    // Aviso 2 min antes
    avisoRef.current = setTimeout(() => {
      setAviso(true)
      setSegundos(120)
      countRef.current = setInterval(() => {
        setSegundos(s => {
          if (s <= 1) { clearInterval(countRef.current); return 0 }
          return s - 1
        })
      }, 1000)
    }, INATIVIDADE_MS - AVISO_ANTES_MS)

    // Logout
    timerRef.current = setTimeout(() => logout("inatividade"), INATIVIDADE_MS)
  }, [logout])

  // Detecta atividade do usuario
  useEffect(() => {
    if (!user) return
    const eventos = ["mousemove","keydown","click","touchstart","scroll"]
    const handle = () => { resetarTimer(); setAviso(false) }
    eventos.forEach(e => window.addEventListener(e, handle, { passive: true }))
    resetarTimer()
    return () => {
      eventos.forEach(e => window.removeEventListener(e, handle))
      clearTimeout(timerRef.current)
      clearTimeout(avisoRef.current)
      clearInterval(countRef.current)
    }
  }, [user, resetarTimer])

  useEffect(() => {
    setUser(getUser())
    setLoading(false)
  }, [])

  const handleLogin  = (u) => { setUser(u); resetarTimer() }
  const handleLogout = ()  => logout("manual")

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-100 flex items-center justify-center">
      <p className="text-gray-500">Carregando...</p>
    </div>
  )

  return (
    <>
      {/* Modal de aviso de inatividade */}
      {aviso && user && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Sessao expirando!</h3>
            <p className="text-gray-500 text-sm mb-4">
              Voce sera desconectado por inatividade em
            </p>
            <div className="text-4xl font-bold text-red-600 mb-6">{segundos}s</div>
            <button
              onClick={() => { resetarTimer(); setAviso(false) }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition-colors">
              Continuar conectado
            </button>
            <button onClick={() => logout("manual")}
              className="w-full text-sm text-gray-400 hover:text-red-500 mt-3 underline">
              Sair agora
            </button>
          </div>
        </div>
      )}

      {!user && <Login onLogin={handleLogin} />}
      {user && user.is_admin && <AdminPanel user={user} onLogout={handleLogout} />}
      {user && !user.is_admin && <Formulario user={user} onLogout={handleLogout} />}
    </>
  )
}
