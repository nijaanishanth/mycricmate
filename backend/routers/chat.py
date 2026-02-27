from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import List
from uuid import UUID

from database import get_db
from auth import get_current_user
from models import User, Conversation, Message
from schemas import ConversationOut, ConversationParticipant, MessageOut, MessageCreate

router = APIRouter(prefix="/chat", tags=["chat"])


# ── helpers ────────────────────────────────────────────────────────────────────

def _canonical(a: UUID, b: UUID):
    """Return (user_a_id, user_b_id) with the smaller UUID first for uniqueness."""
    return (a, b) if str(a) < str(b) else (b, a)


def _make_message_out(m: Message) -> MessageOut:
    return MessageOut(
        id=str(m.id),
        conversation_id=str(m.conversation_id),
        sender_id=str(m.sender_id),
        content=m.content,
        is_read=m.is_read,
        created_at=m.created_at,
    )


def _make_conversation_out(
    conv: Conversation,
    current_user_id: UUID,
    db: Session,
) -> ConversationOut:
    other_id = conv.user_b_id if str(conv.user_a_id) == str(current_user_id) else conv.user_a_id
    other = db.query(User).filter(User.id == other_id).first()

    last_msg = (
        db.query(Message)
        .filter(Message.conversation_id == conv.id)
        .order_by(Message.created_at.desc())
        .first()
    )

    unread = (
        db.query(func.count(Message.id))
        .filter(
            Message.conversation_id == conv.id,
            Message.sender_id != current_user_id,
            Message.is_read == False,
        )
        .scalar()
        or 0
    )

    return ConversationOut(
        id=str(conv.id),
        other_user=ConversationParticipant(
            id=str(other.id) if other else str(other_id),
            full_name=other.full_name if other else None,
            avatar_url=other.avatar_url if other else None,
        ),
        last_message=_make_message_out(last_msg) if last_msg else None,
        unread_count=unread,
        updated_at=conv.updated_at,
    )


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.get("/conversations", response_model=List[ConversationOut])
def list_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return all conversations for the current user, newest first."""
    convs = (
        db.query(Conversation)
        .filter(
            or_(
                Conversation.user_a_id == current_user.id,
                Conversation.user_b_id == current_user.id,
            )
        )
        .order_by(Conversation.updated_at.desc())
        .all()
    )
    return [_make_conversation_out(c, current_user.id, db) for c in convs]


@router.post("/conversations", response_model=ConversationOut, status_code=status.HTTP_200_OK)
def get_or_create_conversation(
    other_user_id: str = Query(..., description="UUID of the other participant"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get an existing conversation with a user, or create one."""
    try:
        other_uuid = UUID(other_user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID")

    if str(other_uuid) == str(current_user.id):
        raise HTTPException(status_code=400, detail="Cannot chat with yourself")

    other = db.query(User).filter(User.id == other_uuid).first()
    if not other:
        raise HTTPException(status_code=404, detail="User not found")

    a_id, b_id = _canonical(current_user.id, other_uuid)

    conv = (
        db.query(Conversation)
        .filter(
            Conversation.user_a_id == a_id,
            Conversation.user_b_id == b_id,
        )
        .first()
    )

    if not conv:
        conv = Conversation(user_a_id=a_id, user_b_id=b_id)
        db.add(conv)
        db.commit()
        db.refresh(conv)

    return _make_conversation_out(conv, current_user.id, db)


@router.get("/conversations/{conversation_id}/messages", response_model=List[MessageOut])
def get_messages(
    conversation_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return messages in a conversation (oldest first). Marks unread messages as read."""
    try:
        conv_uuid = UUID(conversation_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid conversation ID")

    conv = db.query(Conversation).filter(Conversation.id == conv_uuid).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Check participant
    if str(conv.user_a_id) != str(current_user.id) and str(conv.user_b_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not a participant")

    # Mark incoming messages as read
    db.query(Message).filter(
        Message.conversation_id == conv_uuid,
        Message.sender_id != current_user.id,
        Message.is_read == False,
    ).update({"is_read": True})
    db.commit()

    messages = (
        db.query(Message)
        .filter(Message.conversation_id == conv_uuid)
        .order_by(Message.created_at.asc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [_make_message_out(m) for m in messages]


@router.post("/conversations/{conversation_id}/messages", response_model=MessageOut, status_code=201)
def send_message(
    conversation_id: str,
    body: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Send a message in a conversation."""
    try:
        conv_uuid = UUID(conversation_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid conversation ID")

    conv = db.query(Conversation).filter(Conversation.id == conv_uuid).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if str(conv.user_a_id) != str(current_user.id) and str(conv.user_b_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not a participant")

    msg = Message(
        conversation_id=conv_uuid,
        sender_id=current_user.id,
        content=body.content.strip(),
    )
    db.add(msg)

    # Bump conversation updated_at for sorting
    from datetime import datetime
    conv.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(msg)

    return _make_message_out(msg)


@router.get("/unread-count")
def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Total number of unread messages across all conversations."""
    count = (
        db.query(func.count(Message.id))
        .join(Conversation, Message.conversation_id == Conversation.id)
        .filter(
            or_(
                Conversation.user_a_id == current_user.id,
                Conversation.user_b_id == current_user.id,
            ),
            Message.sender_id != current_user.id,
            Message.is_read == False,
        )
        .scalar()
        or 0
    )
    return {"unread_count": count}
