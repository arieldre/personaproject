import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { personasAPI } from '../services/api';
import {
  ArrowLeft,
  Send,
  Loader2,
  Plus,
  MessageSquare,
  User,
  Bot,
  MoreVertical,
  Trash2,
  Save,
} from 'lucide-react';
import toast from 'react-hot-toast';

const ChatPage = () => {
  const { id: personaId, conversationId } = useParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const [persona, setPersona] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Fetch persona and conversations
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [personaRes, convsRes] = await Promise.all([
          personasAPI.get(personaId),
          personasAPI.getConversations(personaId),
        ]);
        setPersona(personaRes.data);
        setConversations(convsRes.data.conversations);

        // If conversationId provided, load it
        if (conversationId) {
          const convRes = await personasAPI.getConversation(conversationId);
          setCurrentConversation(convRes.data.conversation);
          setMessages(convRes.data.messages);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast.error('Failed to load chat');
        navigate('/personas');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [personaId, conversationId, navigate]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on load
  useEffect(() => {
    if (!loading) {
      inputRef.current?.focus();
    }
  }, [loading]);

  const startNewConversation = async () => {
    try {
      const response = await personasAPI.createConversation(personaId);
      const newConv = response.data;
      setConversations((prev) => [newConv, ...prev]);
      setCurrentConversation(newConv);
      setMessages([]);
      navigate(`/personas/${personaId}/chat/${newConv.id}`);
    } catch (error) {
      toast.error('Failed to start conversation');
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || sending) return;

    // Start conversation if needed
    let convId = currentConversation?.id;
    if (!convId) {
      try {
        const response = await personasAPI.createConversation(personaId);
        const newConv = response.data;
        setConversations((prev) => [newConv, ...prev]);
        setCurrentConversation(newConv);
        convId = newConv.id;
        navigate(`/personas/${personaId}/chat/${newConv.id}`, { replace: true });
      } catch (error) {
        toast.error('Failed to start conversation');
        return;
      }
    }

    const userMessage = inputValue.trim();
    setInputValue('');
    setSending(true);

    // Add user message optimistically
    setMessages((prev) => [
      ...prev,
      {
        id: `temp-${Date.now()}`,
        role: 'user',
        content: userMessage,
        created_at: new Date().toISOString(),
      },
    ]);

    try {
      const response = await personasAPI.sendMessage(convId, userMessage);
      // Add assistant message
      setMessages((prev) => [...prev, response.data.message]);
    } catch (error) {
      toast.error('Failed to send message');
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => !m.id.toString().startsWith('temp-')));
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const loadConversation = async (convId) => {
    try {
      const response = await personasAPI.getConversation(convId);
      setCurrentConversation(response.data.conversation);
      setMessages(response.data.messages);
      navigate(`/personas/${personaId}/chat/${convId}`);
    } catch (error) {
      toast.error('Failed to load conversation');
    }
  };

  const deleteConversation = async (convId) => {
    if (!confirm('Delete this conversation?')) return;

    try {
      await personasAPI.deleteConversation(convId);
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (currentConversation?.id === convId) {
        setCurrentConversation(null);
        setMessages([]);
        navigate(`/personas/${personaId}/chat`);
      }
      toast.success('Conversation deleted');
    } catch (error) {
      toast.error('Failed to delete conversation');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] -m-4 sm:-m-6 lg:-m-8">
      {/* Sidebar - conversation list */}
      <div className="hidden md:flex w-72 border-r border-gray-200 bg-white flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <Link
            to={`/personas/${personaId}`}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to persona</span>
          </Link>
          <button
            onClick={startNewConversation}
            className="btn-primary w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Chat
          </button>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto p-2">
          {conversations.length === 0 ? (
            <p className="text-center text-gray-500 text-sm py-8">
              No conversations yet
            </p>
          ) : (
            <div className="space-y-1">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => loadConversation(conv.id)}
                  className={`w-full p-3 rounded-lg text-left transition-colors group ${
                    currentConversation?.id === conv.id
                      ? 'bg-primary-50 text-primary-700'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm font-medium truncate flex-1">
                      {conv.title || 'Untitled'}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(conv.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-all"
                    >
                      <Trash2 className="w-3 h-3 text-gray-500" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(conv.created_at).toLocaleDateString()}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {/* Chat header */}
        <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to={`/personas/${personaId}`}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center text-white font-bold">
              {persona?.name[0]}
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">{persona?.name}</h2>
              <p className="text-xs text-gray-500">{persona?.tagline}</p>
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <MoreVertical className="w-5 h-5 text-gray-500" />
            </button>
            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <button
                    onClick={() => {
                      startNewConversation();
                      setMenuOpen(false);
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Plus className="w-4 h-4" />
                    New conversation
                  </button>
                  <Link
                    to={`/personas/${personaId}`}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <User className="w-4 h-4" />
                    View persona
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center text-white font-bold text-2xl mb-4">
                {persona?.name[0]}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Chat with {persona?.name}
              </h3>
              <p className="text-gray-500 max-w-md">
                Start a conversation to understand how to communicate with this persona.
                Ask questions, discuss scenarios, or practice difficult conversations.
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start gap-3 animate-fade-in ${
                  message.role === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    message.role === 'user'
                      ? 'bg-primary-600'
                      : 'bg-gradient-to-br from-primary-400 to-secondary-500'
                  }`}
                >
                  {message.role === 'user' ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <span className="text-white text-sm font-bold">
                      {persona?.name[0]}
                    </span>
                  )}
                </div>

                {/* Message bubble */}
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-primary-600 text-white rounded-br-md'
                      : 'bg-white border border-gray-200 text-gray-900 rounded-bl-md'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))
          )}

          {/* Typing indicator */}
          {sending && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center">
                <span className="text-white text-sm font-bold">{persona?.name[0]}</span>
              </div>
              <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-bl-md">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce animate-delay-100" />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce animate-delay-200" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="bg-white border-t border-gray-200 p-4">
          <form onSubmit={sendMessage} className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={`Message ${persona?.name}...`}
              disabled={sending}
              className="input flex-1"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || sending}
              className="btn-primary p-3"
            >
              {sending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
