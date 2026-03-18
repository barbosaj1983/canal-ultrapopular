from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from database import get_pool
from auth import require_admin, hash_password
import uuid

router = APIRouter(prefix="/admin", tags=["admin"])

class ResetSenhaInput(BaseModel):
    email: EmailStr
    nova_senha: str

class BloquearInput(BaseModel):
    funcionario_id: str

@router.get("/funcionarios")
async def listar_funcionarios(admin=Depends(require_admin)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT id, nome_completo, email, setor, cpf, telefone, is_admin, ativo, created_at FROM funcionarios ORDER BY nome_completo"
        )
    return [dict(r) for r in rows]

@router.post("/bloquear")
async def bloquear(body: BloquearInput, admin=Depends(require_admin)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE funcionarios SET ativo=FALSE WHERE id=$1 AND is_admin=FALSE",
            uuid.UUID(body.funcionario_id)
        )
    return {"message": "Funcionario bloqueado"}

@router.post("/desbloquear")
async def desbloquear(body: BloquearInput, admin=Depends(require_admin)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute("UPDATE funcionarios SET ativo=TRUE WHERE id=$1", uuid.UUID(body.funcionario_id))
    return {"message": "Funcionario desbloqueado"}

@router.get("/reset-pedidos")
async def listar_resets(admin=Depends(require_admin)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT r.id, r.user_email, r.created_at, f.nome_completo FROM reset_pedidos r JOIN funcionarios f ON f.id=r.funcionario_id WHERE r.atendido=FALSE ORDER BY r.created_at"
        )
    return [dict(r) for r in rows]

@router.post("/reset-senha")
async def resetar_senha(body: ResetSenhaInput, admin=Depends(require_admin)):
    if len(body.nova_senha) < 6:
        raise HTTPException(status_code=400, detail="Senha deve ter no minimo 6 caracteres")
    pool = await get_pool()
    async with pool.acquire() as conn:
        result = await conn.execute(
            "UPDATE funcionarios SET password_hash=$1 WHERE email=$2",
            hash_password(body.nova_senha), body.email.lower().strip()
        )
        if result == "UPDATE 0":
            raise HTTPException(status_code=404, detail="Funcionario nao encontrado")
        await conn.execute(
            "UPDATE reset_pedidos SET atendido=TRUE WHERE user_email=$1 AND atendido=FALSE",
            body.email.lower().strip()
        )
    return {"message": "Senha atualizada com sucesso"}

@router.get("/mensagens")
async def listar_mensagens(tipo: str="", setor: str="", data: str="", admin=Depends(require_admin)):
    pool = await get_pool()
    conditions = ["1=1"]
    params = []
    i = 1
    if tipo:  conditions.append(f"m.tipo=${i}");              params.append(tipo);  i+=1
    if setor: conditions.append(f"m.setor=${i}");             params.append(setor); i+=1
    if data:  conditions.append(f"m.created_at::date=${i}::date"); params.append(data);  i+=1
    where = " AND ".join(conditions)
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            f"SELECT m.id,m.tipo,m.setor,m.mensagem,m.nome,m.user_email,m.protocolo,m.hash,m.created_at,f.setor AS setor_origem FROM mensagens m LEFT JOIN funcionarios f ON f.email=m.user_email WHERE {where} ORDER BY m.created_at DESC",
            *params
        )
    return [dict(r) for r in rows]

@router.get("/logs")
async def listar_logs(admin=Depends(require_admin)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT l.id,l.acao,l.status,l.ip,l.timestamp,f.email AS user_email,f.nome_completo FROM logs l LEFT JOIN funcionarios f ON f.id=l.user_id ORDER BY l.timestamp DESC LIMIT 500"
        )
    return [dict(r) for r in rows]
