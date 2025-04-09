import { useState } from "react"
import { supabase } from "./supabaseClient"
import CadastroFuncionario from "./CadastroFuncionario"

export default function Login({ setUser }) {
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [erro, setErro] = useState(null)
  const [mostrarCadastro, setMostrarCadastro] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    })
    if (error) {
      setErro("Erro ao entrar: " + error.message)
    } else {
      setUser(data.user)
    }
  }

  if (mostrarCadastro) {
    return <CadastroFuncionario onCadastroSucesso={() => setMostrarCadastro(false)} />
  }

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white shadow rounded">
      <h1 className="text-xl font-bold mb-4">Acesso Funcionário</h1>
      {erro && <p className="text-red-500">{erro}</p>}
      <form onSubmit={handleLogin} className="flex flex-col gap-3">
        <input
          className="border p-2 rounded"
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          className="border p-2 rounded"
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={e => setSenha(e.target.value)}
          required
        />
        <button className="bg-blue-600 text-white p-2 rounded" type="submit">
          Entrar
        </button>
        <button
          type="button"
          className="text-blue-700 underline text-sm mt-2"
          onClick={() => setMostrarCadastro(true)}
        >
          Criar meu cadastro
        </button>
      </form>
    </div>
  )
}
