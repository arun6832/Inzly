import { 
    collection, 
    query, 
    where, 
    getDocs, 
    addDoc, 
    serverTimestamp, 
    orderBy, 
    onSnapshot,
    doc,
    updateDoc,
    limit
} from "firebase/firestore";
import { db } from "./firebase";

export interface Chat {
    id: string;
    participants: string[];
    lastMessage?: string;
    lastMessageSender?: string;
    updatedAt: { toDate?: () => Date } | Date | number | string;
    // Metadata for UI (we'll fetch these based on uids)
    otherUser?: {
        name: string;
        username: string;
        id: string;
    };
}

export interface Message {
    id: string;
    senderId: string;
    text: string;
    timestamp: { toDate?: () => Date } | Date | number | string;
}

/**
 * Finds or creates a chat document between two users
 */
export const getOrCreateChat = async (uid1: string, uid2: string) => {
    const chatsRef = collection(db, "chats");
    // Sort UIDs to ensure stable chat ID if we wanted, 
    // but participants array is fine for simple where query
    const q = query(chatsRef, where("participants", "array-contains", uid1));
    const snap = await getDocs(q);
    
    // Check if any chat has both participants
    const existing = snap.docs.find(doc => {
        const p = doc.data().participants as string[];
        return p.includes(uid2);
    });

    if (existing) return existing.id;

    // Create new chat
    const newChat = await addDoc(chatsRef, {
        participants: [uid1, uid2],
        updatedAt: serverTimestamp(),
        lastMessage: "Start of conversation",
        createdAt: serverTimestamp()
    });

    return newChat.id;
};

/**
 * Sends a message to a specific chat
 */
export const sendMessage = async (chatId: string, senderId: string, text: string) => {
    const messagesRef = collection(db, "chats", chatId, "messages");
    await addDoc(messagesRef, {
        senderId,
        text,
        timestamp: serverTimestamp()
    });

    // Update parent chat metadata
    const chatRef = doc(db, "chats", chatId);
    await updateDoc(chatRef, {
        lastMessage: text,
        lastMessageSender: senderId,
        updatedAt: serverTimestamp()
    });
};

/**
 * Subscribes to messages for a specific chat
 */
export const subscribeToMessages = (chatId: string, callback: (msgs: Message[]) => void) => {
    const q = query(
        collection(db, "chats", chatId, "messages"),
        orderBy("timestamp", "asc"),
        limit(100)
    );

    return onSnapshot(q, (snap) => {
        const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Message));
        callback(msgs);
    });
};

/**
 * Subscribes to the user's active chats
 */
export const subscribeToChats = (uid: string, callback: (chats: Chat[]) => void) => {
    const q = query(
        collection(db, "chats"),
        where("participants", "array-contains", uid),
        orderBy("updatedAt", "desc")
    );

    return onSnapshot(q, async (snap) => {
        const chats = snap.docs.map(d => ({ id: d.id, ...d.data() } as Chat));
        callback(chats);
    });
};
