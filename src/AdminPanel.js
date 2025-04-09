import { useEffect, useState } from "react"
import { supabase } from "./supabaseClient"
import * as XLSX from "xlsx"

export default function AdminPanel({ user }) {
  const [funcionarios, setFuncionarios] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  const buscarFuncionarios = async () => {
    setCarregando(true)
    const { data, error } = await supabase
      .from("funcionarios")
      .select("id, nome_completo, cpf, setor, telefone, email, is_admin")

    if (error) setErro(error.message)
    else setFuncionarios(data)
    setCarregando(false)
  }

  useEffect(() => {
    if (user) buscarFuncionarios()
  }, [user])

  const cadastrarFuncionario = async () => {
    const nome_completo = prompt("Nome completo:")
    const cpf = prompt("CPF:")
    const setor = prompt("Setor:")
    const telefone = prompt("Telefone:")
    const email = prompt("Email:")
    if (!nome_completo || !cpf || !setor || !email) {
      alert("Todos os campos são obrigatórios.")
      return
    }

    const { error } = await supabase.from("funcionarios").insert([
      {
        nome_completo,
        cpf,
        setor,
        telefone,
        email,
        is_admin: false
      }
    ])

    if (error) alert("Erro ao cadastrar: " + error.message)
    else {
      alert("Funcionário cadastrado com sucesso.")
      buscarFuncionarios()
    }
  }

  const redefinirSenha = async (email) => {
    alert("Redefinição de senha disponível apenas via painel seguro do Supabase Auth ou backend.")
  }

  const excluirFuncionario = async (id) => {
    const confirmar = window.confirm("Deseja realmente excluir este funcionário?")
    if (!confirmar) return

    const { error } = await supabase
      .from("funcionarios")
      .delete()
      .eq("id", id)

    if (error) alert("Erro na exclusão: " + error.message)
    else {
      alert("Funcionário excluído com sucesso.")
      buscarFuncionarios()
    }
  }

  const exportarXLSX = async () => {
    const { data: mensagens, error } = await supabase
      .from("mensagens")
      .select("nome, cpf, setor, tipo, mensagem, created_at, user_email")

    if (error) {
      alert("Erro ao exportar mensagens: " + error.message)
      return
    }

    const worksheet = XLSX.utils.json_to_sheet(mensagens)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Mensagens")
    XLSX.writeFile(workbook, "mensagens.xlsx")
  }

  const sair = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  if (!user) return null

  return (
    <div className="max-w-6xl mx-auto mt-10 p-4 bg-white shadow rounded">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Painel Administrativo</h1>
        <button onClick={sair} className="text-sm text-red-600 underline">Sair</button>
      </div>

      {carregando && <p>Carregando funcionários...</p>}
      {erro && <p className="text-red-600">Erro: {erro}</p>}

      <div className="flex gap-4 mb-4">
        <button
          onClick={exportarXLSX}
          className="bg-green-600 text-white px-4 py-2 rounded shadow"
        >
          Exportar para Excel
        </button>
        <button
          onClick={cadastrarFuncionario}
          className="bg-blue-600 text-white px-4 py-2 rounded shadow"
        >
          Novo Funcionário
        </button>
      </div>

      <table className="w-full border text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2">Nome</th>
            <th>CPF</th>
            <th>Setor</th>
            <th>Telefone</th>
            <th>Email</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {funcionarios.map(f => (
            <tr key={f.id} className="border-t">
              <td className="p-2">{f.nome_completo}</td>
              <td>{f.cpf}</td>
              <td>{f.setor}</td>
              <td>{f.telefone}</td>
              <td>{f.email}</td>
              <td className="flex flex-col gap-1">
                <button
                  onClick={() => redefinirSenha(f.email)}
                  className="text-sm text-blue-600 underline"
                >
                  Redefinir Senha
                </button>
                <button
                  onClick={() => excluirFuncionario(f.id)}
                  className="text-sm text-red-600 underline"
                >
                  Excluir
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}