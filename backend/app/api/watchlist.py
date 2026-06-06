from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.core.database import get_conn
from app.core.deps import current_user
from app.db.user_queries import get_watchlist, add_to_watchlist, remove_from_watchlist

router = APIRouter(prefix="/watchlist", tags=["watchlist"])


class AddRequest(BaseModel):
    ticker: str
    entity_name: str


@router.get("/")
async def get_my_watchlist(user=Depends(current_user), conn=Depends(get_conn)):
    return await get_watchlist(conn, user["id"])


@router.post("/", status_code=201)
async def add_item(body: AddRequest, user=Depends(current_user), conn=Depends(get_conn)):
    item = await add_to_watchlist(conn, user["id"], body.ticker, body.entity_name)
    if not item:
        raise HTTPException(409, "Already in watchlist")
    return item


@router.delete("/{ticker}", status_code=204)
async def remove_item(ticker: str, user=Depends(current_user), conn=Depends(get_conn)):
    await remove_from_watchlist(conn, user["id"], ticker)
