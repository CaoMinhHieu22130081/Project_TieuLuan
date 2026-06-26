import React, { useState, useEffect, useRef, useCallback } from 'react';
import { chatService } from '../services/chatService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { AdminLayout } from './Adminheader';
import { MoreVertical, Trash2, CheckCircle2, Zap, Send, MessageSquareOff, Undo2, Smile } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import './css/Admin.css';
import './css/AdminChat.css';

const CANNED_RESPONSES = [
    "Chào bạn, UniqTee có thể giúp gì cho bạn ạ?",
    "Đơn hàng của bạn đã được xác nhận và đang đóng gói nhé.",
    "Dạ sản phẩm này hiện tại bên mình vẫn còn hàng, bạn đặt lẹ kẻo hết nha!",
    "Cảm ơn bạn đã phản hồi, shop sẽ kiểm tra và báo lại ngay.",
    "Bạn có thể nhắn tin mã đơn hàng để shop check lịch trình nhé.",
    "Cảm ơn bạn đã ủng hộ UniqTee ❤️"
];

const AdminChat = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [conversations, setConversations] = useState([]);
    const [selectedConv, setSelectedConv] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [showCanned, setShowCanned] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [activeMsgOptions, setActiveMsgOptions] = useState(null);
    
    const stompClientRef = useRef(null);
    const subscriptionRef = useRef(null);
    const messagesEndRef = useRef(null);

    const loadConversations = useCallback(async () => {
        try {
            const data = await chatService.getAllConversations();
            setConversations(data);
        } catch (err) {
            console.error("Load conversations error:", err);
        }
    }, []);

    useEffect(() => {
        const initialLoad = window.setTimeout(() => {
            void loadConversations();
        }, 0);
        const interval = setInterval(loadConversations, 10000); // 10s
        return () => {
            window.clearTimeout(initialLoad);
            clearInterval(interval);
        };
    }, [loadConversations]);

    useEffect(() => {
        const client = chatService.createStompClient(
            () => {
                setIsConnected(true);
                client.subscribe('/topic/admin/notifications', (message) => {
                    const newMsg = JSON.parse(message.body);
                    loadConversations();
                    
                    if (!selectedConv || selectedConv.id !== newMsg.conversationId) {
                        addToast(`Tin nhắn mới từ ${newMsg.senderName}`, 'info');
                    }
                    
                    if (selectedConv && selectedConv.id === newMsg.conversationId) {
                        setMessages(prev => [...prev, newMsg]);
                    }
                });
            },
            () => setIsConnected(false),
            (err) => console.error("Admin STOMP Error:", err)
        );

        client.activate();
        stompClientRef.current = client;
        return () => client.deactivate();
    }, [selectedConv, addToast, loadConversations]);

    const handleSelectConversation = async (conv) => {
        setSelectedConv(conv);
        setActiveMsgOptions(null);
        setShowCanned(false);
        setShowEmojiPicker(false);
        try {
            const msgs = await chatService.getMessages(conv.id);
            setMessages(msgs);
            chatService.markAsRead(conv.id, user.role);
            
            if (stompClientRef.current && stompClientRef.current.connected) {
                if (subscriptionRef.current) subscriptionRef.current.unsubscribe();
                subscriptionRef.current = stompClientRef.current.subscribe(
                    `/topic/conversation/${conv.id}`,
                    (message) => {
                        const newMsg = JSON.parse(message.body);
                        setMessages(prev => {
                            const existsIndex = prev.findIndex(m => m.id === newMsg.id);
                            if (existsIndex >= 0) {
                                const newArr = [...prev];
                                newArr[existsIndex] = newMsg;
                                return newArr;
                            }
                            if (newMsg.senderRole === 'customer' || newMsg.senderRole === 'admin' || newMsg.senderRole === 'staff') {
                                return [...prev, newMsg];
                            }
                            return prev;
                        });
                    }
                );
            }
        } catch (err) {
            console.error("Load messages error:", err);
        }
    };

    const handleSend = (e) => {
        e?.preventDefault();
        if (inputText.trim() && selectedConv && isConnected) {
            stompClientRef.current.publish({
                destination: '/app/chat.sendMessage',
                body: JSON.stringify({
                    conversationId: selectedConv.id,
                    senderId: user.id,
                    content: inputText.trim()
                })
            });
            setInputText('');
            setShowCanned(false);
            setShowEmojiPicker(false);
        }
    };

    const handleDeleteMsg = (msgId) => {
        // Optimistic update
        setMessages(prev => prev.map(m => (m.id === msgId || m.clientId === msgId) ? { ...m, isDeleted: true, content: "Tin nhắn đã bị thu hồi" } : m));
        
        // Send to server
        if (stompClientRef.current && stompClientRef.current.connected && selectedConv) {
            stompClientRef.current.publish({
                destination: '/app/chat.deleteMessage',
                body: JSON.stringify({
                    id: msgId,
                    conversationId: selectedConv.id,
                    senderId: user.id,
                    senderRole: user.role
                })
            });
        }
        setActiveMsgOptions(null);
    };

    const handleEndChat = () => {
        addToast("Đã đánh dấu hoàn tất hội thoại", "success");
        setSelectedConv(null);
    };

    const isOnlyEmojis = (text) => {
        if (!text) return false;
        const stripped = text.replace(/\s+/g, '');
        if (stripped.length === 0) return false;
        return !/[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/i.test(stripped);
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    return (
        <AdminLayout title="Hỗ trợ khách hàng" subtitle="Hệ thống chat trực tuyến realtime & AI Bots">
            <div className="admin-chat-container">
                {/* Sidebar */}
                <div className="conversations-sidebar">
                    <div className="sidebar-header">
                        <h3>Hội thoại</h3>
                        <p className="sidebar-subtitle">Quản lý trao đổi với khách hàng</p>
                    </div>
                    <div className="conversations-list">
                        {conversations.map(conv => (
                            <div 
                                key={conv.id}
                                onClick={() => handleSelectConversation(conv)}
                                className={`conversation-item ${selectedConv?.id === conv.id ? 'active' : ''}`}
                            >
                                <div className="user-avatar">
                                    {conv.userName.charAt(0).toUpperCase()}
                                </div>
                                <div className="conv-info">
                                    <div className="conv-top">
                                        <span className="conv-name">{conv.userName}</span>
                                        {conv.unreadCount > 0 && <span className="unread-badge">{conv.unreadCount}</span>}
                                    </div>
                                    <div className="last-msg">
                                        {conv.lastMessage || "Bắt đầu cuộc trò chuyện"}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Area */}
                <div className="chat-window">
                    {selectedConv ? (
                        <>
                            <div className="chat-window-header">
                                <div className="chat-window-header-left">
                                    <div className="user-avatar chat-window-avatar">
                                        {selectedConv.userName.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="chat-window-user-meta">
                                        <div className="chat-window-user-name">{selectedConv.userName}</div>
                                        <div className="chat-connection-pill online">
                                            Trực tuyến
                                        </div>
                                    </div>
                                </div>
                                <div className="chat-window-header-actions">
                                    <button className="chat-resolve-btn" onClick={handleEndChat} title="Đánh dấu đã giải quyết">
                                        <CheckCircle2 size={16} style={{marginRight: 6}} /> Đóng chat
                                    </button>
                                </div>
                            </div>
                            
                            <div className="chat-messages-area" onClick={() => setActiveMsgOptions(null)}>
                                {messages.length === 0 && (
                                    <div className="chat-history-empty">Chưa có tin nhắn nào. Bắt đầu hỗ trợ ngay!</div>
                                )}
                                {messages.map((msg, index) => {
                                    const safeRole = (msg.senderRole || '').toLowerCase();
                                    const isMe = safeRole === 'admin' || safeRole === 'staff' || msg.senderId === user.id;
                                    const mId = msg.id || msg.clientId || index;
                                    const showOptions = activeMsgOptions === mId;
                                    const bubbleClass = isMe ? 'msg-admin' : 'msg-customer';

                                    return (
                                        <div key={mId} className={`admin-msg-row ${isMe ? 'msg-row-me' : 'msg-row-them'}`}>
                                            <div className="admin-msg-bubble-wrapper">
                                                <div className={`admin-msg-bubble ${bubbleClass} ${msg.isDeleted ? 'msg-deleted-admin' : ''} ${!msg.isDeleted && isOnlyEmojis(msg.content) ? 'msg-only-emoji' : ''}`}>
                                                    {msg.isDeleted ? <span className="deleted-text-admin"><Undo2 size={12} style={{marginRight: 4}}/> Đã thu hồi</span> : msg.content}
                                                    <div className="msg-time">
                                                        {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>

                                                {isMe && !msg.isDeleted && (
                                                    <div className="admin-msg-actions">
                                                        <button 
                                                            className="admin-msg-more-btn" 
                                                            onClick={(e) => { e.stopPropagation(); setActiveMsgOptions(showOptions ? null : mId); }}
                                                        >
                                                            <MoreVertical size={14} />
                                                        </button>
                                                        {showOptions && (
                                                            <div className="admin-msg-options-menu">
                                                                <button onClick={(e) => { e.stopPropagation(); handleDeleteMsg(mId); }}>
                                                                    <Trash2 size={12} /> Thu hồi
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            <div className="admin-chat-input-wrapper">
                                {/* Canned Responses Toolbar */}
                                {showCanned && (
                                    <div className="canned-responses-popup">
                                        <div className="canned-header">
                                            <span>Tin nhắn mẫu (Quick Replies)</span>
                                        </div>
                                        <div className="canned-list">
                                            {CANNED_RESPONSES.map((res, idx) => (
                                                <button key={idx} className="canned-item" onClick={() => { setInputText(res); setShowCanned(false); }}>
                                                    {res}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {showEmojiPicker && (
                                    <div className="admin-emoji-picker-container">
                                        <EmojiPicker 
                                            onEmojiClick={(emojiData) => setInputText(prev => prev + emojiData.emoji)}
                                            autoFocusSearch={false}
                                            searchDisabled={false}
                                            skinTonesDisabled
                                            height={350}
                                            width={300}
                                            previewConfig={{showPreview: false}}
                                        />
                                    </div>
                                )}

                                <form onSubmit={handleSend} className="admin-chat-input-inner">
                                    <button 
                                        type="button" 
                                        className={`quick-reply-toggle ${showCanned ? 'active' : ''}`}
                                        onClick={() => { setShowCanned(!showCanned); setShowEmojiPicker(false); }}
                                        title="Tin nhắn mẫu"
                                    >
                                        <Zap size={18} />
                                    </button>
                                    <button 
                                        type="button" 
                                        className={`quick-reply-toggle ${showEmojiPicker ? 'active' : ''}`}
                                        onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowCanned(false); }}
                                        title="Biểu tượng cảm xúc"
                                    >
                                        <Smile size={18} />
                                    </button>
                                    <input 
                                        type="text"
                                        placeholder="Nhập câu trả lời cho khách hàng (Enter để gửi)..."
                                        value={inputText}
                                        onChange={(e) => setInputText(e.target.value)}
                                        onClick={() => { setShowEmojiPicker(false); setShowCanned(false); }}
                                    />
                                    <button type="submit" disabled={!isConnected || !inputText.trim()} className="admin-send-btn">
                                        <Send size={16} />
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="empty-chat-state">
                            <MessageSquareOff size={48} strokeWidth={1.5} style={{color: '#a496a8', marginBottom: 16}} />
                            <div style={{fontSize: 16, fontWeight: 600, color: '#4f3a4f'}}>Chưa chọn cuộc trò chuyện</div>
                            <div style={{color: '#8c7b8c', marginTop: 4, fontSize: 14}}>Chọn một khách hàng ở danh sách bên trái để hỗ trợ</div>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminChat;
