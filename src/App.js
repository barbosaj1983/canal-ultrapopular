import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import Login from './Login'
import Formulario from './Formulario'
import AdminPanel from './AdminPanel'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Verifica se já tem usuário logado
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      if (data?.user) setUser(data.user)
      setLoading(false)
    }
    getUser()
  }, [])

  if (loading) return <p className="text-center mt-10">Carregando...</p>

  if (!user) return <Login onLogin={setUser} />

  // Painel Admin (poderia ser por is_admin do banco também)
  if (user.email === 'admin@admin.com') {
    return <AdminPanel user={user} />
  }

  // Funcionário comum → formulário de mensagens
  return (
    <div className="min-h-screen bg-gray-100">
      <Formulario user={user} />
    </div>
  )
}

export default App
