import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { MessageSquare, Paperclip, MoreVertical, Trash2, Send, X, CheckCheck, Undo2 } from 'lucide-react';
import './ChatWidget.css';

const QUICK_REPLIES = [
    { label: "📦 Kiểm tra đơn hàng", answer: "Để kiểm tra đơn hàng, bạn vui lòng cung cấp mã vận đơn hoặc số điện thoại định dang (ví dụ: 0912xxxxx) vào khung chat nhé!" },
    { label: "💳 Phí vận chuyển", answer: "Tất cả đồ UniqTee đều có phí vận chuyển đồng giá 25k toàn quốc. Đặc biệt freeship cho đơn từ 500k ạ!" },
    { label: "🔄 Đổi trả hàng", answer: "Bạn có thể đổi trả miễn phí trong vòng 7 ngày nếu do lỗi sản xuất. Yêu cầu sản phẩm còn nguyên tag và chưa qua sử dụng." },
    { label: "🙋 Gặp nhân viên", answer: "Đang kết nối với nhân viên hỗ trợ... Bạn vui lòng chờ trong giây lát nhé!" }
];

const ChatWidget = () => {
    const { isAuthenticated, user } = useAuth();
    const { isOpen, toggleChat, messages, setMessages, sendMessage, deleteMessage, unreadCount, isConnected, isTyping, setIsTyping } = useChat();
    const [inputText, setInputText] = useState('');
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [activeMsgOptions, setActiveMsgOptions] = useState(null);
    const messagesEndRef = useRef(null);
    const dragStateRef = useRef({
        dragging: false,
        moved: false,
        offsetX: 0,
        offsetY: 0,
        suppressClick: false,
    });
    const authenticated = isAuthenticated();
    const isStaffOrAdmin = user?.role === 'admin' || user?.role === 'staff';
    const BUTTON_SIZE = 62;

    useEffect(() => {
        const initialX = window.innerWidth - BUTTON_SIZE - 24;
        const initialY = window.innerHeight - BUTTON_SIZE - 24;
        setPosition({
            x: Math.max(8, initialX),
            y: Math.max(8, initialY),
        });
    }, []);

    useEffect(() => {
        const handleResize = () => {
            setPosition((prev) => {
                const maxX = Math.max(8, window.innerWidth - BUTTON_SIZE - 8);
                const maxY = Math.max(8, window.innerHeight - BUTTON_SIZE - 8);
                return {
                    x: Math.min(prev.x, maxX),
                    y: Math.min(prev.y, maxY),
                };
            });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen, isTyping]);

    if (isStaffOrAdmin) {
        return null;
    }

    const handleSend = (e) => {
        e.preventDefault();
        if (inputText.trim()) {
            // Optimistic update for sender's message (assign temporary clientId)
            const clientId = Date.now().toString();
            setMessages(prev => [...prev, {
                id: clientId,
                clientId: clientId,
                senderRole: 'customer',
                content: inputText.trim(),
                sentAt: new Date().toISOString(),
                isDeleted: false
            }]);
            sendMessage(inputText.trim());
            setInputText('');
            setActiveMsgOptions(null);
        }
    };

    const handleQuickReply = (qr) => {
        const clientId = Date.now().toString();
        // User sends the quick reply text
        setMessages(prev => [...prev, {
            id: clientId,
            clientId: clientId,
            senderRole: 'customer',
            content: qr.label,
            sentAt: new Date().toISOString()
        }]);
        
        setIsTyping(true);
        // Bot responds after a delay
        setTimeout(() => {
            setIsTyping(false);
            setMessages(prev => [...prev, {
                id: Date.now().toString() + "_bot",
                senderRole: 'admin',
                senderName: 'UniqTee Bot',
                content: qr.answer,
                sentAt: new Date().toISOString()
            }]);
        }, 1500);
    };

    const handlePointerMove = (e) => {
        const state = dragStateRef.current;
        if (!state.dragging) return;

        const nextX = e.clientX - state.offsetX;
        const nextY = e.clientY - state.offsetY;
        const maxX = Math.max(8, window.innerWidth - BUTTON_SIZE - 8);
        const maxY = Math.max(8, window.innerHeight - BUTTON_SIZE - 8);

        if (Math.abs(nextX - position.x) > 2 || Math.abs(nextY - position.y) > 2) {
            state.moved = true;
        }

        setPosition({
            x: Math.min(Math.max(8, nextX), maxX),
            y: Math.min(Math.max(8, nextY), maxY),
        });
    };

    const handlePointerUp = () => {
        const state = dragStateRef.current;
        state.dragging = false;
        if (state.moved) {
            state.suppressClick = true;
            setTimeout(() => {
                dragStateRef.current.suppressClick = false;
            }, 50);
        }

        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
    };

    const handleButtonPointerDown = (e) => {
        if (e.button !== 0) return;

        dragStateRef.current = {
            dragging: true,
            moved: false,
            offsetX: e.clientX - position.x,
            offsetY: e.clientY - position.y,
            suppressClick: false,
        };

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
    };

    const handleButtonClick = () => {
        if (dragStateRef.current.suppressClick) return;
        toggleChat();
    };

    const handleDeleteMsg = (msgId) => {
        deleteMessage(msgId);
        setActiveMsgOptions(null);
    };

    return (
        <div
            className="chat-widget-container"
            style={{ left: `${position.x}px`, top: `${position.y}px`, right: 'auto', bottom: 'auto' }}
        >
            {isOpen && authenticated && (
                <div className="chat-box">
                    <div className="chat-header">
                        <div className="chat-header-info">
                            <div className="chat-avatar chat-avatar-wrap">
                                UT
                                {isConnected && <div className="status-dot"></div>}
                            </div>
                            <div>
                                <div className="chat-title">Hỗ trợ UniqTee</div>
                                <div className="chat-subtitle">
                                    {isConnected ? 'Sẵn sàng hỗ trợ' : 'Đang kết nối...'}
                                </div>
                            </div>
                        </div>
                        <button onClick={toggleChat} className="chat-close-btn" aria-label="Đóng chat">✕</button>
                    </div>

                    <div className="chat-messages" onClick={() => setActiveMsgOptions(null)}>
                        {/* Empty/Bot State */}
                        {messages.length === 0 && (
                            <div className="chat-bot-welcome">
                                <div className="bot-welcome-avatar">UT</div>
                                <div className="bot-welcome-bubble">
                                    Chào {user?.name || 'bạn'}! 👋 Mình là trợ lý ảo của UniqTee. Shop có thể giúp gì cho bạn hôm nay?
                                </div>
                                <div className="quick-replies-container">
                                    {QUICK_REPLIES.map((qr, index) => (
                                        <button key={index} className="quick-reply-btn" onClick={() => handleQuickReply(qr)}>
                                            {qr.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {messages.map((msg, index) => {
                            const isMe = msg.senderRole === 'customer';
                            const mId = msg.id || msg.clientId || index;
                            const showOptions = activeMsgOptions === mId;

                            return (
                                <div key={mId} className={`message-row ${isMe ? 'row-me' : 'row-them'}`}>
                                    {!isMe && (
                                        <div className="msg-avatar-small">
                                            {msg.senderName ? msg.senderName.charAt(0).toUpperCase() : 'U'}
                                        </div>
                                    )}
                                    <div className="message-bubble-wrapper">
                                        <div className={`message-bubble message-${msg.senderRole} ${msg.isDeleted ? 'msg-deleted' : ''}`}>
                                            {msg.isDeleted ? <span className="deleted-text"><Undo2 size={12} style={{marginRight: 4}}/> Tin nhắn đã thu hồi</span> : msg.content}
                                            <span className="message-time">
                                                {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>

                                        {isMe && !msg.isDeleted && (
                                            <div className="msg-actions-wrap">
                                                <button 
                                                    className="msg-more-btn" 
                                                    onClick={(e) => { e.stopPropagation(); setActiveMsgOptions(showOptions ? null : mId); }}
                                                >
                                                    <MoreVertical size={14} />
                                                </button>
                                                {showOptions && (
                                                    <div className="msg-options-menu">
                                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteMsg(mId); }}>
                                                            <Trash2 size={12} /> Thu hồi
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    {isMe && index === messages.length - 1 && !msg.isDeleted && (
                                        <div className="msg-status-icon"><CheckCheck size={12} /></div>
                                    )}
                                </div>
                            );
                        })}

                        {isTyping && (
                            <div className="message-row row-them">
                                <div className="msg-avatar-small">U</div>
                                <div className="message-bubble message-admin typing-bubble">
                                    <span className="dot"></span>
                                    <span className="dot"></span>
                                    <span className="dot"></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <form className="chat-input-area" onSubmit={handleSend}>
                        <button type="button" className="attach-button" title="Đính kèm (Demo)">
                            <Paperclip size={18} />
                        </button>
                        <input 
                            type="text" 
                            placeholder="Nhập tin nhắn..." 
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                        />
                        <button type="submit" className="send-button" disabled={!isConnected || !inputText.trim()}>
                            <Send size={18} />
                        </button>
                    </form>
                </div>
            )}

            {isOpen && !authenticated && (
                <div className="chat-login-modal">
                    <div className="chat-login-content">
                        <div className="login-icon">✿</div>
                        <h3 className="login-title">Hỗ trợ UniqTee</h3>
                        <p className="login-desc">Hãy đăng nhập để nhắn tin với hỗ trợ viên của chúng tôi</p>
                        <button type="button" className="chat-login-btn" onClick={() => window.location.href = '/login'}>
                            Đăng nhập ngay
                        </button>
                        <button type="button" className="chat-cancel-btn" onClick={() => toggleChat()}>
                            Đóng
                        </button>
                    </div>
                </div>
            )}

            <button
                className="chat-button"
                onPointerDown={handleButtonPointerDown}
                onClick={handleButtonClick}
                aria-label="Mở chat hỗ trợ"
                title="Kéo để di chuyển"
            >
                {isOpen ? (
                    <X size={24} />
                ) : (
                    <MessageSquare size={24} />
                )}
                {!isOpen && unreadCount > 0 && <div className="chat-badge">{unreadCount}</div>}
            </button>
        </div>
    );
};

export default ChatWidget;
