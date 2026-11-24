export interface AgentPost {
  from: string;
  mentions: string[];
  text: string;
}

export type AgentHandler = (post: AgentPost) => void | Promise<void>;

export interface AgentBus {
  post(post: AgentPost): Promise<void>;
  /** Returns a function that unsubscribes the handler. */
  subscribe(handler: AgentHandler): () => void;
}
