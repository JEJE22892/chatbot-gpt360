import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, AlertCircle, MessageCircle } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Stats {
  promptsUsed: number;
  maxPrompts: number;
  remaining: number;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll vers le bas quand de nouveaux messages arrivent
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialisation de l'utilisateur
  useEffect(() => {
    const initializeUser = async () => {
      let storedUserId = sessionStorage.getItem('chatbot-user-id');
      
      if (!storedUserId) {
        try {
          const response = await fetch(`${API_BASE_URL}/user/new`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          
          if (!response.ok) throw new Error('Erreur lors de la création de l\'utilisateur');
          
          const data = await response.json();
          storedUserId = data.userId;
          sessionStorage.setItem('chatbot-user-id', storedUserId);
        } catch (err) {
          setError('Impossible de créer une nouvelle session');
          return;
        }
      }
      
      setUserId(storedUserId);
      
      // Charger l'historique et les stats
      await Promise.all([
        loadUserHistory(storedUserId),
        loadStats()
      ]);
      
      setIsInitialized(true);
    };

    initializeUser();
  }, []);

  const loadUserHistory = async (uid: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/user/${uid}/history`);
      if (!response.ok) throw new Error('Erreur lors du chargement de l\'historique');
      
      const data = await response.json();
      const formattedMessages = data.history.map((msg: any) => ({
        ...msg,
        timestamp: new Date()
      }));
      setMessages(formattedMessages);
    } catch (err) {
      console.error('Erreur chargement historique:', err);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/stats`);
      if (!response.ok) throw new Error('Erreur lors du chargement des statistiques');
      
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Erreur chargement stats:', err);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !userId || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          message: userMessage.content
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === 'WEEKLY_LIMIT_EXCEEDED') {
          setError(data.error);
          return;
        }
        throw new Error(data.error || 'Erreur lors de l\'envoi du message');
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Mettre à jour les stats
      if (stats) {
        setStats({
          ...stats,
          promptsUsed: stats.promptsUsed + 1,
          remaining: data.promptsRemaining
        });
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatMessage = (content: string) => {
    return content.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {line}
        {index < content.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <MessageCircle className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Initialisation du chatbot...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* Interface de Chat */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
        {/* Zone des messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <Bot className="h-16 w-16 text-blue-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-700 mb-2">
                Bienvenue dans le ChatBot IA
              </h2>
              <p className="text-gray-500">
                Posez-moi n'importe quelle question pour commencer la conversation
              </p>
              {stats && (
                <p className="text-sm text-gray-400 mt-2">
                  {stats.remaining} prompts restants cette semaine
                </p>
              )}
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex items-start space-x-3 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                </div>
              )}
              
              <div
                className={`max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl p-4 rounded-2xl ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white ml-auto'
                    : 'bg-white text-gray-800 shadow-md'
                }`}
              >
                <div className="text-sm leading-relaxed">
                  {formatMessage(message.content)}
                </div>
              </div>

              {message.role === 'user' && (
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <Bot className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-md">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Erreur */}
        {error && (
          <div className="mx-4 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Zone de saisie */}
        <div className="p-4 bg-white border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Tapez votre message..."
                disabled={isLoading || !!error}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading || !!error}
              className="flex-shrink-0 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white p-3 rounded-full transition-colors duration-200"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
          
          {stats && (
            <div className="mt-2 text-xs text-gray-500 text-center">
              {stats.remaining} prompts restants cette semaine ({stats.promptsUsed}/{stats.maxPrompts})
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;