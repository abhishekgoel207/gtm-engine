"""Posts GTM Engine agent messages into a Band room, using Band's published REST schema.

Docs: https://docs.band.ai/api/agent-api/agent-api-messages/create-agent-chat-message
TODO(verify): not run against a live Band account. The docs show two hosts (api.band.ai and
app.band.ai), so BAND_REST_URL must be set. Receiving messages from Band is not built yet:
forward them to POST /api/agents/inbound with {agent, from, text} using band-sdk.
"""
import os
from pathlib import Path

import httpx
import yaml
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

CONFIG = Path(__file__).with_name("agent_config.yaml")
REST_URL = os.environ["BAND_REST_URL"].rstrip("/")
CHAT_ID = os.environ["BAND_CHAT_ID"]
TOKEN = os.environ["CRON_SECRET"]
REP_HANDLE = os.environ["BAND_REP_HANDLE"]
AGENTS = yaml.safe_load(CONFIG.read_text())
app = FastAPI()


class Post(BaseModel):
    sender: str = Field(alias="from")
    mentions: list[str]
    text: str


def mention(name: str) -> dict:
    if name in AGENTS:
        return {"id": AGENTS[name]["agent_id"], "name": name}
    return {"handle": REP_HANDLE, "name": name}


@app.post("/post")
async def post(body: Post, authorization: str = Header("")):
    if authorization != f"Bearer {TOKEN}":
        raise HTTPException(401)
    if not body.mentions:
        raise HTTPException(422, "Band needs at least one mention")
    # The rep's own messages are typed in Band by the rep; only agents post here.
    if body.sender not in AGENTS:
        return {"skipped": True}
    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.post(
            f"{REST_URL}/api/v1/agent/chats/{CHAT_ID}/messages",
            headers={"X-API-Key": AGENTS[body.sender]["api_key"]},
            json={"message": {"content": body.text, "mentions": [mention(m) for m in body.mentions]}},
        )
    if response.status_code not in (200, 201):
        raise HTTPException(502, f"Band returned {response.status_code}")
    return response.json()
