import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import * as XLSX from "xlsx";

export default function AdminPanel() {
  const [funcionarios, setFuncionarios] = useState([]);
  const [resetPedidos, setResetPedidos] = useState([]);
  const [mensagens, setMensagens] = useState([]);

  useEffect(() => {
    fetchDados();
  }, []);

  const fetchDados = async () => {
    const { data: funcData } = await supabase.from("funcionarios").select("*");
    const { data: resetData } = await supabase
      .from("reset_pedidos")
      .select("user_email, funcionario_id, atendido")
      .eq("atendido", false);
    const { data: mensagensData } = await supabase
      .from("mensagens")
      .select("*");
    setFuncionarios(funcData || []);
    setResetPedidos(resetData || []);
    setMensagens(mensagensData || []);
  };

  const resetarSenha = async (email) => {
    const novaSenha = prompt("Digite a nova senha para este funcionário:");
    if (!novaSenha) return;
    const { data: user } = await supabase.auth.admin.listUsers();
    let usuario = user.users.find((u) => u.email === email);

    if (!usuario) {
      const confirmacao = window.confirm(
        "Este usuário não está registrado no sistema de login. Deseja criar agora com a nova senha?"
      );
      if (!confirmacao) return;
      const result = await supabase.auth.admin.createUser({
        email,
        password: novaSenha,
      });
      if (result.error) {
        alert("Erro ao criar usuário: " + result.error.message);
        return;
      }
      usuario = result.user;
    } else {
      await supabase.auth.admin.updateUser(usuario.id, { password: novaSenha });
    }

    await supabase
      .from("reset_pedidos")
      .update({ atendido: true })
      .eq("user_email", email);
    alert("Senha atualizada com sucesso!");
    fetchDados();
  };

  const bloquearFuncionario = async (id) => {
    const confirmar = window.confirm("Deseja bloquear este funcionário?");
    if (!confirmar) return;
    await supabase
      .from("funcionarios")
      .update({ ativo: false })
      .eq("id", id);
    alert("Funcionário bloqueado");
    fetchDados();
  };

  const exportarExcel = () => {
    const mensagensComInfo = mensagens.map((m) => {
      const funcionario = funcionarios.find((f) => f.email === m.user_email);
      return {
        Nome: funcionario?.nome_completo || "",
        CPF: funcionario?.cpf || "",
        Setor_Origem: funcionario?.setor || "",
        Email: funcionario?.email || m.user_email,
        Tipo: m.tipo,
        Destino: m.setor,
        Mensagem: m.mensagem,
        Protocolo: m.protocolo || "",
        Hash: m.hash || "",
        Data_Hora: m.created_at,
      };
    });

    const planilha = XLSX.utils.json_to_sheet(mensagensComInfo);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, planilha, "Mensagens");
    XLSX.writeFile(workbook, "relatorio_mensagens.xlsx");
  };

  const sair = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <div className="max-w-6xl mx-auto mt-10 p-6 bg-white shadow rounded">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Painel Administrativo</h2>
        <button
          onClick={sair}
          className="text-sm text-red-600 underline"
        >
          Sair
        </button>
      </div>

      <div className="flex justify-between mb-4">
        <button
          onClick={exportarExcel}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Exportar para Excel
        </button>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-200">
            <th className="p-2 text-left">Nome</th>
            <th className="p-2 text-left">Email</th>
            <th className="p-2 text-left">Setor</th>
            <th className="p-2 text-left">Ações</th>
          </tr>
        </thead>
        <tbody>
          {funcionarios.map((f) => {
            const solicitouReset = resetPedidos.find(
              (r) => r.user_email === f.email
            );
            return (
              <tr key={f.id} className="border-b">
                <td className="p-2">{f.nome_completo}</td>
                <td className="p-2">{f.email}</td>
                <td className="p-2">{f.setor}</td>
                <td className="p-2 flex gap-2 items-center">
                  {solicitouReset && (
                    <span className="text-red-600 text-xs font-semibold">
                      🔴 Solicitou reset de senha
                    </span>
                  )}
                  <button
                    onClick={() => resetarSenha(f.email)}
                    className="bg-blue-600 text-white text-xs px-2 py-1 rounded"
                  >
                    Resetar Senha
                  </button>
                  <button
                    onClick={() => bloquearFuncionario(f.id)}
                    className="bg-red-600 text-white text-xs px-2 py-1 rounded"
                  >
                    Bloquear
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}