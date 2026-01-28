"use client"

import { BarChart3, Heart, MessageCircle, Clock } from "lucide-react"
import { MascotThinking, MascotIdea } from "./mascot-icon"

const features = [
  {
    icon: <MascotThinking className="w-12 h-12" />,
    title: "会話パターンを分析",
    description: "会話の傾向や返信スピード、これまでのトレンドワードを見てみよう！",
    visual: (
      <div className="bg-card rounded-2xl p-4 mb-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-5 h-5 text-primary" />
          <span className="text-sm font-medium text-foreground">メッセージ比率</span>
        </div>
        <div className="flex gap-2">
          <div className="h-2 bg-primary rounded-full flex-[6]" />
          <div className="h-2 bg-primary/40 rounded-full flex-[4]" />
        </div>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>あなた 60%</span>
          <span>相手 40%</span>
        </div>
      </div>
    ),
  },
  {
    icon: <MascotIdea className="w-12 h-12" />,
    title: "関係性をスコア化",
    description: "会話の内容から親密度や関係性をAIがスコアリング。時間経過での変化もわかります",
    visual: (
      <div className="flex items-center justify-center gap-3 mb-4">
        <div className="text-4xl font-bold text-primary">85</div>
        <div className="text-left">
          <div className="flex items-center gap-1 text-primary">
            <Heart className="w-4 h-4 fill-current animate-pulse" />
            <span className="text-sm font-medium">親密度</span>
          </div>
          <span className="text-xs text-muted-foreground">とても良好</span>
        </div>
      </div>
    ),
  },
  {
    icon: <MessageCircle className="w-10 h-10 text-primary glow-effect" />,
    title: "よく使う言葉を抽出",
    description: "お互いがよく使うフレーズや絵文字をランキング形式で表示します",
    visual: (
      <div className="flex flex-wrap gap-2 justify-center mb-4">
        {["ありがとう", "了解", "笑", "おはよう", "おやすみ"].map((word, i) => (
          <span
            key={word}
            className="bg-primary/10 text-primary text-sm px-3 py-1 rounded-full transition-all duration-300 hover:bg-primary/20 hover:scale-105"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            {word}
          </span>
        ))}
      </div>
    ),
  },
  {
    icon: <Clock className="w-10 h-10 text-primary glow-effect" />,
    title: "時間帯分析",
    description: "何時頃によく会話しているか、曜日ごとの傾向も分かる！",
    visual: (
      <div className="flex items-end justify-center gap-1 h-12 mb-4">
        {[2, 3, 5, 8, 6, 4, 7, 9, 8, 5, 3, 2].map((h, i) => (
          <div
            key={i}
            className="w-2 bg-primary/60 rounded-t transition-all duration-500 hover:bg-primary"
            style={{
              height: `${h * 10}%`,
              animationDelay: `${i * 0.05}s`,
            }}
          />
        ))}
      </div>
    ),
  },
]

export function FeaturesSection() {
  return (
    <section className="px-4 py-12 w-full max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold text-center mb-8" style={{ color: '#080D12' }}>分析できること</h2>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Feature 1 - Large card */}
        <div className="bg-feature-bg rounded-3xl p-6 md:row-span-2 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1">
          {features[0].visual}
          <div className="flex justify-center mb-4">{features[0].icon}</div>
          <h3 className="text-lg font-bold text-foreground mb-2">{features[0].title}</h3>
          <p className="text-sm text-muted-foreground">{features[0].description}</p>
        </div>

        {/* Feature 4 (時間帯分析) - 右上 */}
        <div className="bg-feature-bg rounded-3xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1">
          {features[3].visual}
          <div className="flex justify-center mb-4">{features[3].icon}</div>
          <h3 className="text-lg font-bold text-foreground mb-2">{features[3].title}</h3>
          <p className="text-sm text-muted-foreground">{features[3].description}</p>
        </div>

        {/* Feature 3 (よく使う言葉) - 右下 */}
        <div className="bg-feature-bg rounded-3xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1">
          {features[2].visual}
          <div className="flex justify-center mb-4">{features[2].icon}</div>
          <h3 className="text-lg font-bold text-foreground mb-2">{features[2].title}</h3>
          <p className="text-sm text-muted-foreground">{features[2].description}</p>
        </div>
      </div>
    </section>
  )
}
