import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { chatApi, Conversation, ChatMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { X, Send, ArrowLeft, MessageSquare, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

// ── props ──────────────────────────────────────────────────────────────────────

interface MatchContact {
  /** User UUID of the person to chat with */
  userId: string;
  name: string;
  image?: string;
  subtitle?: string;
}

interface ChatPanelProps {
  /** All swiped-right matches that should appear in the chat list */
  matches: MatchContact[];
  open: boolean;
  onClose: () => void;
  /** If provided, open directly to this user's conversation */
  initialUserId?: string | null;
}

// ── helpers ────────────────────────────────────────────────────────────────────

function avatar(name: string, url?: string | null) {
  return url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;
}

function timeLabel(iso: string) {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return "";
  }
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function ChatPanel({ matches, open, onClose, initialUserId }: ChatPanelProps) {
  const { user } = useAuth();

  // Conversations loaded from API
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(false);

  // Active conversation
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── load conversation list ─────────────────────────────────────────────────

  const loadConversations = useCallback(async () => {
    setLoadingConvs(true);
    try {
      const data = await chatApi.listConversations();
      setConversations(data);
    } catch {
      // silently fail for polling
    } finally {
      setLoadingConvs(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    loadConversations();
  }, [open, loadConversations]);

  // ── open a specific user's convo when initialUserId changes ───────────────

  useEffect(() => {
    if (!open || !initialUserId) return;
    openConversationWith(initialUserId);
  }, [open, initialUserId]); // openConversationWith is stable via useCallback

  // ── open / load messages ──────────────────────────────────────────────────

  const openConversationWith = async (otherUserId: string) => {
    try {
      const conv = await chatApi.getOrCreateConversation(otherUserId);
      // Upsert into local list
      setConversations(prev => {
        const exists = prev.find(c => c.id === conv.id);
        if (exists) return prev.map(c => (c.id === conv.id ? conv : c));
        return [conv, ...prev];
      });
      setActiveConvId(conv.id);
    } catch {
      toast.error("Couldn't open conversation");
    }
  };

  const loadMessages = useCallback(async (convId: string) => {
    setLoadingMsgs(true);
    try {
      const data = await chatApi.getMessages(convId);
      setMessages(data);
    } catch {
      toast.error("Failed to load messages");
    } finally {
      setLoadingMsgs(false);
    }
  }, []);

  useEffect(() => {
    if (!activeConvId) return;
    loadMessages(activeConvId);

    // Poll for new messages every 3 seconds
    pollRef.current = setInterval(() => loadMessages(activeConvId), 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [activeConvId, loadMessages]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── send message ──────────────────────────────────────────────────────────

  const sendMessage = async () => {
    if (!activeConvId || !draft.trim()) return;
    const text = draft.trim();
    setDraft("");
    setSending(true);
    try {
      const msg = await chatApi.sendMessage(activeConvId, text);
      setMessages(prev => [...prev, msg]);
      // Refresh conversation list to update last_message
      loadConversations();
    } catch {
      toast.error("Failed to send message");
      setDraft(text); // restore draft on failure
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ── derived ────────────────────────────────────────────────────────────────

  const activeConv = conversations.find(c => c.id === activeConvId);

  // Build the left-panel list: merge matches with existing conversations
  // Show matches that have a conversation first, then remaining matches
  const matchUserIds = new Set(matches.map(m => m.userId));
  const convUserIds = new Set(conversations.map(c => c.other_user.id));

  // Conversations from matches (already have messages or thread)
  const matchConvs = conversations.filter(c => matchUserIds.has(c.other_user.id));
  // Matches that don't yet have a conversation thread
  const freshMatches = matches.filter(m => !convUserIds.has(m.userId));

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread_count, 0);

  // ── render ─────────────────────────────────────────────────────────────────

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-stretch justify-end pointer-events-none">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 pointer-events-auto"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative pointer-events-auto flex w-full max-w-2xl h-[90vh] sm:h-full bg-background border-l shadow-2xl rounded-t-2xl sm:rounded-none overflow-hidden">

        {/* ── LEFT: conversation / match list ─────────────────────────────── */}
        <div className={cn(
          "flex flex-col w-full sm:w-72 border-r flex-shrink-0",
          activeConvId && "hidden sm:flex"
        )}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              <span className="font-semibold">Messages</span>
              {totalUnread > 0 && (
                <Badge className="text-xs h-5 px-1.5">{totalUnread}</Badge>
              )}
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1">
            {loadingConvs && matchConvs.length === 0 && freshMatches.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : matchConvs.length === 0 && freshMatches.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <MessageSquare className="w-10 h-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">No matches yet</p>
                <p className="text-xs text-muted-foreground mt-1">Swipe right to get matched and start chatting</p>
              </div>
            ) : (
              <div>
                {/* Active conversations */}
                {matchConvs.map(conv => (
                  <button
                    key={conv.id}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left border-b border-border/50",
                      activeConvId === conv.id && "bg-primary/5 border-l-2 border-l-primary"
                    )}
                    onClick={() => setActiveConvId(conv.id)}
                  >
                    <div className="relative flex-shrink-0">
                      <img
                        src={avatar(conv.other_user.full_name || "User", conv.other_user.avatar_url)}
                        alt={conv.other_user.full_name || "User"}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      {conv.unread_count > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center font-bold">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm truncate">{conv.other_user.full_name || "User"}</p>
                        {conv.last_message && (
                          <span className="text-[10px] text-muted-foreground ml-1 flex-shrink-0">
                            {timeLabel(conv.last_message.created_at)}
                          </span>
                        )}
                      </div>
                      <p className={cn(
                        "text-xs truncate",
                        conv.unread_count > 0 ? "text-foreground font-medium" : "text-muted-foreground"
                      )}>
                        {conv.last_message
                          ? (conv.last_message.sender_id === user?.id ? "You: " : "") + conv.last_message.content
                          : "Start the conversation!"}
                      </p>
                    </div>
                  </button>
                ))}

                {/* Fresh matches — no conversation yet */}
                {freshMatches.length > 0 && (
                  <>
                    {matchConvs.length > 0 && (
                      <p className="px-4 pt-3 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        New Matches
                      </p>
                    )}
                    {freshMatches.map(match => (
                      <button
                        key={match.userId}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left border-b border-border/50"
                        onClick={() => openConversationWith(match.userId)}
                      >
                        <img
                          src={avatar(match.name, match.image)}
                          alt={match.name}
                          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{match.name}</p>
                          <p className="text-xs text-primary truncate">{match.subtitle || "New match! Say hi 👋"}</p>
                        </div>
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* ── RIGHT: message thread ────────────────────────────────────────── */}
        <div className={cn(
          "flex flex-col flex-1 min-w-0",
          !activeConvId && "hidden sm:flex"
        )}>
          {activeConv ? (
            <>
              {/* Thread header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 sm:hidden"
                  onClick={() => setActiveConvId(null)}
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <img
                  src={avatar(activeConv.other_user.full_name || "User", activeConv.other_user.avatar_url)}
                  alt={activeConv.other_user.full_name || "User"}
                  className="w-9 h-9 rounded-full object-cover"
                />
                <div>
                  <p className="font-semibold text-sm">{activeConv.other_user.full_name || "User"}</p>
                  <p className="text-xs text-muted-foreground">Matched</p>
                </div>
                <div className="ml-auto">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 px-4 py-4">
                {loadingMsgs ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-8">
                    <p className="text-sm font-medium">It's a match! 🎉</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Say hi to {activeConv.other_user.full_name || "your match"}!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {messages.map((msg, i) => {
                      const isMe = msg.sender_id === user?.id;
                      const showTime =
                        i === messages.length - 1 ||
                        messages[i + 1]?.sender_id !== msg.sender_id;
                      return (
                        <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                          <div className={cn("max-w-[75%] group")}>
                            <div
                              className={cn(
                                "px-3 py-2 rounded-2xl text-sm break-words",
                                isMe
                                  ? "bg-primary text-primary-foreground rounded-br-sm"
                                  : "bg-muted text-foreground rounded-bl-sm"
                              )}
                            >
                              {msg.content}
                            </div>
                            {showTime && (
                              <p className={cn(
                                "text-[10px] text-muted-foreground mt-0.5",
                                isMe ? "text-right" : "text-left"
                              )}>
                                {timeLabel(msg.created_at)}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Input */}
              <div className="px-4 py-3 border-t flex items-center gap-2">
                <Input
                  className="flex-1"
                  placeholder="Type a message…"
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={sending}
                  maxLength={2000}
                  autoFocus
                />
                <Button
                  size="icon"
                  onClick={sendMessage}
                  disabled={!draft.trim() || sending}
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </>
          ) : (
            /* Empty state — shown on desktop when no conv is selected */
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <Button variant="ghost" size="icon" className="absolute top-3 right-3 h-8 w-8" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
              <MessageSquare className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="font-medium text-muted-foreground">Select a conversation</p>
              <p className="text-sm text-muted-foreground mt-1">or pick a match to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
