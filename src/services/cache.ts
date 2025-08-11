import { 
  getConversations as dbGetConversations,
  getConversation as dbGetConversation,
  getMessages as dbGetMessages,
  type Conversation,
  type Message
} from './database';

const conversationCache = new Map<number, Conversation>();
const messageCache = new Map<number, Message[]>();
const conversationListCache = { data: null as Conversation[] | null, timestamp: 0 };

const CACHE_DURATION = 5 * 60 * 1000;

export async function getConversations(): Promise<Conversation[]> {
  if (conversationListCache.data && Date.now() - conversationListCache.timestamp < CACHE_DURATION) {
    return conversationListCache.data;
  }
  
  try {
    const conversations = await dbGetConversations();
    conversationListCache.data = conversations;
    conversationListCache.timestamp = Date.now();
    
    conversations.forEach(conv => {
      conversationCache.set(conv.id, conv);
    });
    
    return conversations;
  } catch (error) {
    return conversationListCache.data || [];
  }
}

export async function getConversation(id: number): Promise<Conversation | null> {
  if (conversationCache.has(id)) {
    return conversationCache.get(id)!;
  }
  
  try {
    const conversation = await dbGetConversation(id);
    if (conversation) {
      conversationCache.set(id, conversation);
    }
    
    return conversation;
  } catch (error) {
    return null;
  }
}

export async function getMessages(conversationId: number): Promise<Message[]> {
  if (messageCache.has(conversationId)) {
    return messageCache.get(conversationId)!;
  }
  
  try {
    const messages = await dbGetMessages(conversationId);
    messageCache.set(conversationId, messages);
    
    return messages;
  } catch (error) {
    return [];
  }
}

export function invalidateConversationCache(): void {
  conversationListCache.data = null;
  conversationCache.clear();
}

export function invalidateMessageCache(conversationId?: number): void {
  if (conversationId) {
    messageCache.delete(conversationId);
  } else {
    messageCache.clear();
  }
}

export function updateConversationCache(conversation: Conversation): void {
  conversationCache.set(conversation.id, conversation);
  
  if (conversationListCache.data) {
    const index = conversationListCache.data.findIndex(c => c.id === conversation.id);
    if (index !== -1) {
      conversationListCache.data[index] = conversation;
    } else {
      conversationListCache.data.unshift(conversation);
    }
  }
}

export function addMessageToCache(conversationId: number, message: Message): void {
  const messages = messageCache.get(conversationId);
  if (messages) {
    messages.push(message);
  }
}
