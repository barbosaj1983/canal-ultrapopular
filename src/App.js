import { useState, useEffect } from "react" 
import { getUser, removeToken, removeUser } from "./api" 
import Login from "./Login" 
import Formulario from "./Formulario" 
import AdminPanel from "./AdminPanel" 
 
function App() { 
  const [user, setUser] = useState(null) 
  const [loading, setLoading] = useState(true) 
  useEffect(() => { setUser(getUser()); setLoading(false) }, []) 
  const handleLogout = () => { removeToken(); removeUser(); setUser(null) } 
  if (loading) return <p className="text-center mt-10">Carregando...</p> 
  if (!user) return <Login onLogin={setUser} /> 
  if (user.is_admin) return <AdminPanel user={user} onLogout={handleLogout} /> 
  return <div className="min-h-screen bg-gray-100"><Formulario user={user} onLogout={handleLogout} /></div> 
} 
export default App 
