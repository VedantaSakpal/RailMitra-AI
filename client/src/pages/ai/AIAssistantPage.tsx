import { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: '1',
    role: 'model',
    text: 'Hello! I am RailMitra AI. I can help you plan your journey, check train schedules, or provide information about Mumbai Local trains. How can I help you today?'
  }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // In a real app we might pass history, but for simplicity we'll just pass the latest message
      // and maybe format history.
      const history = messages.filter(m => m.id !== '1').map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      // In this setup, we assume auth middleware is active. But we might need to send tokens
      // For now we'll just make the request. If auth is strict, this might fail without token,
      // so you should make sure the app has an Axios interceptor or add token here.
      const token = useAuthStore.getState().token;
      
      const response = await fetch('http://localhost:5000/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ message: userMessage.text, history })
      });

      const data = await response.json();
      
      if (data.success) {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: data.data.response
        }]);
      } else {
        throw new Error(data.message || 'Failed to get AI response');
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: 'Sorry, I encountered an error. Please try again later.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 page-enter h-[calc(100vh-6rem)] flex flex-col">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Journey Planner</h1>
        <p className="text-muted-foreground mt-2">Ask our AI assistant to plan your travel, check crowds, and get updates.</p>
      </div>
      
      <div className="flex-1 border border-border/40 bg-card/50 shadow-lg rounded-xl overflow-hidden flex flex-col backdrop-blur-sm">
        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
              }`}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              
              <div className={`px-4 py-2.5 rounded-2xl max-w-[80%] text-sm shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                  : 'bg-background border border-border/50 rounded-tl-sm text-foreground'
              }`}>
                <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-secondary text-secondary-foreground">
                <Bot size={16} />
              </div>
              <div className="px-4 py-3 rounded-2xl bg-background border border-border/50 rounded-tl-sm flex items-center gap-2">
                <Loader2 size={16} className="animate-spin text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-background border-t border-border/40">
          <form 
            onSubmit={handleSend}
            className="flex items-center gap-2 bg-secondary/30 border border-border/50 p-1.5 rounded-full shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all"
          >
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about trains, routes, or delays..." 
              className="flex-1 bg-transparent px-4 py-2 text-sm outline-none placeholder:text-muted-foreground"
              disabled={isLoading}
            />
            <button 
              type="submit"
              disabled={!input.trim() || isLoading}
              className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              <Send size={16} className={input.trim() && !isLoading ? "ml-0.5" : ""} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
