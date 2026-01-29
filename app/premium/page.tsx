"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, Sparkles, Crown, Shield, Zap, ArrowRight, Check } from "lucide-react";

// デモ用認証情報
const DEMO_CREDENTIALS = {
  email: "demo@pairtalk.site",
  password: "demo1234"
};

export default function PremiumLoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // 新規登録の場合
    if (!isLogin) {
      if (password !== confirmPassword) {
        setError("パスワードが一致しません");
        setIsLoading(false);
        return;
      }
      // デモ用：登録後すぐにダッシュボードへ
      setTimeout(() => {
        localStorage.setItem("premium_user", JSON.stringify({ email, isDemo: false }));
        router.push("/premium/dashboard");
      }, 1500);
      return;
    }

    // ログインの場合
    if (email === DEMO_CREDENTIALS.email && password === DEMO_CREDENTIALS.password) {
      setTimeout(() => {
        localStorage.setItem("premium_user", JSON.stringify({ email, isDemo: true }));
        router.push("/premium/dashboard");
      }, 1500);
    } else {
      setTimeout(() => {
        setError("メールアドレスまたはパスワードが正しくありません");
        setIsLoading(false);
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: '#f0f8ff' }}>
      {/* 背景装飾 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-300/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-sky-300/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-cyan-200/10 to-transparent rounded-full" />
      </div>

      {/* ヘッダー */}
      <header className="relative z-10 py-6 px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-sky-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-slate-800 font-bold text-lg">PairTalk</span>
              <span className="text-cyan-500 font-bold text-lg ml-1">Premium</span>
            </div>
          </Link>
          <Link 
            href="/"
            className="text-slate-500 hover:text-slate-800 transition-colors text-sm"
          >
            無料版を使う →
          </Link>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* 左側：機能紹介 */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-100 border border-cyan-200">
                <Sparkles className="w-4 h-4 text-cyan-600" />
                <span className="text-cyan-700 text-sm font-medium">AI-Powered Analysis</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-slate-800 leading-tight">
                より深い分析を、<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-sky-500">
                  AIの力で。
                </span>
              </h1>
              <p className="text-slate-600 text-lg leading-relaxed">
                PairTalk Premiumは、最新のAI技術を活用して<br />
                二人の関係性をより深く、より詳細に分析します。
              </p>
            </div>

            {/* 機能リスト */}
            <div className="space-y-4">
              {[
                { icon: Zap, title: "AIによる深層分析", desc: "会話パターンから関係性の傾向を詳細に分析" },
                { icon: Shield, title: "セキュアなデータ保存", desc: "暗号化された安全なクラウドストレージ" },
                { icon: Crown, title: "無制限の分析履歴", desc: "過去の分析結果をいつでも確認可能" },
              ].map((feature, i) => (
                <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-white/80 border border-cyan-100 hover:border-cyan-300 transition-colors shadow-sm">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-100 to-sky-100 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-6 h-6 text-cyan-600" />
                  </div>
                  <div>
                    <h3 className="text-slate-800 font-bold mb-1">{feature.title}</h3>
                    <p className="text-slate-500 text-sm">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* デモ情報 */}
            <div className="p-4 rounded-2xl bg-cyan-50 border border-cyan-200">
              <p className="text-cyan-700 text-sm font-medium mb-2">🎁 デモアカウントで試す</p>
              <div className="text-slate-600 text-sm space-y-1">
                <p>Email: <code className="bg-white px-2 py-0.5 rounded border border-cyan-200">demo@pairtalk.site</code></p>
                <p>Password: <code className="bg-white px-2 py-0.5 rounded border border-cyan-200">demo1234</code></p>
              </div>
            </div>
          </div>

          {/* 右側：ログイン/登録フォーム */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-200/30 to-sky-200/30 rounded-3xl blur-xl" />
            <div className="relative bg-white/90 backdrop-blur-xl border border-cyan-100 rounded-3xl p-8 shadow-xl shadow-cyan-500/10">
              
              {/* タブ切り替え */}
              <div className="flex mb-8 p-1 bg-slate-100 rounded-xl">
                <button
                  onClick={() => { setIsLogin(true); setError(""); }}
                  className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${
                    isLogin 
                      ? "bg-gradient-to-r from-cyan-400 to-sky-500 text-white shadow-lg" 
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  ログイン
                </button>
                <button
                  onClick={() => { setIsLogin(false); setError(""); }}
                  className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${
                    !isLogin 
                      ? "bg-gradient-to-r from-cyan-400 to-sky-500 text-white shadow-lg" 
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  新規登録
                </button>
              </div>

              {/* フォーム */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* メールアドレス */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">メールアドレス</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all"
                    />
                  </div>
                </div>

                {/* パスワード */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">パスワード</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* パスワード確認（新規登録時のみ） */}
                {!isLogin && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">パスワード確認</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all"
                      />
                    </div>
                  </div>
                )}

                {/* エラーメッセージ */}
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                {/* 送信ボタン */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-gradient-to-r from-cyan-400 to-sky-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{isLogin ? "ログイン中..." : "登録中..."}</span>
                    </>
                  ) : (
                    <>
                      <span>{isLogin ? "ログイン" : "アカウント作成"}</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>

              {/* 追加リンク */}
              {isLogin && (
                <p className="text-center text-slate-500 text-sm mt-6">
                  パスワードをお忘れですか？{" "}
                  <button className="text-cyan-600 hover:underline">リセット</button>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 価格セクション */}
        <section className="mt-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-slate-800 mb-4">シンプルな料金プラン</h2>
            <p className="text-slate-500">すべての機能を、ひとつの価格で。</p>
          </div>

          <div className="max-w-lg mx-auto">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-200/40 to-sky-200/40 rounded-3xl blur-xl" />
              <div className="relative bg-white/90 backdrop-blur-xl border border-cyan-200 rounded-3xl p-8 shadow-xl shadow-cyan-500/10">
                <div className="text-center mb-8">
                  <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-100 text-cyan-700 text-sm font-medium mb-4">
                    <Crown className="w-4 h-4" />
                    Premium Plan
                  </span>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-black text-slate-800">¥980</span>
                    <span className="text-slate-500">/月</span>
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  {[
                    "AI深層分析（GPT-4o）",
                    "無制限の分析保存",
                    "詳細なアドバイスレポート",
                    "関係性トレンド追跡",
                    "優先サポート",
                    "広告なし",
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-slate-700">
                      <div className="w-5 h-5 rounded-full bg-cyan-100 flex items-center justify-center">
                        <Check className="w-3 h-3 text-cyan-600" />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => setIsLogin(false)}
                  className="w-full py-4 bg-gradient-to-r from-cyan-400 to-sky-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all"
                >
                  今すぐ始める
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* フッター */}
      <footer className="relative z-10 py-8 mt-16 border-t border-cyan-100">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-500 text-sm">
            © 2026 PairTalk Premium by GOLDENBEAM Inc.
          </p>
        </div>
      </footer>
    </div>
  );
}
