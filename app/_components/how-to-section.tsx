"use client"

const steps = [
  {
    number: 1,
    image: "/talklens/phone.png",
    title: "LINEアプリを開く",
    description: "LINEアプリでトーク履歴を保存したいトークを開きます",
  },
  {
    number: 2,
    image: "/talklens/save02.png",
    title: "トーク履歴を保存",
    description: "トーク画面右上の「三」メニュー→「設定」→「トーク履歴を送信」を選択します",
  },
  {
    number: 3,
    image: "/talklens/save.png",
    title: "トークファイルをアップ",
    description: "トーク履歴のテキストファイルをこのページにアップロードします。トーク内容はサーバーに保存されないので、安心してお使いいただけます！ページ更新をすると消えてしまうから、結果はスクショしてね！",
  },
]

export function HowToSection() {
  return (
    <section className="px-4 py-16 w-full max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold text-center mb-12" style={{ color: '#080D12' }}>遊び方</h2>

      {/* マルチカラムレイアウト */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {steps.map((step, index) => (
          <div 
            key={step.number} 
            className="bg-white rounded-2xl p-8 shadow-[0_2px_20px_rgba(0,0,0,0.06)] border border-slate-100 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y-1 animate-fade-in-up flex flex-col items-center"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {/* Step Number Badge */}
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-lg mb-4">
              {step.number}
            </div>

            {/* Image Icon */}
            <div className="mb-6">
              <div className="w-32 h-32 flex items-center justify-center">
                <img 
                  src={step.image} 
                  alt={step.title}
                  className="max-w-full max-h-full object-contain drop-shadow-md transform transition-transform hover:scale-110 duration-300"
                />
              </div>
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-center mb-4" style={{ color: '#080D12' }}>
              {step.title}
            </h3>

            {/* Description */}
            <p className="text-base text-center leading-relaxed text-balance" style={{ color: '#67757C' }}>
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
