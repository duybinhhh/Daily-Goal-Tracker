
import React, { useState, useEffect, useRef } from "react";
import api from "../../services/api";
import { useTranslation } from "../../i18n";
import { Send, Trash2, Smile } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "../../store/authStore";

interface Reaction {
  [emoji: string]: number;
}

interface Message {
  id: string;
  groupId: string;
  senderId: string;
  senderName: string;
  senderAvatarInitials: string;
  content: string;
  createdAt: string;
  canDelete: boolean;
  reactions: Reaction;
  myReactions: string[];
}

interface GroupCommentsSectionProps {
  groupId: string;
}

export const GroupCommentsSection: React.FC<GroupCommentsSectionProps> = ({ groupId }) => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      const res = await api.get(`/api/groups/${groupId}/messages`);
      setMessages(res.data.messages);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch messages", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchMessages();
    const interval = setInterval(fetchMessages, 30000); // Refetch every 30s
    return () => clearInterval(interval);
  }, [groupId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || sending || newMessage.length > 200) return;

    const content = newMessage.trim();
    setNewMessage("");
    setSending(true);

    // Optimistic Update
    const tempId = "temp-" + Date.now().toString();
    const tempMsg: Message = {
      id: tempId,
      groupId,
      senderId: user?.id || "",
      senderName: user?.name || "Me",
      senderAvatarInitials: user?.name?.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2) || "ME",
      content,
      createdAt: new Date().toISOString(),
      canDelete: true,
      reactions: { "🔥": 0, "💪": 0, "👏": 0, "❤️": 0, "😂": 0 },
      myReactions: []
    };

    setMessages(prev => [...prev, tempMsg]);

    try {
      const res = await api.post(`/api/groups/${groupId}/messages`, { content });
      setMessages(prev => prev.map(m => m.id === tempId ? res.data.message : m));
    } catch (err) {
      console.error("Failed to send message", err);
      setMessages(prev => prev.filter(m => m.id !== tempId));
      // Rollback input if failed
      setNewMessage(content);
    } finally {
      setSending(false);
    }
  };

  const handleToggleReaction = async (messageId: string, emoji: string) => {
    if (messageId.startsWith("temp-")) return;

    // Optimistic Update
    setMessages(prev => prev.map(m => {
      if (m.id === messageId) {
        const isSelected = m.myReactions.includes(emoji);
        const newMyReactions = isSelected 
          ? m.myReactions.filter(e => e !== emoji)
          : [...m.myReactions, emoji];
        
        const newReactions = { ...m.reactions };
        newReactions[emoji] = isSelected ? Math.max(0, newReactions[emoji] - 1) : newReactions[emoji] + 1;

        return { ...m, myReactions: newMyReactions, reactions: newReactions };
      }
      return m;
    }));

    try {
      const res = await api.post(`/api/groups/${groupId}/messages/${messageId}/reactions`, { emoji });
      setMessages(prev => prev.map(m => m.id === messageId ? { 
        ...m, 
        reactions: res.data.reactions, 
        myReactions: res.data.myReactions 
      } : m));
    } catch (err) {
      console.error("Failed to toggle reaction", err);
      fetchMessages(); // Rollback by refetching
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (messageId.startsWith("temp-")) return;
    if (!confirm(t("groups.chat.deleteConfirm"))) return;

    // Optimistic Update
    const originalMessages = [...messages];
    setMessages(prev => prev.filter(m => m.id !== messageId));

    try {
      await api.delete(`/api/groups/${groupId}/messages/${messageId}`);
    } catch (err) {
      console.error("Failed to delete message", err);
      setMessages(originalMessages);
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return t("groups.chat.justNow");
    if (diffMin < 60) return t("groups.chat.minutesAgo", { count: diffMin });
    if (diffHour < 24) return t("groups.chat.hoursAgo", { count: diffHour });
    return t("groups.chat.daysAgo", { count: diffDay });
  };

  return (
    <div className="flex flex-col gap-3 mt-4 pb-2">
      <div className="flex items-center justify-between">
        <h4 className="text-[11px] font-black text-on-surface uppercase tracking-wider flex items-center gap-2">
          {t("groups.chat.title")}
        </h4>
      </div>

      <div className="glass-card rounded-2xl border border-white/10 flex flex-col h-[400px] overflow-hidden bg-slate-900/40 backdrop-blur-xl">
        {/* Message List */}
        <div className="flex-1 overflow-y-auto p-3.5 md:p-4 flex flex-col gap-4 scrollbar-hide">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin h-5 w-5 border-t-2 border-primary border-transparent rounded-full" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-on-surface-variant p-6 opacity-60">
              <Smile size={32} className="mb-3 stroke-[1.5]" />
              <p className="text-[11px] font-medium max-w-[180px] leading-relaxed">
                {t("groups.chat.empty")}
              </p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  key={msg.id} 
                  className={`flex gap-2.5 ${msg.senderId === user?.id ? "flex-row-reverse" : "flex-row"}`}
                >
                  {/* Avatar */}
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold border border-white/10 shadow-sm"
                    style={{ 
                      background: msg.senderId === user?.id ? "rgba(78, 222, 163, 0.1)" : "rgba(255, 255, 255, 0.05)", 
                      color: msg.senderId === user?.id ? "var(--color-secondary)" : "var(--color-on-surface-variant)" 
                    }}
                  >
                    {msg.senderAvatarInitials}
                  </div>

                  {/* Bubble Container */}
                  <div className={`flex flex-col max-w-[85%] md:max-w-[75%] ${msg.senderId === user?.id ? "items-end" : "items-start"}`}>
                    <div className="flex items-center gap-2 mb-1 px-1">
                      <span className="text-[10px] font-bold text-on-surface truncate max-w-[110px]">
                        {msg.senderName}
                      </span>
                      <span className="text-[9px] text-on-surface-variant opacity-60">
                        {formatRelativeTime(msg.createdAt)}
                      </span>
                    </div>

                    <div className="relative group">
                      <div 
                        className={`py-2 px-3.5 rounded-xl text-[11px] leading-relaxed shadow-sm ${
                          msg.senderId === user?.id 
                            ? "bg-primary text-on-primary rounded-tr-none font-medium" 
                            : "bg-white/5 text-on-surface border border-white/10 rounded-tl-none"
                        }`}
                        style={{ wordBreak: "break-word" }}
                      >
                        {msg.content}
                      </div>
                      
                      {msg.canDelete && (
                        <button 
                          onClick={() => handleDeleteMessage(msg.id)}
                          className={`absolute top-1/2 -translate-y-1/2 p-1.5 text-error hover:bg-error/10 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 ${
                            msg.senderId === user?.id ? "-left-8" : "-right-8"
                          }`}
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>

                    {/* Reactions */}
                    <div className={`flex flex-wrap gap-1 mt-1.5 ${msg.senderId === user?.id ? "justify-end" : "justify-start"}`}>
                      {Object.entries(msg.reactions).map(([emoji, count]) => (
                        <button
                          key={emoji}
                          onClick={() => handleToggleReaction(msg.id, emoji)}
                          className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[9px] font-bold transition-all duration-200 ${
                            msg.myReactions.includes(emoji)
                              ? "bg-secondary/20 border-secondary/40 text-secondary scale-105"
                              : count > 0 
                                ? "bg-white/5 border-white/10 text-on-surface-variant"
                                : "bg-transparent border-transparent text-on-surface-variant/40 hover:border-white/10 hover:bg-white/5"
                          }`}
                        >
                          <span>{emoji}</span>
                          {count > 0 && <span>{count}</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="p-3 bg-white/5 border-t border-white/10">
          <form 
            onSubmit={handleSendMessage}
            className="flex items-end gap-2 bg-surface-container-high rounded-xl p-1 px-3 border border-white/10 focus-within:border-primary/40 transition-colors"
          >
            <textarea
              rows={1}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={t("groups.chat.placeholder")}
              className="flex-1 bg-transparent border-none text-[11px] text-on-surface py-2 outline-none resize-none scrollbar-hide max-h-24"
              maxLength={200}
            />
            <button 
              type="submit"
              disabled={!newMessage.trim() || sending || newMessage.length > 200}
              className={`mb-0.5 p-1.5 rounded-lg transition-all ${
                !newMessage.trim() || sending || newMessage.length > 200
                  ? "text-on-surface-variant/20 cursor-not-allowed"
                  : "bg-primary text-on-primary shadow-lg shadow-primary/20 hover:scale-105 active:scale-95"
              }`}
            >
              {sending ? (
                <div className="animate-spin h-3.5 w-3.5 border-t-2 border-current border-transparent rounded-full" />
              ) : (
                <Send size={15} />
              )}
            </button>
          </form>
          
          <div className="flex justify-between items-center px-1 mt-1.5">
            <span className="text-[9px] text-on-surface-variant/40">
              Enter to send
            </span>
            {newMessage.length > 0 && (
              <p className={`text-[9px] font-bold ${newMessage.length > 200 ? "text-error" : newMessage.length > 180 ? "text-warning" : "text-on-surface-variant/60"}`}>
                {newMessage.length}/200
              </p>
            )}
          </div>
        </div>
      </div>
      
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};
