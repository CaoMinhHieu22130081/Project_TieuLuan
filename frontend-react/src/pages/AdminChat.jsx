import React, { useState, useEffect, useRef } from 'react';
import { chatService } from '../services/chatService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { AdminLayout } from './Adminheader';
import './css/Admin.css'; // Reuse some styles
import './css/AdminChat.css';

const AdminChat = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [conversations, setConversations] = useState([]);
    const [selectedConv, setSelectedConv] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    
    const stompClientRef = useRef(null);
    const subscriptionRef = useRef(null);
    const messagesEndRef = useRef(null);

    // Load all conversations
    const loadConversations = async () => {
        try {
            const data = await chatService.getAllConversations();
            setConversations(data);
        } catch (err) {
            console.error("Load conversations error:", err);
        }
    };

    useEffect(() => {
        loadConversations();
        const interval = setInterval(loadConversations, 10000); // Refresh list every 10s
        return () => clearInterval(interval);
    }, []);

    // WebSocket Connection for Admin
    useEffect(() => {
        const client = chatService.createStompClient(
            () => {
                setIsConnected(true);
                // Subscribe to notifications for new messages in ANY conversation
                client.subscribe('/topic/admin/notifications', (message) => {
                    const newMsg = JSON.parse(message.body);
                    loadConversations(); // Refresh list
                    
                    // Only show toast if not current conversation or chat not open on that message
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
    }, [selectedConv, addToast]);

    // Handle conversation selection
    const handleSelectConversation = async (conv) => {
        setSelectedConv(conv);
        try {
            const msgs = await chatService.getMessages(conv.id);
            setMessages(msgs);
            chatService.markAsRead(conv.id, user.role);
            
            // Subscribe to specific conversation topic
            if (stompClientRef.current && stompClientRef.current.connected) {
                if (subscriptionRef.current) subscriptionRef.current.unsubscribe();
                subscriptionRef.current = stompClientRef.current.subscribe(
                    `/topic/conversation/${conv.id}`,
                    (message) => {
                        const newMsg = JSON.parse(message.body);
                        if (newMsg.senderRole === 'customer') {
                            setMessages(prev => [...prev, newMsg]);
                        }
                    }
                );
            }
        } catch (err) {
            console.error("Load messages error:", err);
        }
    };

    const handleSend = (e) => {
        e.preventDefault();
        if (inputText.trim() && selectedConv && isConnected) {
            stompClientRef.current.publish({
                destination: '/app/chat.sendMessage',
                body: JSON.stringify({
                    conversationId: selectedConv.id,
                    senderId: user.id,
                    content: inputText.trim()
                })
            });
            
            // Optimistic update
            const optimisticMsg = {
                senderId: user.id,
                senderRole: user.role,
                content: inputText.trim(),
                sentAt: new Date().toISOString()
            };
            setMessages(prev => [...prev, optimisticMsg]);
            setInputText('');
        }
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    return (
        <AdminLayout title="Hỗ trợ khách hàng" subtitle="Hệ thống chat trực tuyến realtime">
            <div className="admin-chat-container">
                {/* Conversations List */}
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
                                        {conv.unreadCount > 0 && (
                                            <span className="unread-badge">{conv.unreadCount}</span>
                                        )}
                                    </div>
                                    <div className="last-msg">
                                        {conv.lastMessage || "Bắt đầu cuộc trò chuyện"}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Chat Main Area */}
                <div className="chat-window">
                    {selectedConv ? (
                        <>
                            <div className="chat-window-header">
                                <div className="user-avatar chat-window-avatar">
                                    {selectedConv.userName.charAt(0).toUpperCase()}
                                </div>
                                <div className="chat-window-user-meta">
                                    <div className="chat-window-user-name">{selectedConv.userName}</div>
                                    <div className="chat-window-user-status">Trực tuyến</div>
                                </div>
                                <div className={`chat-connection-pill ${isConnected ? 'online' : 'offline'}`}>
                                    {isConnected ? 'Đã kết nối' : 'Mất kết nối'}
                                </div>
                            </div>
                            
                            <div className="chat-messages-area">
                                {messages.map((msg, index) => (
                                    <div 
                                        key={index}
                                        className={`admin-msg-bubble msg-${msg.senderRole}`}
                                    >
                                        <div>{msg.content}</div>
                                        <div className="msg-time">
                                            {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            <form onSubmit={handleSend} className="admin-chat-input">
                                <input 
                                    type="text"
                                    placeholder="Nhập câu trả lời..."
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                />
                                <button type="submit" disabled={!isConnected} className="admin-send-btn">
                                    Gửi
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="empty-chat-state">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                            </svg>
                            <div>Chọn một cuộc hội thoại để bắt đầu hỗ trợ</div>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminChat;
