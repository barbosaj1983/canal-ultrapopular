from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from database import get_pool
from auth import get_current_user
import hashlib
from datetime import datetime, timezone

router = APIRouter(prefix="/mensagens", tags=["mensagens"])

class MensagemInput(BaseModel):
    tipo: str
    setor_destino: str
    mensagem: str

def gerar_hash(texto: str) -> str:
    return hashlib.sha256(texto.encode()).hexdigest()

async def get_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"

@router.post("/enviar")
async def enviar_mensagem(body: MensagemInput, request: Request, user: dict = Depends(get_current_user)):
    pool = await get_pool()
    hash_msg = gerar_hash(body.mensagem)
    ip = await get_ip(request)

    async with pool.acquire() as conn:
        async with conn.transaction():
            hoje = datetime.now(timezone.utc)
            data_str = hoje.strftime("%Y%m%d")
            count = await conn.fetchval(
                "SELECT COUNT(*) FROM mensagens WHERE created_at >= CURRENT_DATE"
            )
            protocolo = f"#{data_str}-{str((count or 0) + 1).zfill(4)}"
            await conn.execute(
                "INSERT INTO mensagens (tipo, setor, mensagem, nome, user_email, protocolo, hash) VALUES ($1,$2,$3,$4,$5,$6,$7)",
                body.tipo, body.setor_destino, body.mensagem,
                user["nome_completo"], user["email"], protocolo, hash_msg
            )
            await conn.execute(
                "INSERT INTO logs (user_id, acao, status, ip) VALUES ($1,'enviou mensagem','enviado',$2)",
                user["id"], ip
            )
    return {"protocolo": protocolo, "hash": hash_msg}

@router.get("/me")
async def minhas_mensagens(user: dict = Depends(get_current_user)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT id, tipo, setor, protocolo, hash, created_at FROM mensagens WHERE user_email=$1 ORDER BY created_at DESC LIMIT 50",
            user["email"]
        )
    return [dict(r) for r in rows]
