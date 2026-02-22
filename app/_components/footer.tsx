"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { Copy, Check, X, Shield, FileText } from "lucide-react"

// モーダルコンポーネント
const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-lg rounded-2xl shadow-xl max-h-[80vh] flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h3 className="font-bold text-lg text-slate-800">{title}</h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar text-sm text-slate-600 leading-relaxed space-y-4">
          {children}
        </div>
        <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
          <button 
            onClick={onClose}
            className="w-full py-2.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

export function Footer() {
  const [copied, setCopied] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false)
  const [showTerms, setShowTerms] = useState(false)

  const shareUrl = typeof window !== 'undefined' ? window.location.href : 'https://writter-project.com/talklens'
  const shareText = 'ペアトーク診断 Ι LINEトークをダウンロード不要で診断しよう！12タイプの関係性がわかります！ ダウンロード不要でいますぐできる！LINEトーク履歴を分析して、二人の関係性をカンタン診断！'

  const handleShareTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
    window.open(url, '_blank', 'width=550,height=420')
  }

  const handleShareLine = () => {
    const url = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}`
    window.open(url, '_blank', 'width=550,height=420')
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <>
      <footer className="py-12 mt-12 border-t border-slate-100" style={{ backgroundColor: '#FFF0F5' }}>
        <div className="max-w-6xl mx-auto px-4">
          {/* Links */}
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 mb-16 text-sm font-medium text-slate-600">
            <button onClick={() => setShowTerms(true)} className="hover:text-slate-900 transition-colors">利用規約</button>
            <span className="text-slate-300">|</span>
            <button onClick={() => setShowPrivacy(true)} className="hover:text-slate-900 transition-colors">プライバシーポリシー</button>
            <span className="text-slate-300">|</span>
            <a href="https://goldenbeam.co.jp/contact/" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 transition-colors">法人お問い合わせ</a>
            <span className="text-slate-300">|</span>
            <a href="https://goldenbeam.co.jp/" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 transition-colors">運営会社</a>
            <span className="text-slate-300">|</span>
            <a href="https://x.com/writter_world" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 transition-colors">最新情報はこちら</a>
          </div>

          {/* SNS Share Section */}
          <div className="text-center mb-10">
            <p className="text-lg font-bold text-slate-800 mb-6">このサイトを友達にシェアする</p>
            <div className="flex items-center justify-center gap-4 mb-4">
              {/* Twitter/X */}
              <button
                onClick={handleShareTwitter}
                className="sns-share-btn sns-twitter w-12 h-12 flex items-center justify-center bg-black text-white rounded-full hover:bg-slate-800 transition-transform hover:scale-110 shadow-lg"
                aria-label="Xでシェア"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </button>

              {/* LINE */}
              <button
                onClick={handleShareLine}
                className="sns-share-btn sns-line w-12 h-12 flex items-center justify-center bg-[#06C755] text-white rounded-full hover:bg-[#05b04c] transition-transform hover:scale-110 shadow-lg"
                aria-label="LINEでシェア"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.105.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                </svg>
              </button>

              {/* Copy Link */}
              <button
                onClick={handleCopyLink}
                className="sns-share-btn sns-copy w-12 h-12 flex items-center justify-center bg-white text-slate-600 border border-slate-200 rounded-full hover:bg-slate-50 transition-transform hover:scale-110 shadow-md"
                aria-label="リンクをコピー"
              >
                {copied ? (
                  <Check className="w-5 h-5 text-emerald-500" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
            </div>
            {copied && (
              <span className="text-xs text-emerald-600 font-bold animate-fade-in-up">
                リンクをコピーしました！
              </span>
            )}
          </div>

          {/* Copyright */}
          <div className="text-center mt-8 pt-6 border-t border-slate-200">
            <p className="text-xs text-muted-foreground">Copyright © 2026 GOLDENBEAM Inc. All Rights Reserved.</p>
          </div>
        </div>
      </footer>

      {/* 利用規約モーダル */}
      <Modal 
        isOpen={showTerms} 
        onClose={() => setShowTerms(false)} 
        title="利用規約"
      >
        <div className="space-y-4">
          <p>
            本サービス「トーク相性診断」（以下、「本サービス」といいます。）は、株式会社GOLDENBEAM（以下、「当社」といいます。）が提供するサービスです。
          </p>
          
          <h4 className="font-bold text-slate-800 mt-4">第1条（データについて）</h4>
          <p>
            本サービスでは、ユーザーがアップロードしたトーク履歴のテキストデータ（以下、「トークデータ」といいます。）を使用しますが、これらのトークデータはユーザーのブラウザ上でのみ処理され、当社のサーバーに送信・保存されることは一切ありません。
          </p>
          <p>
            したがって、当社や第三者がユーザーのトーク内容を閲覧することは技術的に不可能です。
          </p>

          <h4 className="font-bold text-slate-800 mt-4">第2条（サービスの品質改善）</h4>
          <p>
            本サービスの品質改善および利用状況の把握のため、以下の情報のみをGoogle Analytics等の解析ツールを用いて収集する場合があります。これらの情報に個人を特定する情報は含まれません。
          </p>
          <ul className="list-disc pl-5 space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-100">
            <li>本サービスの利用回数（分析ボタンの押下回数など）</li>
            <li>サイトへのアクセス人数（UU数）</li>
            <li>利用環境（OS、ブラウザの種類など）</li>
          </ul>

          <h4 className="font-bold text-slate-800 mt-4">第3条（免責事項）</h4>
          <p>
            本サービスの利用によりユーザーに生じた損害について、当社は一切の責任を負いません。また、分析結果の正確性や完全性を保証するものではありません。
          </p>
        </div>
      </Modal>

      {/* プライバシーポリシーモーダル */}
      <Modal 
        isOpen={showPrivacy} 
        onClose={() => setShowPrivacy(false)} 
        title="プライバシーポリシー"
      >
        <div className="space-y-4">
          <p>
            株式会社GOLDENBEAM（以下、「当社」といいます。）は、本サービスの利用者のプライバシーを尊重し、以下の通りプライバシーポリシーを定めます。
          </p>

          <h4 className="font-bold text-slate-800 mt-4">1. 収集する情報</h4>
          <p>
            本サービスでは、Google AnalyticsおよびVercel Analyticsを使用して、サイトの利用状況（アクセス数、ページビュー、分析実行回数など）を収集します。これらの情報には、氏名、住所、メールアドレス、電話番号などの個人を特定できる情報は一切含まれません。
          </p>

          <h4 className="font-bold text-slate-800 mt-4">2. トークデータの取り扱い</h4>
          <div className="bg-cyan-50 border border-cyan-100 p-4 rounded-xl">
            <p className="font-bold text-cyan-800 mb-2">【重要】トークデータは収集しません</p>
            <p className="text-cyan-700 text-xs leading-relaxed">
              ユーザーがアップロードするLINEのトーク履歴データは、すべてユーザーの端末（ブラウザ）内でのみ処理されます。<br/>
              インターネットを通じて当社のサーバーや外部のサーバーに送信されることは一切ありません。<br/>
              したがって、当社を含め、第三者がお客様のトーク内容を見ることは絶対にありませんので、安心してご利用ください。
            </p>
          </div>

          <h4 className="font-bold text-slate-800 mt-4">3. 情報の利用目的</h4>
          <p>
            収集したアクセス解析データは、本サービスの機能改善、新機能の開発、およびサービスの品質向上のためにのみ利用します。
          </p>

          <h4 className="font-bold text-slate-800 mt-4">4. お問い合わせ</h4>
          <p>
            本ポリシーに関するお問い合わせは、運営会社（株式会社GOLDENBEAM）までお願いいたします。
          </p>
        </div>
      </Modal>
    </>
  )
}
