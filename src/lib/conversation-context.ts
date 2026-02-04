/**
 * Conversation Context Manager
 * Track context across multiple messages in a conversation
 */

export interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
    metadata?: Record<string, any>;
}

export interface ConversationState {
    sessionId: string;
    messages: Message[];
    entities: Record<string, any>;
    intent: string | null;
    lastActivity: number;
    metadata: Record<string, any>;
}

export interface ContextConfig {
    maxMessages?: number;
    sessionTimeout?: number; // in milliseconds
    entityPersistence?: boolean;
    intentTracking?: boolean;
}

export class ConversationContext {
    private sessions: Map<string, ConversationState> = new Map();
    private config: Required<ContextConfig>;

    constructor(config: ContextConfig = {}) {
        this.config = {
            maxMessages: config.maxMessages ?? 50,
            sessionTimeout: config.sessionTimeout ?? 30 * 60 * 1000, // 30 minutes
            entityPersistence: config.entityPersistence ?? true,
            intentTracking: config.intentTracking ?? true
        };
    }

    /**
     * Get or create a session
     */
    getSession(sessionId: string): ConversationState {
        let session = this.sessions.get(sessionId);

        if (!session) {
            session = this.createSession(sessionId);
        } else if (this.isSessionExpired(session)) {
            // Session expired, create new one but preserve some context
            const preservedEntities = this.config.entityPersistence ? session.entities : {};
            session = this.createSession(sessionId);
            session.entities = preservedEntities;
        }

        return session;
    }

    /**
     * Add a message to the session
     */
    addMessage(sessionId: string, role: 'user' | 'assistant', content: string, metadata?: Record<string, any>): void {
        const session = this.getSession(sessionId);

        const message: Message = {
            role,
            content,
            timestamp: Date.now(),
            metadata
        };

        session.messages.push(message);
        session.lastActivity = Date.now();

        // Trim messages if exceeding max
        if (session.messages.length > this.config.maxMessages) {
            session.messages = session.messages.slice(-this.config.maxMessages);
        }

        this.sessions.set(sessionId, session);
    }

    /**
     * Set an entity in the session context
     */
    setEntity(sessionId: string, key: string, value: any): void {
        const session = this.getSession(sessionId);
        session.entities[key] = value;
        session.lastActivity = Date.now();
        this.sessions.set(sessionId, session);
    }

    /**
     * Get an entity from the session context
     */
    getEntity(sessionId: string, key: string): any {
        const session = this.sessions.get(sessionId);
        return session?.entities[key];
    }

    /**
     * Set current intent
     */
    setIntent(sessionId: string, intent: string): void {
        if (!this.config.intentTracking) return;
        const session = this.getSession(sessionId);
        session.intent = intent;
        this.sessions.set(sessionId, session);
    }

    /**
     * Get current intent
     */
    getIntent(sessionId: string): string | null {
        return this.sessions.get(sessionId)?.intent ?? null;
    }

    /**
     * Get conversation history as formatted string
     */
    getHistory(sessionId: string, lastN?: number): string {
        const session = this.sessions.get(sessionId);
        if (!session) return '';

        const messages = lastN ? session.messages.slice(-lastN) : session.messages;
        return messages.map(m => `${m.role}: ${m.content}`).join('\n');
    }

    /**
     * Get only user messages
     */
    getUserMessages(sessionId: string): string[] {
        const session = this.sessions.get(sessionId);
        if (!session) return [];
        return session.messages.filter(m => m.role === 'user').map(m => m.content);
    }

    /**
     * Get message count
     */
    getMessageCount(sessionId: string): number {
        return this.sessions.get(sessionId)?.messages.length ?? 0;
    }

    /**
     * Get session duration in seconds
     */
    getSessionDuration(sessionId: string): number {
        const session = this.sessions.get(sessionId);
        if (!session || session.messages.length === 0) return 0;

        const firstMessage = session.messages[0].timestamp;
        const lastMessage = session.messages[session.messages.length - 1].timestamp;
        return Math.round((lastMessage - firstMessage) / 1000);
    }

    /**
     * Set session metadata
     */
    setMetadata(sessionId: string, key: string, value: any): void {
        const session = this.getSession(sessionId);
        session.metadata[key] = value;
        this.sessions.set(sessionId, session);
    }

    /**
     * Get session metadata
     */
    getMetadata(sessionId: string, key: string): any {
        return this.sessions.get(sessionId)?.metadata[key];
    }

    /**
     * Clear a session
     */
    clearSession(sessionId: string): void {
        this.sessions.delete(sessionId);
    }

    /**
     * Get all active session IDs
     */
    getActiveSessions(): string[] {
        const now = Date.now();
        const active: string[] = [];

        this.sessions.forEach((session, id) => {
            if (now - session.lastActivity < this.config.sessionTimeout) {
                active.push(id);
            }
        });

        return active;
    }

    /**
     * Clean up expired sessions
     */
    cleanup(): number {
        const now = Date.now();
        let removed = 0;

        this.sessions.forEach((session, id) => {
            if (this.isSessionExpired(session)) {
                this.sessions.delete(id);
                removed++;
            }
        });

        return removed;
    }

    /**
     * Export session data (for persistence)
     */
    exportSession(sessionId: string): ConversationState | null {
        return this.sessions.get(sessionId) ?? null;
    }

    /**
     * Import session data (from persistence)
     */
    importSession(sessionId: string, state: ConversationState): void {
        this.sessions.set(sessionId, state);
    }

    /**
     * Get context summary for AI prompts
     */
    getContextSummary(sessionId: string): {
        messageCount: number;
        sessionDuration: number;
        currentIntent: string | null;
        entities: Record<string, any>;
        recentTopics: string[];
    } {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return {
                messageCount: 0,
                sessionDuration: 0,
                currentIntent: null,
                entities: {},
                recentTopics: []
            };
        }

        // Extract recent topics from user messages
        const recentUserMessages = session.messages
            .filter(m => m.role === 'user')
            .slice(-5)
            .map(m => m.content);

        return {
            messageCount: session.messages.length,
            sessionDuration: this.getSessionDuration(sessionId),
            currentIntent: session.intent,
            entities: session.entities,
            recentTopics: recentUserMessages
        };
    }

    private createSession(sessionId: string): ConversationState {
        const session: ConversationState = {
            sessionId,
            messages: [],
            entities: {},
            intent: null,
            lastActivity: Date.now(),
            metadata: {}
        };
        this.sessions.set(sessionId, session);
        return session;
    }

    private isSessionExpired(session: ConversationState): boolean {
        return Date.now() - session.lastActivity > this.config.sessionTimeout;
    }
}

export default ConversationContext;
