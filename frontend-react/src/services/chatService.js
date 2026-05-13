import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const API_BASE_URL = 'http://localhost:8080/api/chat';
const WS_URL = 'http://localhost:8080/api/ws';


const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

const getWebSocketHeaders = () => {
    const token = localStorage.getItem('authToken');
    const headers = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

const createSockJSSocket = () => {
    return new SockJS(WS_URL, null, {
        transports: ['websocket', 'xhr-streaming', 'xhr-polling']
    });
};
export const chatService = {
    // REST API
    getOrCreateConversation: async (userId) => {
        const response = await fetch(`${API_BASE_URL}/conversation?userId=${userId}`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to get conversation');
        return await response.json();
    },

    getMessages: async (conversationId) => {
        const response = await fetch(`${API_BASE_URL}/messages/${conversationId}`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to get messages');
        return await response.json();
    },

    getAllConversations: async () => {
        const response = await fetch(`${API_BASE_URL}/conversations`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to get conversations');
        return await response.json();
    },

    markAsRead: async (conversationId, role) => {
        await fetch(`${API_BASE_URL}/read/${conversationId}?role=${role}`, {
            method: 'PUT',
            headers: getAuthHeaders()
        });
    },

    // WebSocket
    createStompClient: (onConnect, onDisconnect, onError) => {
        const socket = createSockJSSocket();
        const client = new Client({
            webSocketFactory: () => socket,
            connectHeaders: getWebSocketHeaders(),
            debug: (str) => {
                // Uncomment for debugging
                // console.log('[STOMP]', str);
            },
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            onConnect: onConnect,
            onDisconnect: onDisconnect,
            onStompError: onError,
            onWebSocketError: (error) => {
                console.error('[WebSocket Error]', error);
                onError(error);
            }
        });

        return client;
    }
};
