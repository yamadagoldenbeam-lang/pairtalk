"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Trophy, Sparkles, Check, Loader2, Gift, ExternalLink } from "lucide-react";

interface WritterLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WritterLoginModal({ isOpen, onClose }: WritterLoginModalProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      // リセット
      setUsername("");
      setPassword("");
      setError("");
      setIsSuccess(false);
      setUserData(null);
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // OAuth API呼び出し
      const body = new URLSearchParams({
        grant_type: "password",
        client_id: "a0e8fd93-1ea6-42f1-81f9-1d784de0fc9e",
        client_secret: "NDt3CByzzwy8S3wIpVgZ97iGzcbfjWnY98d7VgRz",
        username: username,
        password: password,
        badge_id: "2",
        scope: "*",
      });

      const response = await fetch(
        "https://identity.goldenbeam.key-link.jp/api/v1/oauth/grant-on-login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: body.toString(),
        }
      );

      const data = await response.json();

      if (response.ok && (data.access_token || data.token_type || (!data.error && !data.message))) {
        setUserData(data);
        setIsSuccess(true);
      } else {
        setError(data.message || data.error_description || data.error || "ログインに失敗しました。ユーザー名またはパスワードを確認してください。");
      }
    } catch (err) {
      setError("通信エラーが発生しました。しばらくしてからお試しください。");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {!isSuccess ? (
          // ログインフォーム
          <>
            {/* ヘッダー */}
            <div className="relative bg-gradient-to-br from-[#9333EA] via-[#A855F7] to-[#C084FC] p-6 text-center">
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
              
              <div className="w-20 h-20 mx-auto mb-4 bg-white rounded-full flex items-center justify-center shadow-lg">
                <Trophy className="w-10 h-10 text-purple-600" />
              </div>
              <h2 className="text-2xl font-black text-white mb-2">限定バッジをゲット！</h2>
              <p className="text-white/90 text-sm">
                Writterアカウントでログインして<br />
                アプリで使える限定バッジを入手しよう
              </p>
            </div>

            {/* フォーム */}
            <form onSubmit={handleLogin} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  ユーザー名
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Writterのユーザー名"
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  パスワード
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>ログイン中...</span>
                  </>
                ) : (
                  <>
                    <Trophy className="w-5 h-5" />
                    <span>ログインしてバッジをゲット</span>
                  </>
                )}
              </button>

            </form>
          </>
        ) : (
          // 成功画面
          <div className="p-8 text-center">
            {/* 成功アニメーション */}
            <div className="relative w-32 h-32 mx-auto mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full animate-ping opacity-20" />
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <div className="bg-white rounded-full p-4">
                  <Check className="w-12 h-12 text-purple-600" />
                </div>
              </div>
              {/* パーティクル */}
              <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-yellow-400 animate-bounce" />
              <Gift className="absolute -bottom-2 -left-2 w-8 h-8 text-pink-400 animate-bounce" style={{ animationDelay: "0.2s" }} />
            </div>

            <h2 className="text-2xl font-black text-slate-800 mb-2">
              🎉 バッジ獲得！
            </h2>
            <p className="text-slate-600 mb-6">
              「ペアトーク相性診断」バッジが<br />
              Writterアプリでアンロックされました！
            </p>

            {/* バッジプレビュー */}
            <div className="inline-flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-2xl mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                <Trophy className="w-7 h-7 text-white" />
              </div>
              <div className="text-left">
                <p className="text-sm text-purple-600 font-medium">限定バッジ</p>
                <p className="text-lg font-black text-slate-800">ペアトーク相性診断</p>
              </div>
            </div>

            <p className="text-slate-500 text-sm mb-6">
              Writterアプリを開いてバッジを確認してね！
            </p>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
              >
                閉じる
              </button>
              <a
                href="https://writter.app"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
              >
                アプリを開く
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
