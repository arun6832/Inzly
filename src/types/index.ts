export type UserMode = "explorer" | "sparker" | "builder" | "catalyst";


export interface User {
    id: string;
    email: string;
    username?: string;
    mode: UserMode;
    // other fields...
}

export interface Idea {
    id: string;
    title: string;
    idea: string;
    category: string;
    userId: string;
    authorUsername?: string;
    likesCount?: number; // keeping this for schema, but UI won't show it much
    views?: number;
    githubUrl?: string;
    createdAt?: { toDate?: () => Date } | Date | number | string;
}
