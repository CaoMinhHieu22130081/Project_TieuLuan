import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { chatService } from '../services/chatService';

const ChatContext = createContext();

const DELETED_MESSAGE_TEXT = 'Tin nhắn đã bị thu hồi';

export const ChatProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const authenticated = isAuthenticated();
  const userId = user?.id;
  const userRole = user?.role;
  const isCustomer = authenticated && userId && userRole === 'customer';

  const [isOpen, setIsOpen] = useState(false);
  const [conversation, setConversation] = useState(null);
  const conversationId = conversation?.id;
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isTyping, setIsTyping] = useState(false);

  const stompClientRef = useRef(null);
  const subscriptionRef = useRef(null);
  const requestIdRef = useRef(0);
  const isOpenRef = useRef(isOpen);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  const resetChatState = useCallback(() => {
    setIsOpen(false);
    setConversation(null);
    setMessages([]);
    setIsConnected(false);
    setUnreadCount(0);
    setIsTyping(false);
  }, []);

  const disconnect = useCallback(() => {
    if (subscriptionRef.current) {
      try {
        subscriptionRef.current.unsubscribe();
      } catch (error) {
        console.warn('Error unsubscribing chat topic:', error);
      }
      subscriptionRef.current = null;
    }

    if (stompClientRef.current) {
      try {
        stompClientRef.current.deactivate();
      } catch (error) {
        console.warn('Error deactivating STOMP client:', error);
      }
      stompClientRef.current = null;
    }
  }, []);

  const subscribeToConversation = useCallback((convId) => {
    const client = stompClientRef.current;
    if (!client?.connected || !convId) return;

    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }

    subscriptionRef.current = client.subscribe(
      `/topic/conversation/${convId}`,
      (message) => {
        const incomingMsg = JSON.parse(message.body);

        setMessages((prev) => {
          const existsIndex = prev.findIndex((item) => item.id === incomingMsg.id);
          if (existsIndex >= 0) {
            const nextMessages = [...prev];
            nextMessages[existsIndex] = incomingMsg;
            return nextMessages;
          }
          return [...prev, incomingMsg];
        });

        if (!isOpenRef.current && incomingMsg.senderRole !== userRole && !incomingMsg.isDeleted) {
          setUnreadCount((prev) => prev + 1);
          addToast({ vi: 'Bạn có tin nhắn mới từ hỗ trợ!', en: 'You have a new support message!' }, 'info');
        }
      },
    );
  }, [addToast, userRole]);

  useEffect(() => {
    let cancelled = false;
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    const initializeChat = async () => {
      if (!isCustomer) {
        disconnect();
        resetChatState();
        return;
      }

      try {
        const nextConversation = await chatService.getOrCreateConversation(userId);
        if (cancelled || requestIdRef.current !== requestId) return;

        const nextMessages = await chatService.getMessages(nextConversation.id);
        if (cancelled || requestIdRef.current !== requestId) return;

        setConversation(nextConversation);
        setMessages(Array.isArray(nextMessages) ? nextMessages : []);
        setUnreadCount(
          (Array.isArray(nextMessages) ? nextMessages : [])
            .filter((item) => !item.isRead && item.senderRole !== 'customer').length,
        );
      } catch (error) {
        console.error('Chat init error:', error);
        if (!cancelled && requestIdRef.current === requestId) {
          setConversation(null);
          setMessages([]);
          setUnreadCount(0);
        }
      }
    };

    initializeChat();

    return () => {
      cancelled = true;
    };
  }, [disconnect, isCustomer, resetChatState, userId]);

  useEffect(() => {
    if (!isCustomer || !conversationId) {
      disconnect();
      return undefined;
    }

    if (stompClientRef.current?.active) {
      return undefined;
    }

    const client = chatService.createStompClient(
      () => {
        setIsConnected(true);
        subscribeToConversation(conversationId);
      },
      () => {
        setIsConnected(false);
      },
      (error) => {
        console.error('[STOMP Error]', error);
        setIsConnected(false);
      },
    );

    try {
      client.activate();
      stompClientRef.current = client;
    } catch (error) {
      console.error('Failed to activate STOMP client:', error);
    }

    return () => {
      disconnect();
    };
  }, [conversationId, disconnect, isCustomer, subscribeToConversation]);

  const sendMessage = useCallback((content) => {
    const trimmed = content?.trim();
    if (!trimmed || !stompClientRef.current?.connected || !conversationId || !userId) return;

    stompClientRef.current.publish({
      destination: '/app/chat.sendMessage',
      body: JSON.stringify({
        conversationId,
        senderId: userId,
        content: trimmed,
      }),
    });
  }, [conversationId, userId]);

  const toggleChat = useCallback(() => {
    setIsOpen((open) => {
      const nextOpen = !open;
      if (nextOpen && conversationId && userRole) {
        setUnreadCount(0);
        chatService.markAsRead(conversationId, userRole).catch((error) => {
          console.error('Failed to mark chat as read:', error);
        });
      }
      return nextOpen;
    });
  }, [conversationId, userRole]);

  const deleteMessage = useCallback((msgId) => {
    if (!msgId || !conversationId || !userId || !userRole) return;

    setMessages((prev) => prev.map((message) => (
      message.id === msgId || message.clientId === msgId
        ? { ...message, isDeleted: true, content: DELETED_MESSAGE_TEXT }
        : message
    )));

    if (stompClientRef.current?.connected) {
      stompClientRef.current.publish({
        destination: '/app/chat.deleteMessage',
        body: JSON.stringify({
          id: msgId,
          conversationId,
          senderId: userId,
          senderRole: userRole,
        }),
      });
    }
  }, [conversationId, userId, userRole]);

  const value = useMemo(() => ({
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
    setIsTyping,
  }), [
    isOpen,
    conversation,
    messages,
    isConnected,
    sendMessage,
    deleteMessage,
    toggleChat,
    unreadCount,
    isTyping,
  ]);

  return (
    <ChatContext.Provider value={value}>
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
