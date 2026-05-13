import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import './ChatWidget.css';

const ChatWidget = () => {
    const { isAuthenticated, user } = useAuth();
    const { isOpen, toggleChat, messages, sendMessage, unreadCount, isConnected } = useChat();
    const [inputText, setInputText] = useState('');
    const [position, setPosition] = useState({ x: 0, y: 0 });
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
    }, [messages, isOpen]);

    if (isStaffOrAdmin) {
        return null;
    }

    const handleSend = (e) => {
        e.preventDefault();
        if (inputText.trim()) {
            sendMessage(inputText.trim());
            setInputText('');
        }
    };

    const handlePointerMove = (e) => {
        const state = dragStateRef.current;
        if (!state.dragging) {
            return;
        }

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
        if (e.button !== 0) {
            return;
        }

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
        if (dragStateRef.current.suppressClick) {
            return;
        }
        toggleChat();
    };

    return (
        <div
            className="chat-widget-container"
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                right: 'auto',
                bottom: 'auto',
            }}
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
                                <div className="chat-title">Hỗ trợ UniqueTee</div>
                                <div className="chat-subtitle">
                                    {isConnected ? 'Sẵn sàng hỗ trợ' : 'Đang kết nối...'}
                                </div>
                            </div>
                        </div>
                        <button 
                            onClick={toggleChat}
                            className="chat-close-btn"
                            aria-label="Đóng chat"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="chat-messages">
                        {messages.length === 0 && (
                            <div className="chat-empty-state">
                                Chào {user?.name || 'bạn'}! Bạn cần hỗ trợ gì không?
                            </div>
                        )}
                        {messages.map((msg, index) => (
                            <div 
                                key={msg.id || index} 
                                className={`message-bubble message-${msg.senderRole}`}
                            >
                                {msg.content}
                                <span className="message-time">
                                    {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    <form className="chat-input-area" onSubmit={handleSend}>
                        <input 
                            type="text" 
                            placeholder="Nhập tin nhắn..." 
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                        />
                        <button type="submit" className="send-button" disabled={!isConnected}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                            </svg>
                        </button>
                    </form>
                </div>
            )}

            {isOpen && !authenticated && (
                <div className="chat-login-modal">
                    <div className="chat-login-content">
                        <div className="login-icon">✿</div>
                        <h3 className="login-title">Hỗ trợ UniqueTee</h3>
                        <p className="login-desc">Hãy đăng nhập để nhắn tin với hỗ trợ viên của chúng tôi</p>
                        <button
                            type="button"
                            className="chat-login-btn"
                            onClick={() => {
                                window.location.href = '/login';
                            }}
                        >
                            Đăng nhập ngay
                        </button>
                        <button
                            type="button"
                            className="chat-cancel-btn"
                            onClick={() => toggleChat()}
                        >
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
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 9l-7 7-7-7" />
                    </svg>
                ) : (
                    <span className="chat-flower-icon" aria-hidden="true">✿</span>
                )}
                {!isOpen && unreadCount > 0 && <div className="chat-badge">{unreadCount}</div>}
            </button>
        </div>
    );
};

export default ChatWidget;
