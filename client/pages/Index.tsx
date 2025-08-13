import { useState, useRef, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { Send, Bot, User, ExternalLink } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  links?: Array<{
    title: string;
    url: string;
    description: string;
  }>;
  timestamp: Date;
}

const mockSearchResults = {
  'kemiskinan': [
    {
      title: 'Data Kemiskinan Kota Medan 2023',
      url: 'https://medankota.bps.go.id/statistics-table/subject-563',
      description: 'Statistik kemiskinan di Kota Medan tahun 2023'
    },
    {
      title: 'Profil Kemiskinan Sumatera Utara',
      url: 'https://medankota.bps.go.id/statistics/poverty-profile',
      description: 'Profil kemiskinan Provinsi Sumatera Utara'
    }
  ],
  'penduduk': [
    {
      title: 'Data Kependudukan Kota Medan 2023',
      url: 'https://medankota.bps.go.id/statistics-table/subject-12',
      description: 'Statistik kependudukan dan demografi Kota Medan'
    },
    {
      title: 'Proyeksi Penduduk Kota Medan',
      url: 'https://medankota.bps.go.id/statistics/population-projection',
      description: 'Proyeksi jumlah penduduk Kota Medan 2020-2035'
    }
  ],
  'ekonomi': [
    {
      title: 'PDRB Kota Medan 2023',
      url: 'https://medankota.bps.go.id/statistics-table/subject-52',
      description: 'Produk Domestik Regional Bruto Kota Medan'
    },
    {
      title: 'Inflasi Kota Medan',
      url: 'https://medankota.bps.go.id/statistics/inflation',
      description: 'Data inflasi dan indeks harga konsumen Kota Medan'
    }
  ]
};

export default function Index() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: 'Halo! Saya AIDA (AI Data Assistant) dari BPS Kota Medan. Saya dapat membantu Anda mencari informasi dan data statistik yang tersedia di website BPS Kota Medan. Silakan ketik kata kunci yang Anda cari!',
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate bot response delay
    setTimeout(() => {
      const searchKey = inputValue.toLowerCase();
      let botResponse: Message;

      // Check if the input matches any of our mock data
      const matchedKey = Object.keys(mockSearchResults).find(key => 
        searchKey.includes(key) || key.includes(searchKey)
      );

      if (matchedKey) {
        const results = mockSearchResults[matchedKey as keyof typeof mockSearchResults];
        botResponse = {
          id: (Date.now() + 1).toString(),
          type: 'bot',
          content: `Berikut informasi mengenai ${matchedKey} di Kota Medan:`,
          links: results,
          timestamp: new Date(),
        };
      } else {
        botResponse = {
          id: (Date.now() + 1).toString(),
          type: 'bot',
          content: `Maaf, saya tidak menemukan data spesifik untuk "${inputValue}". Silakan coba kata kunci lain seperti "kemiskinan", "penduduk", atau "ekonomi". Anda juga dapat mengunjungi halaman utama BPS Kota Medan untuk informasi lebih lengkap.`,
          links: [
            {
              title: 'BPS Kota Medan - Halaman Utama',
              url: 'https://medankota.bps.go.id/',
              description: 'Situs resmi Badan Pusat Statistik Kota Medan'
            }
          ],
          timestamp: new Date(),
        };
      }

      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-bps-50 to-bps-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-bps-600 rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">AIDA</h1>
              <p className="text-xs sm:text-sm text-bps-600">AI Data Assistant - BPS Kota Medan</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <Card className="h-[calc(100vh-120px)] sm:h-[600px] flex flex-col bg-white shadow-lg">
          {/* Chat Header */}
          <div className="p-3 sm:p-4 border-b bg-bps-50">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-bps-600 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-semibold text-gray-900">AIDA Assistant</h2>
                <p className="text-xs sm:text-sm text-bps-600">Siap membantu pencarian data BPS Kota Medan</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  message.type === 'user' 
                    ? 'bg-gray-600' 
                    : 'bg-blue-600'
                }`}>
                  {message.type === 'user' ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <Bot className="w-4 h-4 text-white" />
                  )}
                </div>
                <div className={`max-w-[80%] ${message.type === 'user' ? 'text-right' : 'text-left'}`}>
                  <div className={`p-3 rounded-lg ${
                    message.type === 'user'
                      ? 'bg-gray-600 text-white'
                      : 'bg-blue-50 text-gray-900'
                  }`}>
                    <p className="text-sm">{message.content}</p>
                    {message.links && (
                      <div className="mt-3 space-y-2">
                        {message.links.map((link, index) => (
                          <div key={index} className="p-2 bg-white rounded border">
                            <a 
                              href={link.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 hover:text-blue-600 transition-colors"
                            >
                              <ExternalLink className="w-4 h-4" />
                              <div>
                                <p className="font-medium text-sm">{link.title}</p>
                                <p className="text-xs text-gray-600">{link.description}</p>
                              </div>
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {message.timestamp.toLocaleTimeString('id-ID', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ketik kata kunci pencarian data (contoh: kemiskinan, penduduk, ekonomi)..."
                className="flex-1"
                disabled={isTyping}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isTyping}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Info Section */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>AIDA dapat membantu mencari data statistik dari website BPS Kota Medan</p>
          <p className="mt-1">Gunakan kata kunci seperti "kemiskinan", "penduduk", "ekonomi", atau topik statistik lainnya</p>
        </div>
      </div>
    </div>
  );
}
