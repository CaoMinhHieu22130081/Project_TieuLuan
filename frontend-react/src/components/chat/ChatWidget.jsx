import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { 
    CustomChatIcon, CustomAttachIcon, CustomMoreIcon, CustomTrashIcon, 
    CustomSendIcon, CustomCloseIcon, CustomCheckIcon, CustomUndoIcon, 
    CustomSmileIcon, CustomOrderIcon, CustomShippingIcon, CustomReturnIcon, CustomSupportIcon
} from './ChatIcons';
import EmojiPicker from 'emoji-picker-react';
import './ChatWidget.css';

const QUICK_REPLIES = [
    {
        icon: CustomOrderIcon,
        label: { vi: "Kiểm tra đơn hàng", en: "Check order" },
        answer: {
            vi: "Để kiểm tra đơn hàng, bạn vui lòng cung cấp mã vận đơn hoặc số điện thoại định dạng (ví dụ: 0912xxxxx) vào khung chat nhé!",
            en: "To check your order, please send your tracking code or phone number (for example: 0912xxxxx) in the chat box."
        }
    },
    {
        icon: CustomShippingIcon,
        label: { vi: "Phí vận chuyển", en: "Shipping fee" },
        answer: {
            vi: "Tất cả đồ UniqTee đều có phí vận chuyển đồng giá 25k toàn quốc. Đặc biệt freeship cho đơn từ 500k ạ!",
            en: "UniqTee applies a flat 25k nationwide shipping fee. Orders from 500k receive free shipping."
        }
    },
    {
        icon: CustomReturnIcon,
        label: { vi: "Đổi trả hàng", en: "Returns" },
        answer: {
            vi: "Bạn có thể đổi trả miễn phí trong vòng 7 ngày nếu do lỗi sản xuất. Yêu cầu sản phẩm còn nguyên tag và chưa qua sử dụng.",
            en: "You can exchange or return items for free within 7 days if there is a manufacturing issue. Items must be unused and keep the original tag."
        }
    },
    {
        icon: CustomSupportIcon,
        label: { vi: "Gặp nhân viên", en: "Talk to staff" },
        answer: {
            vi: "Đang kết nối với nhân viên hỗ trợ... Bạn vui lòng chờ trong giây lát nhé!",
            en: "Connecting you with a support agent... Please wait a moment."
        }
    }
];

const BUTTON_SIZE = 62;

const getInitialPosition = () => {
    if (typeof window === 'undefined') {
        return { x: 0, y: 0 };
    }

    const initialX = window.innerWidth - BUTTON_SIZE - 24;
    const initialY = window.innerHeight - BUTTON_SIZE - 24;
    return {
        x: Math.max(8, initialX),
        y: Math.max(8, initialY),
    };
};

const ChatWidget = () => {
    const { language, t } = useLanguage();
    const { isAuthenticated, user } = useAuth();
    const { isOpen, toggleChat, messages, setMessages, sendMessage, deleteMessage, unreadCount, isConnected, isTyping, setIsTyping } = useChat();
    const [inputText, setInputText] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [position, setPosition] = useState(getInitialPosition);
    const [activeMsgOptions, setActiveMsgOptions] = useState(null);
    const messagesEndRef = useRef(null);
    const quickReplyIdRef = useRef(0);
    const dragStateRef = useRef({
        dragging: false,
        moved: false,
        offsetX: 0,
        offsetY: 0,
        suppressClick: false,
    });
    const authenticated = isAuthenticated();
    const isStaffOrAdmin = user?.role === 'admin' || user?.role === 'staff';

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
            sendMessage(inputText.trim());
            setInputText('');
            setActiveMsgOptions(null);
            setShowEmojiPicker(false);
        }
    };

    const isOnlyEmojis = (text) => {
        if (!text) return false;
        const stripped = text.replace(/\s+/g, '');
        if (stripped.length === 0) return false;
        return !/[\p{L}\p{N}\p{P}]/u.test(stripped);
    };

    const handleQuickReply = (qr) => {
        quickReplyIdRef.current += 1;
        const clientId = `quick-${quickReplyIdRef.current}`;
        const replyLabel = t(qr.label);
        const replyAnswer = t(qr.answer);
        // User sends the quick reply text
        setMessages(prev => [...prev, {
            id: clientId,
            clientId: clientId,
            senderRole: 'customer',
            content: replyLabel,
            sentAt: new Date().toISOString()
        }]);
        
        setIsTyping(true);
        // Bot responds after a delay
        setTimeout(() => {
            setIsTyping(false);
            quickReplyIdRef.current += 1;
            setMessages(prev => [...prev, {
                id: `quick-${quickReplyIdRef.current}-bot`,
                senderRole: 'admin',
                senderName: 'UniqTee Bot',
                content: replyAnswer,
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
                                <div className="chat-title">{t({ vi: "Hỗ trợ UniqTee", en: "UniqTee Support" })}</div>
                                <div className="chat-subtitle">
                                    {isConnected
                                        ? t({ vi: "Sẵn sàng hỗ trợ", en: "Ready to help" })
                                        : t({ vi: "Đang kết nối...", en: "Connecting..." })}
                                </div>
                            </div>
                        </div>
                        <button onClick={toggleChat} className="chat-close-btn" aria-label={t({ vi: "Đóng chat", en: "Close chat" })}>✕</button>
                    </div>

                    <div className="chat-messages" onClick={() => { setActiveMsgOptions(null); setShowEmojiPicker(false); }}>
                        {/* Empty/Bot State */}
                        {messages.length === 0 && (
                            <div className="chat-bot-welcome">
                                <div className="bot-welcome-avatar">UT</div>
                                <div className="bot-welcome-bubble">
                                    {t({
                                        vi: `Chào ${user?.name || 'bạn'}! Mình là trợ lý ảo của UniqTee. Shop có thể giúp gì cho bạn hôm nay?`,
                                        en: `Hi ${user?.name || 'there'}! I am UniqTee's virtual assistant. How can we help you today?`
                                    })}
                                </div>
                                <div className="quick-replies-container">
                                    {QUICK_REPLIES.map((qr, index) => {
                                        const Icon = qr.icon;
                                        return (
                                            <button key={index} className="quick-reply-btn" onClick={() => handleQuickReply(qr)}>
                                                {Icon && <Icon size={14} />}
                                                <span>{t(qr.label)}</span>
                                            </button>
                                        );
                                    })}
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
                                        {isMe && index === messages.length - 1 && !msg.isDeleted && (
                                            <div className="msg-status-icon" style={{alignSelf: 'flex-end', marginBottom: '8px'}}><CustomCheckIcon size={12} /></div>
                                        )}
                                        <div className={`message-bubble message-${msg.senderRole} ${msg.isDeleted ? 'msg-deleted' : ''} ${!msg.isDeleted && isOnlyEmojis(msg.content) ? 'msg-only-emoji' : ''}`}>
                                            {msg.isDeleted ? <span className="deleted-text"><CustomUndoIcon size={12} style={{marginRight: 4}}/> {t({ vi: "Tin nhắn đã thu hồi", en: "Message unsent" })}</span> : msg.content}
                                            <span className="message-time">
                                                {new Date(msg.sentAt).toLocaleTimeString(language === 'en' ? 'en-US' : 'vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>

                                        {isMe && !msg.isDeleted && (
                                            <div className="msg-actions-wrap">
                                                <button 
                                                    className="msg-more-btn" 
                                                    onClick={(e) => { e.stopPropagation(); setActiveMsgOptions(showOptions ? null : mId); }}
                                                >
                                                    <CustomMoreIcon size={14} />
                                                </button>
                                                {showOptions && (
                                                    <div className="msg-options-menu">
                                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteMsg(mId); }}>
                                                            <CustomTrashIcon size={12} /> {t({ vi: "Thu hồi", en: "Unsend" })}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
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
                        <button type="button" className="attach-button" title={t({ vi: "Đính kèm (Demo)", en: "Attach (Demo)" })}>
                            <CustomAttachIcon size={18} />
                        </button>
                        
                        <div className="emoji-picker-container">
                            <button type="button" className={`emoji-button ${showEmojiPicker ? 'active' : ''}`} title={t({ vi: "Biểu tượng cảm xúc", en: "Emoji" })} onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                                <CustomSmileIcon size={18} />
                            </button>
                            {showEmojiPicker && (
                                <div className="emoji-popover-lib">
                                    <EmojiPicker 
                                        onEmojiClick={(emojiData) => setInputText(prev => prev + emojiData.emoji)}
                                        width={300}
                                        height={400}
                                        searchDisabled={false}
                                        skinTonesDisabled={true}
                                    />
                                </div>
                            )}
                        </div>

                        <input 
                            type="text" 
                            placeholder={t({ vi: "Nhập tin nhắn...", en: "Type a message..." })}
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                        />
                        <button type="submit" className="send-button" disabled={!isConnected || !inputText.trim()}>
                            <CustomSendIcon size={18} />
                        </button>
                    </form>
                </div>
            )}

            {isOpen && !authenticated && (
                <div className="chat-login-modal">
                    <div className="chat-login-content">
                        <div className="login-icon">✿</div>
                        <h3 className="login-title">{t({ vi: "Hỗ trợ UniqTee", en: "UniqTee Support" })}</h3>
                        <p className="login-desc">{t({ vi: "Hãy đăng nhập để nhắn tin với hỗ trợ viên của chúng tôi", en: "Please log in to chat with our support team" })}</p>
                        <button type="button" className="chat-login-btn" onClick={() => window.location.href = '/login'}>
                            {t({ vi: "Đăng nhập ngay", en: "Log in now" })}
                        </button>
                        <button type="button" className="chat-cancel-btn" onClick={() => toggleChat()}>
                            {t({ vi: "Đóng", en: "Close" })}
                        </button>
                    </div>
                </div>
            )}

            <button
                className="chat-button"
                onPointerDown={handleButtonPointerDown}
                onClick={handleButtonClick}
                aria-label={t({ vi: "Mở chat hỗ trợ", en: "Open support chat" })}
                title={t({ vi: "Kéo để di chuyển", en: "Drag to move" })}
            >
                {isOpen ? (
                    <CustomCloseIcon size={26} />
                ) : (
                    <CustomChatIcon size={36} />
                )}
                {!isOpen && unreadCount > 0 && <div className="chat-badge">{unreadCount}</div>}
            </button>
        </div>
    );
};

export default ChatWidget;
