import { useState } from "react";
import { supabase } from "./supabaseClient";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [resetConfirmado, setResetConfirmado] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setErro("E-mail ou senha inválidos");
    } else {
      onLogin(data.user);
    }
  };

  const handleReset = async () => {
    if (!resetEmail) {
      setErro("Digite seu e-mail para resetar a senha");
      return;
    }
    const { data, error } = await supabase
      .from("funcionarios")
      .select("id")
      .ilike("email", resetEmail.trim())
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      setErro("Funcionário não encontrado");
      return;
    }

    await supabase.from("reset_pedidos").insert([
      {
        funcionario_id: data.id,
        user_email: resetEmail,
      },
    ]);
    setResetConfirmado(true);
    setErro("");
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white shadow rounded">
      <h2 className="text-xl font-bold mb-4">Login</h2>
      <form onSubmit={handleLogin} className="flex flex-col gap-3">
        <input
          type="email"
          placeholder="Email"
          className="p-2 border rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Senha"
          className="p-2 border rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {erro && <p className="text-red-600 text-sm">{erro}</p>}
        <button
          type="submit"
          className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Entrar
        </button>
      </form>

      <div className="mt-6 border-t pt-4">
        <h3 className="text-sm font-semibold mb-2">Esqueceu sua senha?</h3>
        <input
          type="email"
          placeholder="Digite seu e-mail"
          className="p-2 border rounded w-full"
          value={resetEmail}
          onChange={(e) => setResetEmail(e.target.value)}
        />
        <button
          onClick={handleReset}
          className="mt-2 w-full text-sm bg-yellow-500 text-white py-2 rounded hover:bg-yellow-600"
        >
          Resetar Senha
        </button>
        {resetConfirmado && (
          <p className="text-green-600 text-sm mt-2">
            Solicitação enviada ao administrador. Aguarde retorno.
          </p>
        )}
      </div>
    </div>
  );
}