import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { chatService } from '../services/chatService';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    const { user, isAuthenticated } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [conversation, setConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isTyping, setIsTyping] = useState(false);
    const { addToast } = useToast();
    const stompClientRef = useRef(null);
    const subscriptionRef = useRef(null);

    // Initialize or get conversation for customer
    useEffect(() => {
        if (isAuthenticated() && user && user.role === 'customer') {
            chatService.getOrCreateConversation(user.id)
                .then(conv => {
                    setConversation(conv);
                    return chatService.getMessages(conv.id);
                })
                .then(msgs => {
                    setMessages(msgs);
                    // Check for unread from admin
                    const unread = msgs.filter(m => !m.isRead && m.senderRole !== 'customer').length;
                    setUnreadCount(unread);
                })
                .catch(err => console.error("Chat init error:", err));
        }
    }, [user, isAuthenticated]);

    // WebSocket Connection
    const connect = useCallback(() => {
        // Nếu đã kết nối, không cần kết nối lại
        if (stompClientRef.current?.active) return;
        
        // Nếu client cũ còn tồn tại, deactivate nó trước
        if (stompClientRef.current) {
            try {
                stompClientRef.current.deactivate();
            } catch (e) {
                // Ignore error
            }
        }

        const client = chatService.createStompClient(
            () => {
                console.log('[Chat] STOMP connected');
                setIsConnected(true);
                if (conversation) {
                    subscribeToConversation(conversation.id);
                }
            },
            () => {
                console.log('[Chat] STOMP disconnected');
                setIsConnected(false);
            },
            (err) => {
                console.error("[STOMP Error]", err);
                setIsConnected(false);
            }
        );

        try {
            client.activate();
            stompClientRef.current = client;
        } catch (err) {
            console.error('Failed to activate STOMP client:', err);
        }
    }, [conversation]);

    const subscribeToConversation = useCallback((convId) => {
        if (stompClientRef.current && stompClientRef.current.connected) {
            if (subscriptionRef.current) subscriptionRef.current.unsubscribe();

            subscriptionRef.current = stompClientRef.current.subscribe(
                `/topic/conversation/${convId}`,
                (message) => {
                    const newMsg = JSON.parse(message.body);
                    setMessages(prev => [...prev, newMsg]);
                    
                    if (!isOpen && newMsg.senderRole !== user.role) {
                        setUnreadCount(prev => prev + 1);
                        addToast('Bạn có tin nhắn mới từ hỗ trợ!', 'info');
                    }
                }
            );
        }
    }, [isOpen, user, addToast]);


    useEffect(() => {
        if (isAuthenticated() && conversation) {
            connect();
        }
        return () => {
            try {
                if (stompClientRef.current) {
                    stompClientRef.current.deactivate();
                }
            } catch (err) {
                console.warn('Error deactivating STOMP client:', err);
            }
        };
    }, [isAuthenticated, conversation, connect]);
    const sendMessage = (content) => {
        if (stompClientRef.current && stompClientRef.current.connected && conversation) {
            stompClientRef.current.publish({
                destination: '/app/chat.sendMessage',
                body: JSON.stringify({
                    conversationId: conversation.id,
                    senderId: user.id,
                    content: content
                })
            });
        }
    };

    const toggleChat = () => {
        setIsOpen(!isOpen);
        if (!isOpen && conversation) {
            setUnreadCount(0);
            chatService.markAsRead(conversation.id, user.role);
        }
    };

    const deleteMessage = (msgId) => {
        setMessages(prev => prev.map(m => (m.id === msgId || m.clientId === msgId) ? { ...m, isDeleted: true, content: "Tin nhắn đã bị thu hồi" } : m));
    };

    return (
        <ChatContext.Provider value={{
            isOpen,
            setIsOpen,
            conversation,
            messages,
            setMessages,
            isConnected,
            sendMessage,
            deleteMessage,
            toggleChat,
            unreadCount,
            setUnreadCount,
            isTyping,
            setIsTyping
        }}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error('useChat must be used within ChatProvider');
    }
    return context;
};
