from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
from database import get_pool
from auth import verify_password, hash_password, create_token

router = APIRouter(prefix="/auth", tags=["auth"])

SETORES = [
    "Atendimento", "Conferencia de Caixa", "Estoque", "Perfumaria",
    "Financeiro", "RH", "Farmaceutico", "TI",
    "Supervisao", "Diretoria", "Callcenter", "Manutencao", "Gerencia"
]

class LoginInput(BaseModel):
    email: EmailStr
    password: str

class CadastroInput(BaseModel):
    nome_completo: str
    cpf: str
    setor: str
    telefone: str = ""
    email: EmailStr
    password: str

class ResetPedidoInput(BaseModel):
    email: EmailStr

@router.post("/login")
async def login(body: LoginInput):
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT id, email, nome_completo, setor, cpf, password_hash, is_admin, ativo FROM funcionarios WHERE email = $1",
            body.email.lower().strip()
        )
    if not row:
        raise HTTPException(status_code=401, detail="E-mail ou senha invalidos")
    if not row["ativo"]:
        raise HTTPException(status_code=403, detail="Conta bloqueada. Fale com o administrador.")
    if not verify_password(body.password, row["password_hash"]):
        raise HTTPException(status_code=401, detail="E-mail ou senha invalidos")
    token = create_token({"sub": str(row["id"]), "email": row["email"], "is_admin": row["is_admin"]})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id":            str(row["id"]),
            "email":         row["email"],
            "nome_completo": row["nome_completo"],
            "setor":         row["setor"],
            "cpf":           row["cpf"],
            "is_admin":      row["is_admin"],
        }
    }

@router.post("/cadastro", status_code=201)
async def cadastro(body: CadastroInput):
    pool = await get_pool()
    async with pool.acquire() as conn:
        existe = await conn.fetchval(
            "SELECT id FROM funcionarios WHERE email = $1", body.email.lower().strip()
        )
        if existe:
            raise HTTPException(status_code=409, detail="Este e-mail ja esta cadastrado.")
        await conn.execute(
            "INSERT INTO funcionarios (nome_completo, cpf, setor, telefone, email, password_hash, is_admin) VALUES ($1,$2,$3,$4,$5,$6,FALSE)",
            body.nome_completo.strip(), body.cpf.strip(), body.setor,
            body.telefone.strip(), body.email.lower().strip(), hash_password(body.password)
        )
    return {"message": "Cadastro realizado com sucesso."}

@router.post("/reset-pedido")
async def solicitar_reset(body: ResetPedidoInput):
    pool = await get_pool()
    async with pool.acquire() as conn:
        func = await conn.fetchrow(
            "SELECT id FROM funcionarios WHERE email = $1", body.email.lower().strip()
        )
        if func:
            ja_existe = await conn.fetchval(
                "SELECT id FROM reset_pedidos WHERE funcionario_id=$1 AND atendido=FALSE", func["id"]
            )
            if not ja_existe:
                await conn.execute(
                    "INSERT INTO reset_pedidos (funcionario_id, user_email) VALUES ($1, $2)",
                    func["id"], body.email.lower().strip()
                )
    return {"message": "Solicitacao registrada. O administrador ira atualizar sua senha em breve."}
