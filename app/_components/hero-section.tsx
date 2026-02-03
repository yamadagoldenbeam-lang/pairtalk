"use client"

import type React from "react"

import { useRef, useState, useEffect } from "react"
import { Upload, FileText, Sparkles } from "lucide-react"
import { MascotIcon } from "./mascot-icon"

interface HeroSectionProps {
  onFileSelect?: (file: File) => void
  isAnalyzing?: boolean
}

export function HeroSection({ onFileSelect, isAnalyzing }: HeroSectionProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      setFile(droppedFile)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
    }
  }

  const handleStartAnalysis = () => {
    if (file && onFileSelect) {
      onFileSelect(file)
    }
  }

  return (
    <section className="flex flex-col items-center px-4 pt-12 pb-8 relative">
      {/* メインビジュアル - 大きく表示 */}
      <div className="w-64 h-64 md:w-80 md:h-80 mb-6 animate-float relative z-10">
        <img 
          src="/talklens/chirupi.png" 
          alt="トーク相性診断 メインビジュアル" 
          className="w-full h-full object-contain drop-shadow-2xl"
        />
        {/* 背景の装飾 */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-yellow-200/40 to-pink-200/40 rounded-full blur-3xl -z-10 animate-pulse-slow" />
      </div>

      <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 mb-6 animate-fade-in-up text-center leading-tight tracking-tight">
        ペアトーク履歴診断 for LINE
      </h1>
      <p
        className="text-slate-600 text-lg md:text-xl font-medium mb-12 text-center text-balance animate-fade-in-up"
        style={{ animationDelay: "0.1s" }}
      >
        LINEトーク履歴を分析して、二人の関係性をカンタン診断！
      </p>

      {/* 安心メッセージ - 刷新されたデザイン */}
      <div className="w-full max-w-3xl mx-auto mb-2 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
        <div className="bg-white/80 backdrop-blur-sm border border-cyan-100 rounded-2xl p-6 text-center shadow-sm relative overflow-hidden">
              <p className="text-slate-800 font-bold leading-relaxed text-base">
            AI読み込みなし、サーバー保存なし！<br />
            運営も見れない仕組みだから<br />
            <span className="text-cyan-600 border-b-2 border-cyan-200">安心して分析</span>できるよ！
          </p>
        </div>
      </div>

      {/* 矢印 */}
      <div className="flex justify-center mb-6 animate-bounce" style={{ animationDelay: "0.4s" }}>
        <img 
          src="/talklens/arrow.png" 
          alt="矢印" 
          className="w-20 h-30 object-contain"
        />
      </div>

      <div className="w-full max-w-6xl mx-auto px-4">
        <div
          className="w-full bg-card rounded-3xl border border-border shadow-lg overflow-hidden animate-fade-in-up transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 relative z-10"
          style={{ animationDelay: "0.3s" }}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-border bg-slate-50/50">
            {/* ヘッダーテキスト削除 */}
          </div>

          {/* Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragOver(true)
            }}
            onDragLeave={() => setIsDragOver(false)}
            onClick={() => fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center h-64 px-4 py-8 cursor-pointer transition-all duration-300 ${
              isDragOver ? "bg-cyan-50/50 border-2 border-cyan-500 border-dashed" : "bg-transparent hover:bg-slate-50 border-2 border-transparent border-dashed hover:border-slate-200"
            }`}
          >
            <input ref={fileInputRef} type="file" accept=".txt,.tsx,text/plain" onChange={handleFileChange} className="hidden" />

            {file ? (
              <div className="flex flex-col items-center gap-4 text-foreground animate-in fade-in zoom-in duration-300">
                <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center">
                  <FileText className="w-8 h-8 text-cyan-600" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-lg mb-1">{file.name}</p>
                  <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Upload className="w-8 h-8 text-slate-400" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-lg font-bold text-slate-700">ドラッグ＆ドロップでファイルを選択</p>
                  <p className="text-sm text-slate-500">またはクリックしてアップロード</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex flex-col md:flex-row items-center justify-between px-6 py-4 border-t border-border bg-slate-50 gap-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              <FileText className="w-4 h-4" />
              ファイルを選択 (形式：.txt)
            </button>
            <button
              onClick={handleStartAnalysis}
              disabled={!file || isAnalyzing}
              className={`w-full md:w-auto px-10 py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
                file 
                  ? "bg-cyan-500 text-white hover:bg-cyan-600 shadow-cyan-500/30" 
                  : "bg-slate-200 text-slate-400 shadow-none"
              }`}
            >
              {isAnalyzing ? (
                <span className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 animate-spin" />
                  分析中...
                </span>
              ) : (
                "無料で分析する！"
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
