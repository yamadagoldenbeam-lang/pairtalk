"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Crown, Send, Plus, MessageCircle, History, Settings, LogOut, 
  Upload, FileText, Sparkles, User, Bot, ChevronDown, Menu, X,
  Trash2, Download, Clock, BarChart3
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AnalysisSession {
  id: string;
  title: string;
  date: Date;
  messageCount: number;
}

export default function PremiumDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ email: string; isDemo: boolean } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [sessions, setSessions] = useState<AnalysisSession[]>([
    { id: "1", title: "彼女とのトーク分析", date: new Date(2026, 0, 25), messageCount: 1234 },
    { id: "2", title: "親友との会話分析", date: new Date(2026, 0, 20), messageCount: 567 },
    { id: "3", title: "サークルグループ分析", date: new Date(2026, 0, 15), messageCount: 2341 },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("premium_user");
    if (!storedUser) {
      router.push("/premium");
      return;
    }
    setUser(JSON.parse(storedUser));
  }, [router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleLogout = () => {
    localStorage.removeItem("premium_user");
    router.push("/premium");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      // ファイルアップロード時のメッセージ
      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: `📎 ファイルをアップロードしました: ${file.name}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMessage]);
      
      // AI応答
      setTimeout(() => {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `ファイル「${file.name}」を受け取りました！✨\n\nこのトーク履歴を分析しますか？以下のことをお伝えできます：\n\n• 二人の関係性タイプ診断\n• コミュニケーションパターンの分析\n• 感情の流れと変化\n• 具体的なアドバイス\n\n「分析して」と入力するか、特定の質問をしてください。`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      }, 1000);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() && !uploadedFile) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsAnalyzing(true);

    // シミュレーション：AI応答
    setTimeout(() => {
      let responseContent = "";
      
      if (inputValue.toLowerCase().includes("分析") && uploadedFile) {
        responseContent = `## 🔮 AI深層分析結果\n\n### 関係性タイプ: **エモ共有タイプ**\n\n二人は感情をオープンに共有し合う、親密で熱量の高い関係性です。\n\n---\n\n### 📊 詳細分析\n\n**コミュニケーションバランス**\n- あなた: 45%\n- お相手: 55%\n\n**返信スピード**\n- 平均返信時間: 8分\n- これは「とても親密」なレベルです\n\n**感情表現の傾向**\n- ポジティブ表現: 78%\n- 笑い表現の使用率: 12%\n\n---\n\n### 💡 AIからのアドバイス\n\nとても良好な関係性です！ただ、以下の点を意識するとさらに良くなるかもしれません：\n\n1. **質問を増やす**: 相手への質問が少し少なめです。もう少し相手のことを聞いてみましょう。\n\n2. **感謝の言葉**: 「ありがとう」の頻度を増やすと、さらに温かい関係に。\n\n---\n\n他に気になることがあれば、何でも聞いてください！`;
      } else if (inputValue.toLowerCase().includes("アドバイス")) {
        responseContent = `### 💝 関係性を深めるためのアドバイス\n\n分析結果をもとに、いくつかのアドバイスをご紹介します：\n\n1. **共通の話題を見つける**\n   トーク履歴から、二人とも音楽の話題で盛り上がる傾向がありますね。\n\n2. **質問のバランス**\n   相手からの質問が多い傾向があります。あなたからも積極的に質問してみましょう。\n\n3. **返信のタイミング**\n   深夜の返信が多いですが、お互いの生活リズムを尊重することも大切です。\n\n何か具体的に聞きたいことはありますか？`;
      } else {
        responseContent = `ご質問ありがとうございます！\n\nトーク履歴をアップロードしていただければ、詳細な分析を行うことができます。\n\n📤 左下の「+」ボタンからファイルをアップロードしてください。\n\n対応ファイル形式:\n- LINEトーク履歴（.txt）`;
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: responseContent,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsAnalyzing(false);
    }, 2000);
  };

  const handleNewChat = () => {
    setMessages([]);
    setUploadedFile(null);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f0f8ff' }}>
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#f0f8ff' }}>
      {/* サイドバー - デスクトップ */}
      <aside className={`hidden md:flex flex-col bg-white border-r border-cyan-100 transition-all duration-300 ${sidebarOpen ? "w-72" : "w-20"}`}>
        {/* ヘッダー */}
        <div className="p-4 border-b border-cyan-100">
          <Link href="/premium" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-sky-500 flex items-center justify-center shadow-lg flex-shrink-0">
              <Crown className="w-6 h-6 text-white" />
            </div>
            {sidebarOpen && (
              <div>
                <span className="text-slate-800 font-bold">PairTalk</span>
                <span className="text-cyan-500 font-bold ml-1">Premium</span>
              </div>
            )}
          </Link>
        </div>

        {/* 新規チャットボタン */}
        <div className="p-4">
          <button
            onClick={handleNewChat}
            className={`w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-cyan-400 to-sky-500 hover:from-cyan-500 hover:to-sky-600 rounded-xl text-white font-bold shadow-lg shadow-cyan-500/20 transition-all ${!sidebarOpen && "justify-center"}`}
          >
            <Plus className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>新しい分析</span>}
          </button>
        </div>

        {/* セッション履歴 */}
        {sidebarOpen && (
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <p className="text-slate-400 text-xs font-medium mb-2 px-2">分析履歴</p>
            <div className="space-y-1">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-cyan-50 rounded-lg text-left group transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-cyan-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 truncate">{session.title}</p>
                    <p className="text-xs text-slate-400">{session.date.toLocaleDateString("ja-JP")}</p>
                  </div>
                  <Trash2 className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ユーザー情報 */}
        <div className="p-4 border-t border-cyan-100">
          <div className={`flex items-center gap-3 ${!sidebarOpen && "justify-center"}`}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-sky-500 flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-white" />
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-700 truncate">{user.email}</p>
                {user.isDemo && (
                  <span className="text-xs text-cyan-500">デモアカウント</span>
                )}
              </div>
            )}
            {sidebarOpen && (
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                title="ログアウト"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* モバイルサイドバー */}
      {mobileSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/30" onClick={() => setMobileSidebarOpen(false)}>
          <aside className="w-72 h-full bg-white border-r border-cyan-100" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-cyan-100 flex items-center justify-between">
              <Link href="/premium" className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-sky-500 flex items-center justify-center">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <div>
                  <span className="text-slate-800 font-bold">PairTalk</span>
                  <span className="text-cyan-500 font-bold ml-1">Premium</span>
                </div>
              </Link>
              <button onClick={() => setMobileSidebarOpen(false)} className="p-2 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <button
                onClick={() => { handleNewChat(); setMobileSidebarOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-cyan-400 to-sky-500 rounded-xl text-white font-bold shadow-lg"
              >
                <Plus className="w-5 h-5" />
                <span>新しい分析</span>
              </button>
            </div>
            <div className="px-4 pb-4">
              <p className="text-slate-400 text-xs font-medium mb-2 px-2">分析履歴</p>
              {sessions.map((session) => (
                <button
                  key={session.id}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-cyan-50 rounded-lg text-left"
                  onClick={() => setMobileSidebarOpen(false)}
                >
                  <MessageCircle className="w-4 h-4 text-cyan-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 truncate">{session.title}</p>
                    <p className="text-xs text-slate-400">{session.date.toLocaleDateString("ja-JP")}</p>
                  </div>
                </button>
              ))}
            </div>
          </aside>
        </div>
      )}

      {/* メインコンテンツ */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* モバイルヘッダー */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-cyan-100 bg-white">
          <button onClick={() => setMobileSidebarOpen(true)} className="p-2 text-slate-500">
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-cyan-500" />
            <span className="text-slate-800 font-bold">Premium</span>
          </div>
          <div className="w-10" />
        </header>

        {/* チャットエリア */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            // ウェルカム画面
            <div className="h-full flex flex-col items-center justify-center px-4 py-12">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-400 to-sky-500 flex items-center justify-center mb-6 shadow-lg shadow-cyan-500/20">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-800 mb-3 text-center">
                PairTalk Premium AI
              </h1>
              <p className="text-slate-500 text-center max-w-md mb-8">
                トーク履歴をアップロードして、AIによる深層分析を始めましょう
              </p>
              
              <div className="grid md:grid-cols-3 gap-4 max-w-2xl w-full">
                {[
                  { icon: BarChart3, title: "詳細分析", desc: "関係性を数値で可視化" },
                  { icon: Sparkles, title: "AIアドバイス", desc: "改善ポイントを提案" },
                  { icon: History, title: "履歴保存", desc: "いつでも振り返り可能" },
                ].map((item, i) => (
                  <div key={i} className="p-4 bg-white border border-cyan-100 rounded-2xl text-center shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center mx-auto mb-3">
                      <item.icon className="w-5 h-5 text-cyan-500" />
                    </div>
                    <h3 className="text-slate-800 font-bold mb-1">{item.title}</h3>
                    <p className="text-slate-400 text-sm">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // メッセージ一覧
            <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-4 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    message.role === "user" 
                      ? "bg-slate-200" 
                      : "bg-gradient-to-br from-cyan-400 to-sky-500"
                  }`}>
                    {message.role === "user" ? (
                      <User className="w-5 h-5 text-slate-600" />
                    ) : (
                      <Bot className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div className={`flex-1 ${message.role === "user" ? "text-right" : ""}`}>
                    <div className={`inline-block px-4 py-3 rounded-2xl ${
                      message.role === "user"
                        ? "bg-gradient-to-r from-cyan-400 to-sky-500 text-white"
                        : "bg-white border border-cyan-100 text-slate-700 shadow-sm"
                    }`}>
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {message.content}
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 px-2">
                      {message.timestamp.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
              
              {isAnalyzing && (
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-sky-500 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="bg-white border border-cyan-100 px-4 py-3 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                      <span className="text-slate-400 text-sm">分析中...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* 入力エリア */}
        <div className="border-t border-cyan-100 p-4 bg-white/80 backdrop-blur-sm">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-3">
              {/* ファイルアップロード */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-3 bg-white hover:bg-cyan-50 border border-cyan-200 rounded-xl text-slate-500 hover:text-cyan-600 transition-colors shadow-sm"
                title="ファイルをアップロード"
              >
                <Plus className="w-5 h-5" />
              </button>

              {/* テキスト入力 */}
              <div className="flex-1 relative">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="メッセージを入力..."
                  rows={1}
                  className="w-full px-4 py-3 bg-white border border-cyan-200 rounded-xl text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 resize-none shadow-sm"
                  style={{ minHeight: "48px", maxHeight: "200px" }}
                />
              </div>

              {/* 送信ボタン */}
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isAnalyzing}
                className="p-3 bg-gradient-to-r from-cyan-400 to-sky-500 rounded-xl text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            
            {uploadedFile && (
              <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                <FileText className="w-4 h-4" />
                <span>{uploadedFile.name}</span>
                <button
                  onClick={() => setUploadedFile(null)}
                  className="text-slate-400 hover:text-red-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
