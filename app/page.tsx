"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
// Vercel Analytics削除
import { HeroSection } from "./_components/hero-section";
import { HowToSection } from "./_components/how-to-section";
import { FeaturesSection } from "./_components/features-section";
import { Footer } from "./_components/footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./_components/ui/card";
import { Button } from "./_components/ui/button";
import { Badge } from "./_components/ui/badge";
import { Progress } from "./_components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "./_components/ui/avatar";
import { ScrollArea, ScrollBar } from "./_components/ui/scroll-area";
import { Separator } from "./_components/ui/separator";
import { useToast } from "./_hooks/use-toast";
import { ArrowLeft, MessageCircle, Clock, Zap, Smile, BarChart3, TrendingUp, Trophy, Phone, Moon, Sun, Heart, Sparkles, Calendar, Loader2, Menu, X, ArrowRight, Share2, Link } from "lucide-react";
import { cn } from "./_lib/utils";
import { MascotIcon } from "./_components/mascot-icon";
import { WritterLoginModal } from "./_components/writter-login-modal";
import { NextActionDuel } from "./_components/NextActionDuel";

interface Message {
  date: Date;
  user: string;
  content: string;
  isSticker: boolean;
  isEmoji: boolean;
  isCall?: boolean; // 通話関連メッセージかどうか
  callDuration?: number; // 通話時間（秒単位、不在着信の場合は0）
}

interface AnalysisResult {
  wordRanking: {
    user1: { word: string; count: number }[];
    user2: { word: string; count: number }[];
    user1Name: string;
    user2Name: string;
  };
  replySpeed: { user1: number; user2: number; user1Name: string; user2Name: string };
  stickerRate: { user1: number; user2: number };
  emojiRate: { user1: number; user2: number };
  emojiRanking: {
    user1: { char: string; count: number }[];
    user2: { char: string; count: number }[];
  };
  timeDistribution: { hour: number; count: number }[];
  dayOfWeekDistribution: { day: string; count: number }[];
  messageRatio: { user1: number; user2: number; user1Name: string; user2Name: string };
  chaserRanking: { user1: number; user2: number; user1Name: string; user2Name: string };
  wordOfTheYear: { month: string; words: { word: string; increase: number }[] }[];
  laughterAnalysis: {
    user1: { total: number; rate: number; words: { word: string; count: number }[] };
    user2: { total: number; rate: number; words: { word: string; count: number }[] };
    user1Name: string;
    user2Name: string;
  };
  replyTimeDistribution: {
    user1: { range: string; count: number }[];
    user2: { range: string; count: number }[];
    user1Name: string;
    user2Name: string;
  };
  greetingAnalysis: {
    user1: { goodMorning: number; goodNight: number };
    user2: { goodMorning: number; goodNight: number };
    user1Name: string;
    user2Name: string;
  };
  longestMessage: {
    user1: { length: number; content: string; date: string };
    user2: { length: number; content: string; date: string };
    user1Name: string;
    user2Name: string;
  };
  callAnalysis: {
    totalCalls: number;
    totalDuration: number; // 秒単位
    averageDuration: number; // 秒単位
    user1Name: string;
    user2Name: string;
    user1Calls: number;
    user2Calls: number;
  };
  loveCallAnalysis: {
    user1: number;
    user2: number;
    user1Name: string;
    user2Name: string;
  };
  // 12型分類結果
  relationshipType: {
    resultType: string;
    description: string;
    detailedDescription: string;
    emoji: string;
    image: string;
    reason: string; // 選ばれた理由
    metrics: {
      balanceRate: number;      // 比率（Max文字数/総文字数）
      highSpeedReplyRate: number; // 高速返信率（10分以内の返信の割合）
      avgReplyMinutes: number;   // 平均返信間隔（分）
      avgCharCount: number;      // メッセージ1件あたりの平均文字数
      mediaRate: number;         // メディア要素比率
    };
    judgments: {
      balance: 'equal' | 'bias';     // 対等 or 偏り
      tempo: 'highSpeed' | 'leisurely'; // 高速 or 悠々
      expression: 'story' | 'resonance' | 'peace'; // 物語 or 共鳴 or 平穏
    };
    rawStats: {
      totalMessages: number;
      userAChars: number;
      userBChars: number;
      totalMediaCount: number;
      validReplyCount: number;
    };
  };
}

// 記号になりやすい文字を絵文字スタイルに強制変換する関数
function forceEmojiStyle(text: string): string {
  // \uFE0F は「絵文字として表示せよ」という指示子です
  return text.replace(/([\u2600-\u27BF])/g, '$1\uFE0F');
}

// ========================================
// 12型分類ロジック - 定数定義（厳守）
// ========================================
const RELATIONSHIP_THRESHOLDS = {
  // A. 比率（Balance）の閾値
  BIAS_THRESHOLD: 0.6, // 60%以上で「偏り」
  
  // B. 速度（Tempo）の閾値
  HIGH_SPEED_MINUTES: 10, // 10分以内を「高速返信」とみなす
  HIGH_SPEED_RATE_THRESHOLD: 0.7, // 高速返信率70%以上で「高速」
  LEISURELY_AVG_MINUTES: 180, // 平均返信間隔180分以上で「悠々」
  
  // C. 質感（Expression）の閾値
  STORY_AVG_CHARS: 20, // 平均20文字以上で「物語」
  RESONANCE_MEDIA_RATE: 0.2, // メディア比率20%以上で「共鳴」
  
  // 例外処理
  MIN_MESSAGES_FOR_ANALYSIS: 100, // 100件未満は「卵タイプ」
} as const;

// 12型分類マトリクス
const RELATIONSHIP_TYPES: {
  [key: string]: { name: string; emoji: string; description: string; detailedDescription: string; image: string };
} = {
  // 対等 × 高速
  'equal_highSpeed_story': { 
    name: 'エモ共有タイプ', 
    emoji: '💞', 
    description: '言葉の熱量がバグってる。お互い全力で"伝えたい"が溢れてる二人', 
    detailedDescription: '{user1}と{user2}のトークは、もはやチャットというより"感情のライブ配信"。\n\nどっちかが語り始めたら、もう片方もすぐに全力で返す。しかも短文の応酬じゃなくて、ちゃんと気持ちを言葉にして届けるタイプ。「うんうん」で済ませられない二人なんだと思う。\n\n嬉しいことがあったとき、真っ先に報告したくなる相手がお互いにお互い。モヤモヤしたときも、変にため込まずに吐き出せる。この"遠慮のなさ"が、二人の関係を強くしてる最大の武器。\n\nただし注意。感情のボルテージが高いぶん、すれ違ったときの衝撃もデカい。「そういう意味で言ったんじゃないのに」が起きやすいのもこのタイプ。でも大丈夫、二人なら言葉で解決できるはず。だって言葉の力を誰より信じてる二人だから。',
    image: '/talklens/emo.png' 
  },
  'equal_highSpeed_resonance': { 
    name: 'リアクション祭りタイプ', 
    emoji: '🎉', 
    description: 'スタンプと写真が止まらない。ノリだけで会話が成立する奇跡の二人', 
    detailedDescription: '{user1}と{user2}のトーク画面、たぶん文字よりスタンプと写真のほうが多い。\n\n「わかる」の代わりにスタンプ。「ウケる」の代わりにスタンプ。「おやすみ」もスタンプ。もはや言語を超越したコミュニケーションが成立してる。しかもそのテンポが異常に速い。他の人が見たら意味不明でも、二人の間では完璧に通じ合ってるのがすごいところ。\n\nこのタイプの最大の強みは"空気を読む力"が互角なこと。相手が送ったスタンプの温度感を瞬時に察して、ちょうどいいリアクションを返せる。言葉にしなくても伝わる関係って、実はかなり貴重。\n\n注意点があるとすれば、大事な話もスタンプで流しがちなところ。たまには文字で気持ちを伝えると、二人の関係にさらに深みが出るかも。',
    image: '/talklens/reaction.png' 
  },
  'equal_highSpeed_peace': { 
    name: 'チルピタイプ', 
    emoji: '☕', 
    description: '短い言葉をポンポン投げ合う。一緒にいるみたいに自然なテンポの二人', 
    detailedDescription: '{user1}と{user2}のトークは、隣にいる人と話してるみたいに自然。\n\n「今何してる？」「ゴロゴロ」「同じ」——これで会話として完成してる。短い言葉のキャッチボールが心地よくて、気づいたら何時間も続いてることがある。お互い重くないのに、ちゃんと繋がってる感覚があるのがこのタイプの最大の魅力。\n\n長文を書かないのは、手を抜いてるんじゃなくて"分かり合えてるから"。必要最低限の言葉で成り立つ関係って、信頼がないと絶対にできない。\n\n気をつけたいのは、本当に伝えたいことまで短く済ませちゃうクセ。「別に」「大丈夫」の裏に本音が隠れてること、お互いにあるかも。たまにはいつもより3行多く書いてみると、新しい発見があるはず。',
    image: '/talklens/chirupi.png' 
  },
  // 対等 × 悠々
  'equal_leisurely_story': { 
    name: 'じっくり文豪タイプ', 
    emoji: '📖', 
    description: '返信に時間をかけるのは、ちゃんと考えてるから。言葉の重みが違う二人', 
    detailedDescription: '{user1}と{user2}のトークは、読み応えがある。\n\n既読がついてもすぐには返ってこない。でもそれは無視してるんじゃなくて、"ちゃんと返したい"から。そして届いたメッセージを開くと、しっかり考えられた言葉が並んでる。この「待つ時間すら心地いい」と思える関係、実はめちゃくちゃレア。\n\nたぶん二人は、表面的な会話より本質的な話が好き。日常の報告だけじゃなくて「最近こういうこと考えてて」みたいな"思考の共有"ができる関係。相手の長文を読むのが苦じゃないのも、お互いに尊敬があるからこそ。\n\n唯一の弱点は、考えすぎて返信のタイミングを逃すこと。完璧な言葉を探してるうちに3日経ってた……みたいなの、身に覚えがあるのでは？',
    image: '/talklens/bungo.png' 
  },
  'equal_leisurely_resonance': { 
    name: '推し×推されタイプ', 
    emoji: '⭐', 
    description: 'お互いの"好き"を全力で肯定し合う。推し活みたいな関係の二人', 
    detailedDescription: '{user1}と{user2}のトーク、たぶん「いいね」「最高」「天才」みたいな肯定の嵐が吹いてる。\n\n返信のペースはゆっくりだけど、届くメッセージにはスタンプや写真がたっぷり。相手が何かをシェアしたら「それめっちゃいい！」と全力で推す。自分がシェアしたら相手も同じテンションで返してくれる。この"肯定のキャッチボール"が、二人のエネルギー源になってる。\n\nこのタイプは、お互いの存在自体が自己肯定感のブースター。「自分のこと好きでいられるのは、この人がいるから」と無意識に感じてるはず。距離感はベッタリじゃないのに、精神的な支えとしてはめちゃくちゃ大きい。\n\n注意したいのは、肯定しかしない関係に慣れすぎること。本音で「それはどうかな？」と言い合えたら、推し活から"本物の絆"にレベルアップできる。',
    image: '/talklens/oshi.png' 
  },
  'equal_leisurely_peace': { 
    name: 'ゆる繋がりタイプ', 
    emoji: '🌿', 
    description: '連絡頻度が低くても不安にならない。それだけで最強の二人', 
    detailedDescription: '{user1}と{user2}のトーク画面を開いても、派手さはない。\n\n返信はゆっくり、文章は短め、スタンプも控えめ。傍から見たら「この二人、仲いいの？」と思われるかもしれない。でも本人たちは分かってる。この距離感こそが心地いいってことを。\n\n3日返信がなくても「怒ってるのかな」とか思わない。久しぶりに連絡が来ても「お久しぶり」とか言わない。何事もなかったように会話が再開する。この"無理しなさ"が続いてること自体が、二人の相性の良さの証明。\n\nただし落とし穴もある。心地よすぎて、本当に大事なことを伝えそびれるパターン。「言わなくても分かるでしょ」が積もると、いつかズレが生まれる。年に数回でいいから、ちょっとだけ本音を出してみて。',
    image: '/talklens/yurutsunagari.png' 
  },
  // 偏り × 高速
  'bias_highSpeed_story': { 
    name: 'ガチ恋タイプ', 
    emoji: '💘', 
    description: '想いが溢れて止まらない。情熱がトーク画面を埋め尽くす二人', 
    detailedDescription: '正直に言います。{user1}、かなり熱い。\n\n送るメッセージの量も、文章の長さも、返信の速さも、全部が{user2}への想いの強さを物語ってる。既読がついた瞬間に次のメッセージを準備してるタイプ。しかもその内容が、ちゃんと気持ちのこもった長文。「好き」を言語化する能力が異常に高い。\n\n{user2}は、その熱量を受け止めてちゃんと返してるのがえらい。このバランスが崩れてないってことは、{user2}なりの愛情表現がちゃんとあるってこと。量じゃなくて質で返してるタイプかも。\n\n{user1}へのアドバイス：たまには"送らない勇気"も大事。余白があるほうが、言葉の重みが増すことがある。{user2}へのアドバイス：{user1}の長文、ちゃんと読んでること伝えてあげて。それだけで{user1}は救われるから。',
    image: '/talklens/gachikoi.png' 
  },
  'bias_highSpeed_resonance': { 
    name: 'リア充全開タイプ', 
    emoji: '📸', 
    description: 'カメラロールが共有フォルダ状態。日常ダダ漏れな二人', 
    detailedDescription: '{user1}、日常のあらゆる瞬間を{user2}に届けたくて仕方がない。\n\nランチの写真、街で見つけた面白い看板、買った服、空がきれいだったとき——「見て見て」が止まらない。しかもスタンプの使い方が上手くて、テンポよく会話を盛り上げるのが得意。{user2}のことを"自分の日常の一部"として自然に組み込んでる。\n\n{user2}は受け取る側だけど、リアクションのセンスがいい。{user1}が送りたくなる空気を作ってるのは、実は{user2}の反応の上手さかもしれない。\n\nこのタイプの面白いところは、{user1}が「自分ばっかり送ってるかも」と密かに不安になりがちなこと。大丈夫、{user2}は楽しんでるから送ってきてる。でもたまには{user2}からも写真送ってあげて。{user1}、めちゃくちゃ喜ぶから。',
    image: '/talklens/riaju.png' 
  },
  'bias_highSpeed_peace': { 
    name: '構ってちゃん×塩対応タイプ', 
    emoji: '🧊', 
    description: '連投に「うん」で返す。この温度差、逆に愛おしい二人', 
    detailedDescription: '{user1}は話したいことがいっぱいある。{user2}は、ない。——というより、{user2}は短い言葉で十分だと思ってるだけ。\n\n{user1}が3通送って{user2}が1通で返す。しかも{user2}の返信は短い。でもよく見ると、{user2}はちゃんと速く返してる。これが重要。興味がなかったらそもそも既読スルーしてる。短くても速いのは、{user2}なりの"ちゃんと相手してるよ"のサイン。\n\n{user1}は「もっとちゃんと返してよ」と思うことがあるかもしれない。でも{user2}のスタイルを変えようとするとうまくいかない。{user2}は{user2}のやり方で、ちゃんとこの関係を大事にしてる。\n\n実はこの温度差こそが二人を面白くしてるポイント。{user1}の明るさと{user2}のクールさ、周りから見たら最高のコンビに見えてるはず。',
    image: '/talklens/kamattechan_shio.png' 
  },
  // 偏り × 悠々
  'bias_leisurely_story': { 
    name: 'のんびりメンヘラケアタイプ', 
    emoji: '🤲', 
    description: '本音を静かに受け止める。言葉で繋がる安全地帯な二人', 
    detailedDescription: '{user1}にとって{user2}は、本音を預けられる数少ない存在。\n\n返信のペースはゆっくりだけど、{user1}のメッセージにはしっかり気持ちがこもった長文が多い。日常の出来事だけじゃなくて、不安とか迷いとか、普通の人には見せない部分も共有してる。それを{user2}が急かさず、否定せず、自分のペースで受け止めてる。\n\nこの関係が成り立つのは、{user2}の"聞く力"が本物だから。返信が遅くても「ちゃんと読んでくれてるんだな」と{user1}が信じられるだけの信頼がある。これ、簡単そうに見えて実はすごく難しいこと。\n\n{user1}へ：吐き出すだけじゃなくて、たまには{user2}の話も聞いてあげて。{user2}は自分からあまり言わないだけで、話したいことがあるかもしれない。{user2}へ：あなたの存在そのものが{user1}を支えてる。それ、ちゃんと知っておいて。',
    image: '/talklens/menhera.png' 
  },
  'bias_leisurely_resonance': { 
    name: 'めちゃぱちゃマイペースタイプ', 
    emoji: '📣', 
    description: '独自のテンポとノリで繋がる。他の人には理解できない二人だけの世界', 
    detailedDescription: '{user1}と{user2}のトーク、第三者が見たらちょっと不思議かもしれない。\n\n{user1}がマイペースにスタンプや写真を送って、{user2}がこれまたマイペースに反応する。テンポはゆっくり、でもリアクションは独特。たぶん二人にしか分からない"内輪ネタ"みたいなスタンプの使い方がある。\n\nこの二人の最大の強みは"相手のペースを否定しない"こと。既読から返信まで時間が空いても、「遅い」とか「もっと送って」とか言わない。お互いのリズムをそのまま受け入れてる。マイペース×マイペースが噛み合ってるのは、相性がいい証拠。\n\nちょっと注意したいのは、マイペースすぎてすれ違いに気づかないパターン。「あれ、最後に連絡したのいつだっけ？」とならないように、たまにはリマインド的に連絡してみて。',
    image: '/talklens/mypase.png' 
  },
  'bias_leisurely_peace': { 
    name: '聞き役×語り手タイプ', 
    emoji: '👂', 
    description: '話す人と聞く人。シンプルだけど心地いい、役割のハッキリした二人', 
    detailedDescription: 'この二人のトークには、暗黙の役割分担がある。\n\n{user1}が話題を振って、{user2}がシンプルに返す。これがゆっくりしたペースで繰り返される。派手さはないけど、安定感がある。お互い「この人とのやりとりはこういうもの」と分かっていて、それに不満がない。\n\n{user1}は、{user2}の短い返信を「冷たい」とは思ってない。むしろ{user2}の"余計なことを言わない"ところに安心してる。{user2}は、{user1}が話してくれるから自分は聞き役でいられる。この補完関係が自然にできてるのがすごい。\n\nこのタイプに必要なのは、たまに役割を交換してみること。{user2}から話題を振ったら{user1}はめちゃくちゃ嬉しいし、{user1}が聞き役に回ったら{user2}の意外な一面が見えるかも。ずっと同じでも壊れない関係だけど、変化を入れるともっと面白くなる。',
    image: '/talklens/kikifekatarite.png' 
  },
  // 例外
  'egg': { 
    name: '卵タイプ', 
    emoji: '🥚', 
    description: 'まだ関係のカタチは見えない。でも、ここから何にでもなれる', 
    detailedDescription: '{user1}と{user2}のトーク、まだ始まったばかり。\n\n100通にも満たないやりとりじゃ、正直まだ何も分からない。でも逆に言えば、二人の関係はまだ何色にも染まってないってこと。ここからエモ共有にもチルピにもガチ恋にもなれる。可能性しかない状態。\n\nひとつだけ確かなのは、二人がちゃんとやりとりを始めてるってこと。最初の一通を送るのが一番難しいのに、それをもうクリアしてる。あとはもう少しだけ会話を重ねてみて。\n\n次にこの診断をやるときには、きっと二人だけの"タイプ"が見えてくるはず。',
    image: '/talklens/baby.png' 
  },
};

// スクロール時のフェードインアニメーションコンポーネント
const FadeIn = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      {
        rootMargin: "0px 0px -50px 0px", // 少し下で発火
        threshold: 0.1,
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-700 ease-out transform",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

// グラスモーフィズムヘッダー（スマホ用）- 16personalities風の明るいデザイン
const GlassHeader = () => {
  const shareUrl = typeof window !== 'undefined' ? window.location.href : 'https://pairtalk.site';
                      const shareText = 'ペアトーク診断 Ι LINEトークをダウンロード不要で診断しよう！12タイプの関係性がわかります！ ダウンロード不要でいますぐできる！LINEトーク履歴を分析して、二人の関係性をカンタン診断！';

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'ペアトーク診断 Ι LINEトークをダウンロード不要で診断しよう！12タイプの関係性がわかります！',
        text: shareText,
        url: shareUrl,
      }).catch(() => {});
    } else {
      // フォールバック：Xでシェア
      const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
      window.open(url, '_blank', 'width=550,height=420');
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-[9999] md:hidden" style={{ WebkitTransform: 'translateZ(0)', position: 'fixed' }}>
        <div className="backdrop-blur-xl bg-white border-b border-slate-200/80 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)]">
          <div className="flex items-center justify-between px-4 py-3">
            {/* 中央: サイトタイトル - 左寄せ */}
            <div className="flex-1 flex items-center">
              <h1 className="font-black text-sm text-slate-900 tracking-tight">
                ペアトーク診断 for LINE
              </h1>
            </div>
            {/* 右上: 共有ボタン */}
            <button
              onClick={handleShare}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-bold rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                boxShadow: '0 4px 15px rgba(6, 182, 212, 0.4)',
              }}
            >
              <span className="relative z-10 flex items-center gap-1.5">
                共有する
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
              {/* 光沢エフェクト */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-shimmer" />
            </button>
          </div>
        </div>
      </header>
      {/* ヘッダー分のスペーサー（スマホのみ） */}
      <div className="h-14 md:hidden" />
    </>
  );
};

// 相性12種類セクション - nani.now風リッチデザイン
const CompatibilityTypesSection = () => {
  const allTypes = [
    { key: 'equal_highSpeed_story', ...RELATIONSHIP_TYPES['equal_highSpeed_story'], gradient: 'from-rose-500 to-pink-500' },
    { key: 'equal_highSpeed_resonance', ...RELATIONSHIP_TYPES['equal_highSpeed_resonance'], gradient: 'from-orange-500 to-amber-500' },
    { key: 'equal_highSpeed_peace', ...RELATIONSHIP_TYPES['equal_highSpeed_peace'], gradient: 'from-emerald-500 to-teal-500' },
    { key: 'equal_leisurely_story', ...RELATIONSHIP_TYPES['equal_leisurely_story'], gradient: 'from-blue-500 to-cyan-500' },
    { key: 'equal_leisurely_resonance', ...RELATIONSHIP_TYPES['equal_leisurely_resonance'], gradient: 'from-violet-500 to-purple-500' },
    { key: 'equal_leisurely_peace', ...RELATIONSHIP_TYPES['equal_leisurely_peace'], gradient: 'from-lime-500 to-green-500' },
    { key: 'bias_highSpeed_story', ...RELATIONSHIP_TYPES['bias_highSpeed_story'], gradient: 'from-red-500 to-rose-500' },
    { key: 'bias_highSpeed_resonance', ...RELATIONSHIP_TYPES['bias_highSpeed_resonance'], gradient: 'from-fuchsia-500 to-pink-500' },
    { key: 'bias_highSpeed_peace', ...RELATIONSHIP_TYPES['bias_highSpeed_peace'], gradient: 'from-sky-500 to-blue-500' },
    { key: 'bias_leisurely_story', ...RELATIONSHIP_TYPES['bias_leisurely_story'], gradient: 'from-amber-500 to-yellow-500' },
    { key: 'bias_leisurely_resonance', ...RELATIONSHIP_TYPES['bias_leisurely_resonance'], gradient: 'from-indigo-500 to-violet-500' },
    { key: 'bias_leisurely_peace', ...RELATIONSHIP_TYPES['bias_leisurely_peace'], gradient: 'from-teal-500 to-emerald-500' },
  ];
  
  return (
    <section className="relative py-24 overflow-hidden">
      {/* 背景グラデーション */}
      <div className="absolute inset-0" style={{ backgroundColor: '#F5F9FB' }} />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl" />
      
      <div className="relative max-w-6xl mx-auto px-4">
        {/* セクションヘッダー */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-2 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full text-sm font-medium text-purple-700 mb-4">
            トークの傾向
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: '#080D12' }}>
            全12種類の相性タイプ
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: '#67757C' }}>
            二人のトーク傾向から<br />関係性を診断するよ！
          </p>
        </div>
        
        {/* カードグリッド */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-20 mt-16 px-4">
          {allTypes.map((type, index) => (
            <div
              key={type.key}
              className="group relative bg-white rounded-2xl p-6 pt-20 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.15)] transition-all duration-300 hover:-translate-y-1 border border-slate-100 overflow-visible"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* キャラクター画像 - 中央配置 */}
              <div className="absolute -top-16 left-0 right-0 flex justify-center z-10">
                <div className="relative w-40 h-40">
                  <div className="relative w-full h-full drop-shadow-xl transition-transform duration-300 group-hover:scale-110">
                    <img 
                      src={type.image} 
                      alt={type.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col items-center text-center mt-4">
                {/* タイプ名 */}
                <h3 className="font-bold text-xl text-slate-900 mb-3 transition-colors group-hover:text-cyan-600">
                  {type.name}
                </h3>
                {/* 説明文 */}
                <p className="text-sm text-slate-600 leading-relaxed text-balance">
                  {type.description}
                </p>
              </div>
              
            </div>
          ))}
        </div>
        
        {/* 卵タイプの説明 */}
        <div className="max-w-2xl mx-auto mt-12 px-4">
          <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6 text-center shadow-sm">
            <p className="text-amber-900 font-bold text-base leading-relaxed">
              トーク履歴が少ない場合は、診断ができません。その場合は、卵タイプと表示されます。たくさんトークしてから診断してね！
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default function TalkLensPage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isShowingSuccess, setIsShowingSuccess] = useState(false);
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [isWritterModalOpen, setIsWritterModalOpen] = useState(false);
  const [showAdminStats, setShowAdminStats] = useState(false);
  const [analysisCount, setAnalysisCount] = useState<number | null>(null);
  const [dailyData, setDailyData] = useState<{ date: string; count: number }[]>([]);
  const [mau, setMau] = useState<number | null>(null);
  const { toast } = useToast();

  // 隠しコマンド（Ctrl+Shift+A）で分析回数を表示
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // デバッグ用：キー入力確認
      if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        console.log('隠しコマンド検出: Ctrl+Shift+A');
        setShowAdminStats(true); // まずモーダルを表示
        
        try {
          // 総計を取得
          const totalResponse = await fetch('/api/analytics/count');
          if (totalResponse.ok) {
            const totalData = await totalResponse.json();
            setAnalysisCount(totalData.count);
          } else {
            setAnalysisCount(0);
          }

          // 日ごとのデータを取得
          const dailyResponse = await fetch('/api/analytics/count?daily=true');
          if (dailyResponse.ok) {
            const dailyResult = await dailyResponse.json();
            setDailyData(dailyResult.daily || []);
            setMau(dailyResult.mau || 0);
          } else {
            setDailyData([]);
            setMau(0);
          }
        } catch (err) {
          console.error('Failed to fetch analysis data:', err);
          setAnalysisCount(0);
          setDailyData([]);
          setMau(0);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 通話時間を秒に変換するヘルパー（日英両対応）
  const parseCallDuration = (content: string): number => {
    // 日本語版: 通話時間 h:mm:ss または mm:ss
    let match = content.match(/通話時間\s+(\d+):(\d+):(\d+)/);
    if (match) {
      const h = parseInt(match[1]);
      const m = parseInt(match[2]);
      const s = parseInt(match[3]);
      return h * 3600 + m * 60 + s;
    }
    match = content.match(/通話時間\s+(\d+):(\d+)/);
    if (match) {
      const m = parseInt(match[1]);
      const s = parseInt(match[2]);
      return m * 60 + s;
    }
    match = content.match(/通話時間\s+(\d+)\s*(秒|分)/);
    if (match) {
      const value = parseInt(match[1]);
      if (match[2] === "分") {
        return value * 60;
      }
      return value;
    }
    // 英語版: Call duration h:mm:ss または mm:ss
    match = content.match(/Call duration\s+(\d+):(\d+):(\d+)/i);
    if (match) {
      const h = parseInt(match[1]);
      const m = parseInt(match[2]);
      const s = parseInt(match[3]);
      return h * 3600 + m * 60 + s;
    }
    match = content.match(/Call duration\s+(\d+):(\d+)/i);
    if (match) {
      const m = parseInt(match[1]);
      const s = parseInt(match[2]);
      return m * 60 + s;
    }
    // ☎ 記号付きの通話時間
    match = content.match(/☎\s*通話時間\s+(\d+):(\d+):(\d+)/);
    if (match) {
      const h = parseInt(match[1]);
      const m = parseInt(match[2]);
      const s = parseInt(match[3]);
      return h * 3600 + m * 60 + s;
    }
    match = content.match(/☎\s*通話時間\s+(\d+):(\d+)/);
    if (match) {
      const m = parseInt(match[1]);
      const s = parseInt(match[2]);
      return m * 60 + s;
    }
    return 0;
  };

  // メディア要素の判定（日英両対応）
  const isMediaPlaceholder = (content: string): { isMedia: boolean; type: string } => {
    const trimmed = content.trim();
    const mediaPatterns: { pattern: RegExp; type: string }[] = [
      // 日本語版
      { pattern: /^\[スタンプ\]$/, type: 'sticker' },
      { pattern: /^\[写真\]$/, type: 'photo' },
      { pattern: /^\[動画\]$/, type: 'video' },
      { pattern: /^\[ファイル\]$/, type: 'file' },
      { pattern: /^\[連絡先\]$/, type: 'contact' },
      { pattern: /^\[位置情報\]$/, type: 'location' },
      { pattern: /^\[ボイスメッセージ\]$/, type: 'voice' },
      { pattern: /^\[ショップカード\]$/, type: 'shopcard' },
      { pattern: /^\[投票\]$/, type: 'poll' },
      { pattern: /^\[日程調整\]$/, type: 'schedule' },
      { pattern: /^\[イベント\]$/, type: 'event' },
      { pattern: /^\[リンク\]$/, type: 'link' },
      { pattern: /^\[アルバム\]$/, type: 'album' },
      // 英語版
      { pattern: /^\[Sticker\]$/i, type: 'sticker' },
      { pattern: /^\[Photo\]$/i, type: 'photo' },
      { pattern: /^\[Image\]$/i, type: 'photo' },
      { pattern: /^\[Video\]$/i, type: 'video' },
      { pattern: /^\[File\]$/i, type: 'file' },
      { pattern: /^\[Contact\]$/i, type: 'contact' },
      { pattern: /^\[Location\]$/i, type: 'location' },
      { pattern: /^\[Voice message\]$/i, type: 'voice' },
    ];
    
    for (const { pattern, type } of mediaPatterns) {
      if (pattern.test(trimmed)) {
        return { isMedia: true, type };
      }
    }
    return { isMedia: false, type: '' };
  };

  // LINEデコ文字（丸括弧形式）の検出と除去
  const lineDecoPattern = /\((?:heart|star|moon|sun|flower|clover|cherry|smile|cry|angry|love|kiss|wink|laugh|sad|happy|sleepy|surprised|confused|cool|sick|devil|angel|ghost|skull|fire|sparkle|music|note|diamond|crown|ribbon|gift|cake|coffee|beer|wine|cocktail|hamburger|pizza|ramen|sushi|rice|bread|apple|orange|banana|grape|strawberry|watermelon|peach|lemon|pineapple|cat|dog|rabbit|bear|panda|pig|monkey|chicken|penguin|fish|dolphin|whale|octopus|snail|butterfly|bee|ladybug|ant|spider|turtle|snake|frog|mouse|cow|tiger|lion|horse|elephant|camel|gorilla|koala|kangaroo|dragon|dinosaur|unicorn|rainbow|cloud|rain|snow|thunder|wind|sun|moon|star|comet|rocket|airplane|car|bus|train|ship|bike|helicopter|ambulance|police|taxi|truck|tractor|house|building|castle|church|school|hospital|hotel|bank|store|factory|stadium|tower|bridge|fountain|tent|ferris|roller|carousel|tree|palm|cactus|bamboo|mushroom|leaf|herb|shamrock|tulip|rose|hibiscus|sunflower|blossom|bouquet|seedling|evergreen|deciduous|maple|fallen|ear|nose|eye|eyes|tongue|lips|tooth|bone|brain|heart|lungs|muscle|leg|foot|hand|thumbsup|thumbsdown|clap|wave|ok|peace|fist|punch|point|pray|handshake|nail|ear|nose|footprints|glasses|sunglasses|tie|shirt|dress|kimono|bikini|jeans|scarf|gloves|coat|sock|shoe|heels|sandal|boots|crown|tophat|cap|helmet|ribbon|bag|handbag|purse|backpack|briefcase|umbrella|ring|gem|watch|phone|laptop|keyboard|mouse|computer|tv|camera|video|headphone|microphone|radio|speaker|clock|hourglass|timer|alarm|calendar|card|money|dollar|euro|yen|pound|credit|mail|envelope|package|tag|label|bookmark|clipboard|pencil|pen|marker|crayon|brush|magnify|lock|key|hammer|axe|sword|gun|bomb|pill|syringe|thermometer|toilet|shower|bathtub|bed|couch|chair|door|window|curtain|mirror|frame|vase|candle|bulb|flashlight|lantern|balloon|confetti|sparkler|firecracker|party|pinata|crystal|magnet|battery|plug|gear|wrench|screwdriver|nut|screw|link|chain|hook|toolbox|brick|paint|palette|frame|easel|canvas|brush|ruler|triangle|compass|protractor|calculator|abacus|calendar|printer|scanner|fax|modem|router|satellite|antenna|telescope|microscope|test|flask|petri|dna|atom|molecule|magnet|battery|plug|lightbulb|flashlight|candle|torch|lamp|lantern)\)/gi;

  // リアクション・送信取消の検出（日英両対応）
  const isReactionOrUnsent = (content: string): { isReaction: boolean; isUnsent: boolean } => {
    const trimmed = content.trim();
    const isReaction = /がリアクションしました|reacted to a message/i.test(trimmed);
    const isUnsent = /メッセージの送信を取り消しました|unsent a message/i.test(trimmed);
    return { isReaction, isUnsent };
  };

  // 通話メッセージの判定（日英両対応）
  const isCallContent = (content: string): boolean => {
    const callKeywords = [
      "通話時間", "通話を終了", "通話を開始", "通話に応答",
      "応答がありません", "不在着信", "キャンセル", "応答なし",
      "ビデオ通話", "音声通話",
      "Call duration", "Call ended", "Call started", "Missed call",
      "Canceled", "No answer", "Video call", "Voice call"
    ];
    const lowerContent = content.toLowerCase();
    return callKeywords.some(kw => lowerContent.includes(kw.toLowerCase()));
  };

  const parseLineTalkHistory = (text: string): Message[] => {
    const messages: Message[] = [];
    const lines = text.split(/\r?\n/);

    const isSystemMessage = (content: string): boolean => {
      const trimmedContent = content.trim();
      
      // 注: [スタンプ]等のメディア代替テキストは、ユーザーが送ったメッセージなのでシステムメッセージではない
      
      // 1. 通話・コミュニケーション関連 (日英両対応)
      const callKeywords = [
        // 日本語
        "通話時間", "通話を終了", "通話を開始", "通話に応答",
        "応答がありません", "不在着信", "キャンセル", "応答なし",
        "ビデオ通話", "音声通話", "メッセージの送信を取り消しました", "友だちに再送信",
        // 英語
        "Call duration", "Call ended", "Call started", "Missed call",
        "Canceled", "No answer", "Video call", "Voice call",
        "unsent a message"
      ];
      if (callKeywords.some(kw => trimmedContent.toLowerCase().includes(kw.toLowerCase()))) {
        return true;
      }

      // 2. リアクション (日英両対応)
      if (/がリアクションしました|reacted to a message/i.test(trimmedContent)) return true;

      // 3. グループ・メンバー管理 (日英両対応)
      const groupSystemMessages = [
        // 日本語
        "が退会しました", "がグループを退会しました", "が参加しました",
        "がグループに参加しました", "が招待しました", "がグループから削除しました",
        "がグループ名を", "がグループのアイコンを変更しました",
        // 英語
        "left the group", "joined the group", "was invited", "was removed",
        "changed the group name", "changed the group icon"
      ];
      if (groupSystemMessages.some(msg => trimmedContent.toLowerCase().includes(msg.toLowerCase()))) return true;

      // 4. アルバム・ノート・イベント関連 (日英両対応)
      const contentKeywords = [
        "アルバム", "ノート", "イベント",
        "album", "note", "event"
      ];
      if (contentKeywords.some(kw => trimmedContent.toLowerCase().includes(kw.toLowerCase()))) return true;

      // 5. セキュリティ・定型通知・日時 (前方一致・部分一致)
      if (trimmedContent.startsWith("このメッセージは")) return true;
      if (trimmedContent.startsWith("利用していた端末")) return true;
      if (trimmedContent.includes("利用していた端末")) return true;
      if (trimmedContent.includes("友だちに再送信")) return true;
      if (/Messages and calls are encrypted/i.test(trimmedContent)) return true;
      if (/Letter Sealing/i.test(trimmedContent)) return true;
      if (trimmedContent.includes("暗号化されています")) return true;
      if (/end-to-end encryption/i.test(trimmedContent)) return true;
      
      // 日時のみの行 (例: 2026/01/11(日), 15:30)
      if (/^\d{4}\/\d{1,2}\/\d{1,2}/.test(trimmedContent)) return true;
      if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(trimmedContent)) return true;

      return false;
    };

    // デリミタを動的に検出する関数
    const detectDelimiter = (line: string): string | null => {
      // タブ区切り（最も一般的）
      if (/^\d{2}:\d{2}(:\d{2})?\t/.test(line)) return '\t';
      // カンマ区切り（一部Android版）
      if (/^\d{2}:\d{2}(:\d{2})?,/.test(line)) return ',';
      // スペース区切り（PC版等）
      if (/^\d{2}:\d{2}(:\d{2})?\s+[^\s]/.test(line)) return ' ';
      return null;
    };

    // iOS版のダブルクォーテーションで囲まれた複数行メッセージを処理
    const removeQuotationWrap = (content: string): string => {
      let result = content.trim();
      // 全体がダブルクォーテーションで囲まれている場合のみ除去
      if (result.startsWith('"') && result.endsWith('"') && result.length > 1) {
        result = result.slice(1, -1);
      } else if (result.startsWith('"')) {
        // 開始のみダブルクォーテーションがある場合（複数行の開始行）
        result = result.slice(1);
      } else if (result.endsWith('"')) {
        // 終了のみダブルクォーテーションがある場合（複数行の終了行）
        result = result.slice(0, -1);
      }
      return result.trim();
    };

    let skipHeader = true;
    let currentDate: Date | null = null;
    let currentMessage: { date: Date; user: string; content: string[]; isSticker?: boolean; isCall?: boolean; callDuration?: number } | null = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      
      if (skipHeader) {
        if (trimmedLine.startsWith("[LINE]") || trimmedLine.includes("保存日時") || trimmedLine.includes("トーク履歴")) {
          continue;
        }
        if (/^\d{4}\/\d{2}\/\d{2}\(.\)$/.test(trimmedLine) || /^\d{4}\.\d{2}\.\d{2}\s+[月火水木金土日]曜日$/.test(trimmedLine)) {
          skipHeader = false;
        } else {
          continue;
        }
      }

      if (!trimmedLine) {
        if (currentMessage && currentMessage.content && Array.isArray(currentMessage.content) && currentMessage.content.length > 0) {
          const rawContent = currentMessage.content.join("\n").trim();
          const fullContent = removeQuotationWrap(rawContent);
          const isCallMessage = currentMessage.isCall || isCallContent(fullContent);
          const callDuration = isCallMessage ? (currentMessage.callDuration ?? parseCallDuration(fullContent)) : undefined;
          
          if (!isSystemMessage(fullContent)) {
            const isSticker = /\[スタンプ\]|\[Sticker\]/i.test(fullContent);
            const emojiPattern = /^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]+$/u;
            const isEmoji = !isSticker && emojiPattern.test(fullContent);

            messages.push({
              date: currentMessage.date,
              user: currentMessage.user,
              content: fullContent,
              isSticker,
              isEmoji,
              isCall: isCallMessage,
              callDuration: callDuration,
            });
          } else if (isCallMessage) {
            const isSticker = /\[スタンプ\]|\[Sticker\]/i.test(fullContent);
            const emojiPattern = /^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]+$/u;
            const isEmoji = !isSticker && emojiPattern.test(fullContent);

            messages.push({
              date: currentMessage.date,
              user: currentMessage.user,
              content: fullContent,
              isSticker,
              isEmoji,
              isCall: isCallMessage,
              callDuration: callDuration,
            });
          }
        }
        currentMessage = null;
        continue;
      }

      let dateMatch = trimmedLine.match(/^(\d{4}\/\d{2}\/\d{2})\(.\)$/);
      let dateFormat = 1;
      
      if (!dateMatch) {
        dateMatch = trimmedLine.match(/^(\d{4})\.(\d{2})\.(\d{2})\s+[月火水木金土日]曜日$/);
        if (dateMatch) {
          dateFormat = 2;
        }
      }
      
      if (dateMatch) {
        if (currentMessage && currentMessage.content && Array.isArray(currentMessage.content) && currentMessage.content.length > 0) {
          const rawContent = currentMessage.content.join("\n").trim();
          const fullContent = removeQuotationWrap(rawContent);
          const isCallMessage = currentMessage.isCall || isCallContent(fullContent);
          const callDuration = isCallMessage ? (currentMessage.callDuration ?? parseCallDuration(fullContent)) : undefined;
          
          if (!isSystemMessage(fullContent)) {
            const trimmedContent = fullContent.trim();
            const isSticker = /\[スタンプ\]|\[Sticker\]/i.test(trimmedContent);
            const emojiPattern = /^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]+$/u;
            const isEmoji = !isSticker && emojiPattern.test(fullContent);

            messages.push({
              date: currentMessage.date,
              user: currentMessage.user,
              content: fullContent,
              isSticker,
              isEmoji,
              isCall: isCallMessage,
              callDuration: callDuration,
            });
          } else if (isCallMessage) {
            const trimmedContent = fullContent.trim();
            const isSticker = /\[スタンプ\]|\[Sticker\]/i.test(trimmedContent);
            const emojiPattern = /^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]+$/u;
            const isEmoji = !isSticker && emojiPattern.test(fullContent);

            messages.push({
              date: currentMessage.date,
              user: currentMessage.user,
              content: fullContent,
              isSticker,
              isEmoji,
              isCall: isCallMessage,
              callDuration: callDuration,
            });
          }
        }
        currentMessage = null;

        try {
          if (dateFormat === 1) {
            const [, dateStr] = dateMatch;
            const [year, month, day] = dateStr.split("/").map(Number);
            currentDate = new Date(year, month - 1, day);
          } else {
            const [, year, month, day] = dateMatch.map(Number);
            currentDate = new Date(year, month - 1, day);
          }
          if (isNaN(currentDate.getTime())) {
            currentDate = null;
          }
        } catch (err) {
          console.error("日付パースエラー:", err, trimmedLine);
          currentDate = null;
        }
        continue;
      }

      // メッセージ行のパース（複数デリミタ対応、秒数対応）
      // タブ区切り（時:分 または 時:分:秒）
      let messageMatch = trimmedLine.match(/^(\d{2}:\d{2}(?::\d{2})?)\t([^\t]*)\t(.*)$/);
      
      // カンマ区切り（Android版等）
      if (!messageMatch) {
        messageMatch = trimmedLine.match(/^(\d{2}:\d{2}(?::\d{2})?),([^,]*),(.*)$/);
      }
      
      // スペース区切り（PC版等）
      if (!messageMatch) {
        messageMatch = trimmedLine.match(/^(\d{2}:\d{2}(?::\d{2})?)\s+([^\s]+)\s+(.*)$/);
      }
      
      if (messageMatch) {
        if (currentMessage && currentMessage.content && Array.isArray(currentMessage.content) && currentMessage.content.length > 0) {
          const rawContent = currentMessage.content.join("\n").trim();
          const fullContent = removeQuotationWrap(rawContent);
          const isSticker = currentMessage.isSticker || /\[スタンプ\]|\[Sticker\]/i.test(fullContent);
          const emojiPattern = /^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]+$/u;
          const isEmoji = !isSticker && emojiPattern.test(fullContent);

          const isCallMessage = currentMessage.isCall || isCallContent(fullContent);
          const callDuration = isCallMessage ? (currentMessage.callDuration ?? parseCallDuration(fullContent)) : undefined;

          messages.push({
            date: currentMessage.date,
            user: currentMessage.user,
            content: fullContent,
            isSticker,
            isEmoji,
            isCall: isCallMessage,
            callDuration: callDuration,
          });
        }

        if (!currentDate) continue;

        const [, timeStr, user, content] = messageMatch;
        try {
          // 時:分 または 時:分:秒 に対応
          const timeParts = timeStr.split(":").map(Number);
          const hour = timeParts[0];
          const minute = timeParts[1];
          const second = timeParts[2] || 0;
          const date = new Date(currentDate);
          date.setHours(hour);
          date.setMinutes(minute);
          date.setSeconds(second);

          if (isNaN(date.getTime())) continue;

          // ダブルクォーテーションの除去（単一行の場合）
          const messageContent = removeQuotationWrap(content.trim());

          // 通話メッセージの判定（日英両対応）
          const isCallMessage = isCallContent(messageContent);
          
          // スタンプの判定（日英両対応）
          const isSticker = /\[スタンプ\]|\[Sticker\]/i.test(messageContent);
          
          currentMessage = {
            date,
            user: user.trim() || "システム",
            content: [messageContent],
            isSticker,
            isCall: isCallMessage,
            callDuration: isCallMessage ? parseCallDuration(messageContent) : undefined,
          };
        } catch (err) {
          console.error("メッセージパースエラー:", err, trimmedLine);
          currentMessage = null;
          continue;
        }
      } else if (currentMessage && currentMessage.content) {
        const isDateLine = /^\d{4}\/\d{2}\/\d{2}\(.\)$/.test(trimmedLine) || 
                          /^\d{4}\.\d{2}\.\d{2}\s+[月火水木金土日]曜日$/.test(trimmedLine);
        const isMessageLine = /^\d{2}:\d{2}\t/.test(trimmedLine) || 
                             /^\d{2}:\d{2}\s+[^\s]+\s+/.test(trimmedLine);
        
        if (!isDateLine && !isMessageLine) {
          if (Array.isArray(currentMessage.content)) {
            currentMessage.content.push(trimmedLine);
          }
        }
      }
    }

    if (currentMessage && currentMessage.content && Array.isArray(currentMessage.content) && currentMessage.content.length > 0) {
      const rawContent = currentMessage.content.join("\n").trim();
      const fullContent = removeQuotationWrap(rawContent);
      const isSticker = currentMessage.isSticker || /\[スタンプ\]|\[Sticker\]/i.test(fullContent);
      const emojiPattern = /^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]+$/u;
      const isEmoji = !isSticker && emojiPattern.test(fullContent);

      const isCallMessage = currentMessage.isCall || isCallContent(fullContent);
      const callDuration = isCallMessage ? (currentMessage.callDuration ?? parseCallDuration(fullContent)) : undefined;

      messages.push({
        date: currentMessage.date,
        user: currentMessage.user,
        content: fullContent,
        isSticker,
        isEmoji,
        isCall: isCallMessage,
        callDuration: callDuration,
      });
    }

    messages.sort((a, b) => a.date.getTime() - b.date.getTime());
    return messages;
  };

  const analyzeMessages = async (messages: Message[]): Promise<AnalysisResult> => {
    if (messages.length === 0) {
      throw new Error("メッセージが見つかりませんでした");
    }

    const isSystemMessage = (content: string): boolean => {
      const trimmedContent = content.trim();
      const lowerContent = trimmedContent.toLowerCase();
      
      // 注: [スタンプ]等のメディア代替テキストは、ユーザーが送ったメッセージなのでシステムメッセージではない
      // これらは単語集計時に除外する
      
      // 1. 通話・コミュニケーション関連（日英両対応）
      const callKeywords = [
        "通話時間", "通話を終了", "通話を開始", "通話に応答",
        "応答がありません", "不在着信", "キャンセル", "応答なし",
        "ビデオ通話", "音声通話", "メッセージの送信を取り消しました", "友だちに再送信",
        "call duration", "call ended", "call started", "missed call",
        "canceled", "no answer", "video call", "voice call", "unsent a message"
      ];
      if (callKeywords.some(kw => lowerContent.includes(kw.toLowerCase()))) return true;

      // 2. リアクション（日英両対応）
      if (/がリアクションしました|reacted to a message/i.test(trimmedContent)) return true;

      // 3. グループ・メンバー管理（日英両対応）
      const groupSystemMessages = [
        "が退会しました", "がグループを退会しました", "が参加しました",
        "がグループに参加しました", "が招待しました", "がグループから削除しました",
        "がグループ名を", "がグループのアイコンを変更しました",
        "left the group", "joined the group", "was invited", "was removed",
        "changed the group name", "changed the group icon"
      ];
      if (groupSystemMessages.some(msg => lowerContent.includes(msg.toLowerCase()))) return true;

      // 4. アルバム・ノート・イベント関連（日英両対応）
      const contentKeywords = ["アルバム", "ノート", "イベント", "album", "note", "event"];
      if (contentKeywords.some(kw => lowerContent.includes(kw.toLowerCase()))) return true;

      // 5. セキュリティ・定型通知・日時
      if (trimmedContent.startsWith("このメッセージは")) return true;
      if (trimmedContent.startsWith("利用していた端末から")) return true;
      if (/messages and calls are encrypted/i.test(trimmedContent)) return true;
      if (/letter sealing/i.test(trimmedContent)) return true;
      if (/end-to-end encryption/i.test(trimmedContent)) return true;
      
      // 日時のみの行 (例: 2026/01/11(日), 15:30, 15:30:00)
      if (/^\d{4}\/\d{1,2}\/\d{1,2}/.test(trimmedContent)) return true;
      if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(trimmedContent)) return true;

      return false;
    };

    const allUsers = Array.from(new Set(messages.map((m) => m.user)))
      .filter(name => name !== "システム" && name !== "");

    if (allUsers.length < 2) {
      throw new Error("分析には2人のユーザーが必要です。");
    }

    const user1Name = allUsers[0];
    const user2Name = allUsers[1];
    const filteredMessages = messages.filter(m => m.user === user1Name || m.user === user2Name);

    const wordCount1: { [key: string]: number } = {};
    const wordCount2: { [key: string]: number } = {};
    const emojiCount1: { [key: string]: number } = {}; // 絵文字集計用
    const emojiCount2: { [key: string]: number } = {}; // 絵文字集計用

    const stopWords = new Set([
      "の", "に", "は", "を", "た", "が", "で", "て", "と", "し", "れ", "さ", "ある", "いる", "も", "する", "から", "な", "こと", "として", "い", "や", "れる", "など", "なっ", "ない", "この", "ため", "その", "あの", "あれ", "それ", "これ", "どれ", "いつ", "どこ", "だれ", "なに", "なん", "です", "ます", "でした", "ました",
      "よ", "ね", "わ", "か", "けど", "けども", "ので", "のに", "だけ", "ばかり", "くらい", "ぐらい", "ほど", "まで", "よる", "より", "から", "へ",
      "null", "undefined", "emoji", "suparkle", "00", "アルバム", "応答", "なし", "通話", "不在", "着信", "ビデオ", "音声", "キャンセル",
      "スタンプ", "写真", "動画", "ファイル", "連絡", "位置", "情報", "ボイス", "メッセージ", "ショップ", "カード", "投票", "日程", "調整", "イベント", "リンク",
      "グループ", "退会", "参加", "招待", "削除", "変更", "ノート", "投稿", "修正", "作成", "追加",
      // 英語版キーワード
      "sticker", "photo", "image", "video", "file", "contact", "location", "voice", "message",
      "album", "note", "event", "call", "duration", "missed", "canceled", "answer", "reaction",
      "unsent", "encrypted", "letter", "sealing", "group", "joined", "left", "invited", "removed"
    ]);
    
    const isLink = (word: string): boolean => {
      if (/^https?:\/\//i.test(word)) return true;
      if (/^www\./i.test(word)) return true;
      if (/\.(com|net|org|jp|co\.jp|io|app|dev|me|tv|cc|info|biz|xyz)$/i.test(word)) return true;
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(word)) return true;
      if (/^[a-z0-9]{2,10}\.[a-z]{2,4}$/i.test(word)) return true;
      const urlKeywords = ['https', 'http', 'www', 'com', 'net', 'org', 'jp', 'io', 'app', 'dev', 'me', 'tv', 'cc', 'info', 'biz', 'xyz', 'bit', 'ly', 't', 'co', 'goo', 'gl', 'amzn', 'to'];
      if (urlKeywords.includes(word.toLowerCase())) return true;
      if (/^[a-z0-9]+\.[a-z0-9]+$/i.test(word)) return true;
      return false;
    };

    // 絵文字由来の英単語リスト（LINEが絵文字を英語名に変換したもの）
    const emojiEnglishNames = new Set([
      "heart", "sparkle", "sparkles", "smile", "laugh", "cry", "tears", "joy", "face", "grin", "wink", "kiss", "kissing",
      "thumbs", "up", "down", "ok", "hand", "wave", "clap", "pray", "fire", "star", "sun", "moon", 
      "cloud", "rain", "snow", "lightning", "rainbow", "flower", "rose", "tulip", "cherry", "blossom",
      "eyes", "eye", "nose", "mouth", "tongue", "ear", "muscle", "nail", "lips", "tooth", "bone",
      "sweat", "cold", "hot", "sick", "mask", "bandage", "sleeping", "zzz", "boom", "collision",
      "dizzy", "dash", "hole", "bomb", "speech", "thought", "anger", "exclamation", "question",
      "white", "black", "red", "orange", "yellow", "green", "blue", "purple", "brown", "circle",
      "square", "diamond", "small", "large", "musical", "note", "notes",
      "cat", "dog", "mouse", "hamster", "rabbit", "bear", "panda", "tiger", "lion", "cow", "pig",
      "frog", "monkey", "chicken", "penguin", "bird", "baby", "chick", "hatching", "duck", "eagle",
      "scream", "screaming", "flushed", "astonished", "worried", "confused", "relieved", "pensive",
      "sleepy", "tired", "sleeping", "anguished", "fearful", "weary", "triumph", "angry", "rage",
      "persevere", "disappointed", "sweat", "crying", "sob", "tired", "yawning", "steam", "exhaling",
      "thinking", "lying", "shushing", "hand", "over", "mouth", "yawning", "hugging", "smiling",
      "grinning", "beaming", "rofl", "laughing", "upside", "down", "melting", "winking", "blush",
      "halo", "hearts", "struck", "kissing", "relaxed", "satisfied", "stuck", "out", "tongue",
      "money", "hugging", "nerd", "sunglasses", "smirk", "unamused", "rolling", "grimacing",
      "expressionless", "neutral", "hushed", "frowning", "anguished", "open", "hushed", "astonished",
      "flushed", "pleading", "frowning", "slightly", "confounded", "disappointed", "worried",
      "triumph", "pout", "angry", "rage", "symbols", "cursing", "steam", "nose", "exploding",
      "flushed", "dizzy", "shaking", "cold", "hot", "party", "disguised", "pleading", "face",
      "with", "hand", "over", "mouth", "yawning", "lying", "shushing",
      "hello", "hi", "hey", "bye", "yay", "yeah", "yup", "nope", "wow", "omg", "lol", "lmao",
      "kitty", "cat", "kitten", "puppy", "doggy", "bunny", "piggy", "sheep", "goat", "horse"
    ]);

    // システムメッセージのキーワード（単語に含まれていたら除外、日英両対応）
    const systemMessageKeywords = [
      "利用していた", "端末から", "このメッセージは", "友だちに", "再送信", 
      "暗号化", "Letter", "Sealing", "encrypted", "end-to-end",
      "reacted", "unsent", "duration", "missed", "canceled"
    ];

    // ゴミ単語判定
    const isGarbage = (word: string): boolean => {
      if (word.length > 10) return true; // 10文字以上の単語は除外（システムメッセージの誤抽出を防ぐ）
      if (/^\d+$/.test(word)) return true; // 数字のみ
      if (/^[!-\/:-@\[-`\{-~、。！？・…]+$/.test(word)) return true; // 記号のみ
      if (["emoji", "suparkle", "null", "undefined"].includes(word.toLowerCase())) return true;
      if (/^\[.*\]$/.test(word)) return true; // [スタンプ]などを包括的に除外
      if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(word)) return true; // 時刻形式（秒対応）
      // LINEデコ文字（丸括弧形式）を除外
      if (lineDecoPattern.test(word)) return true;
      // 絵文字由来の英単語を除外（実際にトークで使った英単語は残す）
      if (emojiEnglishNames.has(word.toLowerCase())) return true;
      // システムメッセージのキーワードを含む単語を除外
      if (systemMessageKeywords.some(keyword => word.includes(keyword))) return true;
      return false;
    };

    // 絵文字抽出正規表現 (拡張版)
    const emojiRegexGlobal = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2190}-\u{21FF}\u{2300}-\u{23FF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FE0F}\u{200D}]+/gu;
    
    filteredMessages.forEach((msg) => {
      if (isSystemMessage(msg.content)) return;
      if (msg.isCall) return; // 通話メッセージは単語集計から除外
      
      const contentStr = msg.content.trim();
      // メディア代替テキストは単語集計から除外（スタンプ率には影響させない）
      const mediaPlaceholders = [
        "[スタンプ]", "[写真]", "[動画]", "[ファイル]", "[連絡先]",
        "[Sticker]", "[Photo]", "[Image]", "[Video]", "[File]", "[Contact]",
        "[Location]", "[Voice message]", "[位置情報]", "[ボイスメッセージ]",
        "[位置情報]", "[ボイスメッセージ]", "[ショップカード]",
        "[投票]", "[日程調整]", "[イベント]", "[リンク]", "[アルバム]"
      ];
      if (mediaPlaceholders.some(placeholder => contentStr.includes(placeholder))) {
        return;
      }
      
      if (!msg.isSticker && msg.content) {
        let content = msg.content;

        // 絵文字集計 (Intl.Segmenterを使用して正しく書記素クラスターを扱う)
        try {
            const segmenter = new Intl.Segmenter('ja', { granularity: 'grapheme' });
            const segments = segmenter.segment(content);
            const emojiTarget = msg.user === user1Name ? emojiCount1 : emojiCount2;

            for (const { segment } of segments) {
                // 絵文字範囲の文字のみカウント（制御文字などを除外）
                // ZWJを含む結合絵文字も1つのsegmentになっているため、その中に絵文字範囲の文字が含まれていればOK
                if (/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/u.test(segment)) {
                     const fixedChar = forceEmojiStyle(segment);
                     emojiTarget[fixedChar] = (emojiTarget[fixedChar] || 0) + 1;
                }
            }
        } catch (e) {
            // Intl.Segmenterがサポートされていない環境へのフォールバック（旧ロジック）
            console.warn("Intl.Segmenter not supported, falling back to regex match", e);
            const emojis = content.match(emojiRegexGlobal);
            if (emojis) {
                const emojiTarget = msg.user === user1Name ? emojiCount1 : emojiCount2;
                emojis.forEach(emojiSeq => {
                    Array.from(emojiSeq).forEach(char => {
                        if (/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/u.test(char)) {
                             const fixedChar = forceEmojiStyle(char);
                             emojiTarget[fixedChar] = (emojiTarget[fixedChar] || 0) + 1;
                        }
                    });
                });
            }
        }

        // 単語集計の前処理
        content = content.replace(/:[a-zA-Z_]+:/g, ' '); // :scream: 形式の絵文字記法を除去
        content = content.replace(/\[.*?\]/g, ' '); // ブラケット表現を除去
        content = content.replace(emojiRegexGlobal, ' '); // 絵文字を除去
        content = content.replace(/https?:\/\/[^\s]+/gi, ' ');
        content = content.replace(/www\.[^\s]+/gi, ' ');
        content = content.replace(/[a-z0-9]+\.[a-z]{2,}\/[^\s]*/gi, ' ');
        content = content.replace(/[^\s@]+@[^\s@]+\.[^\s@]+/gi, ' ');
        
        const words = content
          .replace(/[^\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\w]/g, " ") // 日本語と英数字を抽出
          .split(/\s+/)
          .filter((w) => w.length > 1 && !stopWords.has(w) && !isLink(w) && !isGarbage(w));
        
        const wordCount = msg.user === user1Name ? wordCount1 : wordCount2;
        
        words.forEach((word) => {
            wordCount[word] = (wordCount[word] || 0) + 1;
        });
      }
    });
    
    // 絵文字ランキングの生成
    const emojiRanking1 = Object.entries(emojiCount1)
      .map(([char, count]) => ({ char, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    const emojiRanking2 = Object.entries(emojiCount2)
      .map(([char, count]) => ({ char, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const wordRanking1 = Object.entries(wordCount1)
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    const wordRanking2 = Object.entries(wordCount2)
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    const wordRanking = {
      user1: wordRanking1,
      user2: wordRanking2,
      user1Name,
      user2Name,
    };

    const replyTimes: { [key: string]: number[] } = { [user1Name]: [], [user2Name]: [] };
    for (let i = 1; i < filteredMessages.length; i++) {
      const prevMsg = filteredMessages[i - 1];
      const currMsg = filteredMessages[i];
      if (isSystemMessage(prevMsg.content) || isSystemMessage(currMsg.content)) continue;
      if (prevMsg.user !== currMsg.user) {
        const timeDiff = currMsg.date.getTime() - prevMsg.date.getTime();
        const minutes = timeDiff / (1000 * 60);
        if (minutes > 0 && minutes < 1440) {
          if (replyTimes[currMsg.user]) {
            replyTimes[currMsg.user].push(minutes);
          }
        }
      }
    }
    const avgReplyTime1 = replyTimes[user1Name].length > 0
        ? replyTimes[user1Name].reduce((a, b) => a + b, 0) / replyTimes[user1Name].length
        : 0;
    const avgReplyTime2 = replyTimes[user2Name].length > 0
        ? replyTimes[user2Name].reduce((a, b) => a + b, 0) / replyTimes[user2Name].length
        : 0;

    const user1Messages = filteredMessages.filter((m) => m.user === user1Name && !isSystemMessage(m.content));
    const user2Messages = filteredMessages.filter((m) => m.user === user2Name && !isSystemMessage(m.content));
    
    const isStickerMessage = (content: string): boolean => {
      if (!content) return false;
      const trimmed = content.trim();
      return /^\[スタンプ\]$|^\[Sticker\]$/i.test(trimmed);
    };
    
    const user1StickerCount = user1Messages.filter((m) => isStickerMessage(m.content)).length;
    const user2StickerCount = user2Messages.filter((m) => isStickerMessage(m.content)).length;
    
    const emojiPattern = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2190}-\u{21FF}\u{2300}-\u{23FF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FE0F}\u{200D}]/u;
    const user1EmojiCount = user1Messages.filter((m) => {
      if (!m.content) return false;
      const content = m.content.trim();
      if (isStickerMessage(content)) return false;
      return emojiPattern.test(content);
    }).length;
    const user2EmojiCount = user2Messages.filter((m) => {
      if (!m.content) return false;
      const content = m.content.trim();
      if (isStickerMessage(content)) return false;
      return emojiPattern.test(content);
    }).length;

    const stickerRate1 = user1Messages.length > 0 ? (user1StickerCount / user1Messages.length) * 100 : 0;
    const stickerRate2 = user2Messages.length > 0 ? (user2StickerCount / user2Messages.length) * 100 : 0;
    const emojiRate1 = user1Messages.length > 0 ? (user1EmojiCount / user1Messages.length) * 100 : 0;
    const emojiRate2 = user2Messages.length > 0 ? (user2EmojiCount / user2Messages.length) * 100 : 0;

    const timeDistribution: { [key: number]: number } = {};
    for (let i = 0; i < 24; i++) {
      timeDistribution[i] = 0;
    }
    filteredMessages.forEach((msg) => {
      if (!isSystemMessage(msg.content)) {
        const hour = msg.date.getHours();
        timeDistribution[hour]++;
      }
    });
    const timeDistributionArray = Object.entries(timeDistribution)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => a.hour - b.hour);
      
    // 曜日別分析 (NEW)
    const dayOfWeekDistribution: { [key: string]: number } = {
        "日": 0, "月": 0, "火": 0, "水": 0, "木": 0, "金": 0, "土": 0
    };
    const days = ["日", "月", "火", "水", "木", "金", "土"];
    filteredMessages.forEach((msg) => {
        if (!isSystemMessage(msg.content)) {
            const day = days[msg.date.getDay()];
            dayOfWeekDistribution[day]++;
        }
    });
    const dayOfWeekDistributionArray = days.map(day => ({
        day,
        count: dayOfWeekDistribution[day]
    }));

    const messageRatio1 = user1Messages.length;
    const messageRatio2 = user2Messages.length;

    let chaserCount1 = 0;
    let chaserCount2 = 0;
    for (let i = 1; i < filteredMessages.length; i++) {
      const prevMsg = filteredMessages[i - 1];
      const currMsg = filteredMessages[i];
      if (isSystemMessage(prevMsg.content) || isSystemMessage(currMsg.content)) continue;
      if (prevMsg.user !== currMsg.user) {
        const timeDiff = currMsg.date.getTime() - prevMsg.date.getTime();
        const minutes = timeDiff / (1000 * 60);
        if (minutes >= 0 && minutes < 5) {
          if (currMsg.user === user1Name) {
            chaserCount1++;
          } else if (currMsg.user === user2Name) {
            chaserCount2++;
          }
        }
      }
    }

    const monthlyWords: { [key: string]: { [word: string]: number } } = {};
    filteredMessages.forEach((msg) => {
      if (isSystemMessage(msg.content)) return;
      if (msg.isCall) return; // 通話メッセージは除外
      const contentStr = msg.content.trim();
      // メディア代替テキストは単語集計から除外
      const mediaPlaceholders = [
        "[スタンプ]", "[写真]", "[動画]", "[ファイル]", "[連絡先]",
        "[Sticker]", "[Photo]", "[Image]", "[Video]", "[File]", "[Contact]",
        "[Location]", "[Voice message]", "[位置情報]", "[ボイスメッセージ]",
        "[位置情報]", "[ボイスメッセージ]", "[ショップカード]",
        "[投票]", "[日程調整]", "[イベント]", "[リンク]", "[アルバム]"
      ];
      if (mediaPlaceholders.some(placeholder => contentStr.includes(placeholder))) {
        return;
      }
      
      if (!msg.isSticker && msg.content) {
        const monthKey = `${msg.date.getFullYear()}-${String(msg.date.getMonth() + 1).padStart(2, "0")}`;
        if (!monthlyWords[monthKey]) {
          monthlyWords[monthKey] = {};
        }
        
        let content = msg.content;
        content = content.replace(/:[a-zA-Z_]+:/g, ' '); // :scream: 形式の絵文字記法を除去
        content = content.replace(/\[.*?\]/g, ' '); // ブラケット表現を除去
        content = content.replace(emojiRegexGlobal, ' '); // 絵文字を除去
        content = content.replace(/https?:\/\/[^\s]+/gi, ' ');
        content = content.replace(/www\.[^\s]+/gi, ' ');
        content = content.replace(/[a-z0-9]+\.[a-z]{2,}\/[^\s]*/gi, ' ');
        content = content.replace(/[^\s@]+@[^\s@]+\.[^\s@]+/gi, ' ');
        
        const words = content
          .replace(/[^\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\w]/g, " ") // 日本語と英数字を抽出
          .split(/\s+/)
          .filter((w) => w.length > 1 && !stopWords.has(w) && !isLink(w) && !isGarbage(w));
        words.forEach((word) => {
            monthlyWords[monthKey][word] = (monthlyWords[monthKey][word] || 0) + 1;
        });
      }
    });

    const wordOfTheYear: { month: string; words: { word: string; increase: number }[] }[] = [];
    const months = Object.keys(monthlyWords).sort();
    for (let i = 1; i < months.length; i++) {
      const currentMonth = months[i];
      const prevMonth = months[i - 1];
      const currentWords = monthlyWords[currentMonth];
      const prevWords = monthlyWords[prevMonth];
      const increases: { word: string; increase: number }[] = [];

      Object.keys(currentWords).forEach((word) => {
        const currentCount = currentWords[word];
        const prevCount = prevWords[word] || 0;
        const increase = currentCount - prevCount;
        
        if (prevCount > 0 && currentCount >= prevCount * 2 && increase >= 5) {
          increases.push({ word, increase });
        } else if (prevCount === 0 && currentCount >= 5) {
          increases.push({ word, increase: currentCount });
        }
      });

      if (increases.length > 0) {
        increases.sort((a, b) => b.increase - a.increase);
        wordOfTheYear.push({
          month: currentMonth,
          words: increases.slice(0, 5),
        });
      }
    }

    const laughterWords = ["笑", "ｗ", "w", "草", "爆笑", "www", "わら", "笑い", "笑顔", "😂", "😄", "😆"];
    const laughterCount1: { [key: string]: number } = {};
    const laughterCount2: { [key: string]: number } = {};
    let laughterTotal1 = 0;
    let laughterTotal2 = 0;

    user1Messages.forEach((msg) => {
      if (isSystemMessage(msg.content)) return;
      if (!msg.isSticker && msg.content) {
        laughterWords.forEach((word) => {
          const count = (msg.content.match(new RegExp(word, "g")) || []).length;
          if (count > 0) {
            laughterCount1[word] = (laughterCount1[word] || 0) + count;
            laughterTotal1 += count;
          }
        });
      }
    });

    user2Messages.forEach((msg) => {
      if (isSystemMessage(msg.content)) return;
      if (!msg.isSticker && msg.content) {
        laughterWords.forEach((word) => {
          const count = (msg.content.match(new RegExp(word, "g")) || []).length;
          if (count > 0) {
            laughterCount2[word] = (laughterCount2[word] || 0) + count;
            laughterTotal2 += count;
          }
        });
      }
    });

    const laughterRate1 = user1Messages.length > 0 ? (laughterTotal1 / user1Messages.length) * 100 : 0;
    const laughterRate2 = user2Messages.length > 0 ? (laughterTotal2 / user2Messages.length) * 100 : 0;

    const replyDistribution1: { [key: string]: number } = {
      "5分以内": 0,
      "30分以内": 0,
      "1時間以内": 0,
      "3時間以内": 0,
      "1日以内": 0,
      "1日以上": 0,
    };
    const replyDistribution2: { [key: string]: number } = {
      "5分以内": 0,
      "30分以内": 0,
      "1時間以内": 0,
      "3時間以内": 0,
      "1日以内": 0,
      "1日以上": 0,
    };

    for (let i = 1; i < filteredMessages.length; i++) {
      const prevMsg = filteredMessages[i - 1];
      const currMsg = filteredMessages[i];
      if (isSystemMessage(prevMsg.content) || isSystemMessage(currMsg.content)) continue;
      if (prevMsg.user !== currMsg.user) {
        const timeDiff = currMsg.date.getTime() - prevMsg.date.getTime();
        const minutes = timeDiff / (1000 * 60);
        const hours = minutes / 60;
        const days = hours / 24;

        let range: string;
        if (minutes <= 5) {
          range = "5分以内";
        } else if (minutes <= 30) {
          range = "30分以内";
        } else if (hours <= 1) {
          range = "1時間以内";
        } else if (hours <= 3) {
          range = "3時間以内";
        } else if (days <= 1) {
          range = "1日以内";
        } else {
          range = "1日以上";
        }

        if (currMsg.user === user1Name) {
          replyDistribution1[range]++;
        } else if (currMsg.user === user2Name) {
          replyDistribution2[range]++;
        }
      }
    }

    const greetingPatterns = {
      goodMorning: /^(おはよう|おは|おはー|おはよ|おっはー|おっは|おはようございます)/i,
      goodNight: /^(おやすみ|おやす|おやすー|おやすみなさい|おやすみー|おやす|おやっす)/i,
    };

    let goodMorning1 = 0;
    let goodNight1 = 0;
    let goodMorning2 = 0;
    let goodNight2 = 0;

    filteredMessages.forEach((msg) => {
      if (isSystemMessage(msg.content)) return;
      if (!msg.isSticker && msg.content) {
        const content = msg.content.trim();
        if (greetingPatterns.goodMorning.test(content)) {
          if (msg.user === user1Name) {
            goodMorning1++;
          } else {
            goodMorning2++;
          }
        }
        if (greetingPatterns.goodNight.test(content)) {
          if (msg.user === user1Name) {
            goodNight1++;
          } else {
            goodNight2++;
          }
        }
      }
    });
    
    // 愛してるよ分析 (NEW)
    let loveCount1 = 0;
    let loveCount2 = 0;
    const loveKeywords = ["愛してる", "愛してます", "愛しています", "大好き", "すきだよ", "好きだよ", "love you", "love u", "あいしてる", "ずっと一緒"];
    
    filteredMessages.forEach((msg) => {
        if (isSystemMessage(msg.content)) return;
        if (!msg.isSticker && msg.content) {
            const content = msg.content.trim();
            // 単純なキーワードマッチ + "〜が好き"の除外
            const hasLoveKeyword = loveKeywords.some(kw => content.includes(kw));
            if (hasLoveKeyword) {
                // "映画が好き"などの文脈を除外するための簡易チェック
                // ひらがなの「が」の直後に「好き」「大好き」が来るパターンを警戒
                if (/が(?:大?好き|すき)/.test(content) && !/(?:君|あなた|お前)が(?:大?好き|すき)/.test(content)) {
                    // "君が好き"以外で"が"がつく場合はカウントしない（誤検知防止のため厳しめに）
                    return;
                }
                
                if (msg.user === user1Name) loveCount1++;
                else loveCount2++;
            }
        }
    });

    let longest1 = { length: 0, content: "", date: "" };
    let longest2 = { length: 0, content: "", date: "" };

    const containsUrlOrPlaceholder = (content: string): boolean => {
      if (isSystemMessage(content)) return true;
      if (/https?:\/\//i.test(content)) return true;
      if (/www\./i.test(content)) return true;
      if (/[a-z0-9]+\.[a-z]{2,}\//i.test(content)) return true;
      if (/[^\s@]+@[^\s@]+\.[^\s@]+/i.test(content)) return true;
      return false;
    };

    user1Messages.forEach((msg) => {
      if (isSystemMessage(msg.content) || containsUrlOrPlaceholder(msg.content)) return;
      if (!msg.isSticker && msg.content && msg.content.length > longest1.length) {
        longest1 = {
          length: msg.content.length,
          content: msg.content.length > 100 ? msg.content.substring(0, 100) + "..." : msg.content,
          date: msg.date.toLocaleDateString("ja-JP"),
        };
      }
    });

    user2Messages.forEach((msg) => {
      if (isSystemMessage(msg.content) || containsUrlOrPlaceholder(msg.content)) return;
      if (!msg.isSticker && msg.content && msg.content.length > longest2.length) {
        longest2 = {
          length: msg.content.length,
          content: msg.content.length > 100 ? msg.content.substring(0, 100) + "..." : msg.content,
          date: msg.date.toLocaleDateString("ja-JP"),
        };
      }
    });

    let totalCallDuration = 0; 
    let totalCalls = 0;
    let user1Calls = 0; // NEW
    let user2Calls = 0; // NEW

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      if (msg.isCall && (msg.user === user1Name || msg.user === user2Name)) {
        if (msg.user === user1Name) user1Calls++;
        else user2Calls++;

        if (msg.content.includes("不在着信")) {
          totalCalls++;
          continue;
        }
        
        totalCalls++;
        let duration = msg.callDuration;
        if (duration === undefined || duration === 0) {
          duration = parseCallDuration(msg.content);
        }
        
        if (duration > 0) {
          totalCallDuration += duration;
        }
      }
    }

    const averageCallDuration = totalCalls > 0 
      ? Math.floor(totalCallDuration / totalCalls) 
      : 0;

    // ========================================
    // 12型分類ロジック
    // ========================================
    
    // 有効メッセージ数の計算（システムメッセージ除外済み）
    const validMessages = filteredMessages.filter(m => !isSystemMessage(m.content));
    const totalValidMessages = validMessages.length;
    
    // A. 比率（Balance）の計算
    // 各ユーザーの総文字数を計算（システムメッセージ、通話メッセージ除外）
    let userAChars = 0;
    let userBChars = 0;
    validMessages.forEach(m => {
      if (m.isCall) return; // 通話メッセージ除外
      const charCount = m.content.length;
      if (m.user === user1Name) {
        userAChars += charCount;
      } else {
        userBChars += charCount;
      }
    });
    const totalChars = userAChars + userBChars;
    const balanceRate = totalChars > 0 
      ? Math.max(userAChars, userBChars) / totalChars 
      : 0;
    const balanceJudgment: 'equal' | 'bias' = balanceRate >= RELATIONSHIP_THRESHOLDS.BIAS_THRESHOLD 
      ? 'bias' 
      : 'equal';
    
    // B. 速度（Tempo）の計算
    // 返信時間の計算（相手の最後のメッセージからの差分）
    let highSpeedReplyCount = 0;
    let totalReplyMinutes = 0;
    let validReplyCount = 0;
    
    for (let i = 1; i < validMessages.length; i++) {
      const currentMsg = validMessages[i];
      const prevMsg = validMessages[i - 1];
      
      // 異なるユーザー間のメッセージのみを「返信」としてカウント
      if (currentMsg.user !== prevMsg.user) {
        const diffMs = currentMsg.date.getTime() - prevMsg.date.getTime();
        const diffMinutes = diffMs / (1000 * 60);
        
        // 24時間以上の間隔は返信としてカウントしない（日をまたいだ会話の開始）
        if (diffMinutes < 1440) {
          validReplyCount++;
          totalReplyMinutes += diffMinutes;
          
          if (diffMinutes <= RELATIONSHIP_THRESHOLDS.HIGH_SPEED_MINUTES) {
            highSpeedReplyCount++;
          }
        }
      }
    }
    
    const highSpeedReplyRate = validReplyCount > 0 
      ? highSpeedReplyCount / validReplyCount 
      : 0;
    const avgReplyMinutes = validReplyCount > 0 
      ? totalReplyMinutes / validReplyCount 
      : 0;
    
    // 速度判定: 高速 or 悠々（中間も悠々として処理）
    let tempoJudgment: 'highSpeed' | 'leisurely';
    if (highSpeedReplyRate >= RELATIONSHIP_THRESHOLDS.HIGH_SPEED_RATE_THRESHOLD) {
      tempoJudgment = 'highSpeed';
    } else {
      tempoJudgment = 'leisurely'; // 中間も悠々として処理
    }
    
    // C. 質感（Expression）の計算
    // 平均文字数の計算（テキストメッセージのみ）
    const textMessages = validMessages.filter(m => !m.isCall && !m.isSticker);
    const totalTextChars = textMessages.reduce((sum, m) => sum + m.content.length, 0);
    const avgCharCount = textMessages.length > 0 
      ? totalTextChars / textMessages.length 
      : 0;
    
    // メディア要素のカウント（スタンプ、写真、動画、リアクション）
    // スタンプはisSticker、その他は[写真][動画]等のプレースホルダーで判定
    const mediaPlaceholders = [
      "[スタンプ]", "[写真]", "[動画]", "[ファイル]",
      "[Sticker]", "[Photo]", "[Image]", "[Video]", "[File]",
      "[ボイスメッセージ]", "[Voice message]"
    ];
    let mediaCount = 0;
    validMessages.forEach(m => {
      if (m.isSticker) {
        mediaCount++;
      } else if (mediaPlaceholders.some(p => m.content.includes(p))) {
        mediaCount++;
      }
      // リアクションは別途カウント（システムメッセージとして除外されているが、念のため）
    });
    const mediaRate = totalValidMessages > 0 
      ? mediaCount / totalValidMessages 
      : 0;
    
    // 質感判定: 物語 > 共鳴 > 平穏（優先順位あり）
    let expressionJudgment: 'story' | 'resonance' | 'peace';
    if (avgCharCount >= RELATIONSHIP_THRESHOLDS.STORY_AVG_CHARS) {
      expressionJudgment = 'story'; // 物語を優先
    } else if (mediaRate >= RELATIONSHIP_THRESHOLDS.RESONANCE_MEDIA_RATE) {
      expressionJudgment = 'resonance';
    } else {
      expressionJudgment = 'peace';
    }
    
    // 12型分類の決定
    let relationshipTypeKey: string;
    let relationshipTypeData: { name: string; emoji: string; description: string; detailedDescription: string; image: string };
    
    if (totalValidMessages < RELATIONSHIP_THRESHOLDS.MIN_MESSAGES_FOR_ANALYSIS) {
      // 100件未満は「卵タイプ」
      relationshipTypeKey = 'egg';
      relationshipTypeData = RELATIONSHIP_TYPES['egg'];
    } else {
      // マトリクスから分類を決定
      relationshipTypeKey = `${balanceJudgment}_${tempoJudgment}_${expressionJudgment}`;
      relationshipTypeData = RELATIONSHIP_TYPES[relationshipTypeKey] || RELATIONSHIP_TYPES['egg'];
    }
    
    // bias系タイプの場合、{user1}と{user2}を動的に置換
    // user1 = 送信量が多い方、user2 = 送信量が少ない方
    let finalDescription = relationshipTypeData.description;
    let finalDetailedDescription = relationshipTypeData.detailedDescription;
    
    if (balanceJudgment === 'bias') {
      // 送信量が多い方をuser1、少ない方をuser2として設定
      const biasUser1Name = userAChars >= userBChars ? user1Name : user2Name;
      const biasUser2Name = userAChars >= userBChars ? user2Name : user1Name;
      
      finalDescription = finalDescription.replace(/{user1}/g, biasUser1Name).replace(/{user2}/g, biasUser2Name);
      finalDetailedDescription = finalDetailedDescription.replace(/{user1}/g, biasUser1Name).replace(/{user2}/g, biasUser2Name);
    } else {
      // equal系タイプやeggタイプの場合も{user1}と{user2}を置換（順序は問わない）
      finalDescription = finalDescription.replace(/{user1}/g, user1Name).replace(/{user2}/g, user2Name);
      finalDetailedDescription = finalDetailedDescription.replace(/{user1}/g, user1Name).replace(/{user2}/g, user2Name);
    }
    
    // 選ばれた理由を生成（卵タイプは除外）
    const generateReason = (
      balanceJudgment: 'equal' | 'bias',
      tempoJudgment: 'highSpeed' | 'leisurely',
      expressionJudgment: 'story' | 'resonance' | 'peace',
      typeKey: string
    ): string => {
      // 卵タイプの場合は空文字列を返す
      if (typeKey === 'egg') {
        return '';
      }
      
      const balanceType = balanceJudgment === 'equal' ? 'バランス型' : '偏り型';
      const tempoType = tempoJudgment === 'highSpeed' ? '高速型' : 'まったり型';
      const expressionType = 
        expressionJudgment === 'story' ? '長文型' :
        expressionJudgment === 'resonance' ? 'メディア型' :
        '短文型';
      
      return `このタイプが選ばれたペアは...\nメッセージ比率：${balanceType}\n返信スピード：${tempoType}\n表現スタイル：${expressionType}`;
    };
    
    const reason = generateReason(balanceJudgment, tempoJudgment, expressionJudgment, relationshipTypeKey);
    
    const relationshipType = {
      resultType: relationshipTypeData.name,
      description: finalDescription,
      detailedDescription: finalDetailedDescription,
      emoji: relationshipTypeData.emoji,
      image: relationshipTypeData.image,
      reason: reason,
      metrics: {
        balanceRate: Math.round(balanceRate * 100) / 100,
        highSpeedReplyRate: Math.round(highSpeedReplyRate * 100) / 100,
        avgReplyMinutes: Math.round(avgReplyMinutes),
        avgCharCount: Math.round(avgCharCount * 10) / 10,
        mediaRate: Math.round(mediaRate * 100) / 100,
      },
      judgments: {
        balance: balanceJudgment,
        tempo: tempoJudgment,
        expression: expressionJudgment,
      },
      rawStats: {
        totalMessages: totalValidMessages,
        userAChars,
        userBChars,
        totalMediaCount: mediaCount,
        validReplyCount,
      },
    };

    return {
      wordRanking,
      emojiRanking: {
        user1: emojiRanking1,
        user2: emojiRanking2,
      },
      replySpeed: {
        user1: avgReplyTime1,
        user2: avgReplyTime2,
        user1Name,
        user2Name,
      },
      stickerRate: { user1: stickerRate1, user2: stickerRate2 },
      emojiRate: { user1: emojiRate1, user2: emojiRate2 },
      timeDistribution: timeDistributionArray,
      dayOfWeekDistribution: dayOfWeekDistributionArray,
      messageRatio: {
        user1: messageRatio1,
        user2: messageRatio2,
        user1Name,
        user2Name,
      },
      chaserRanking: {
        user1: chaserCount1,
        user2: chaserCount2,
        user1Name,
        user2Name,
      },
      wordOfTheYear,
      laughterAnalysis: {
        user1: {
          total: laughterTotal1,
          rate: laughterRate1,
          words: Object.entries(laughterCount1)
            .map(([word, count]) => ({ word, count }))
            .sort((a, b) => b.count - a.count),
        },
        user2: {
          total: laughterTotal2,
          rate: laughterRate2,
          words: Object.entries(laughterCount2)
            .map(([word, count]) => ({ word, count }))
            .sort((a, b) => b.count - a.count),
        },
        user1Name,
        user2Name,
      },
      replyTimeDistribution: {
        user1: Object.entries(replyDistribution1).map(([range, count]) => ({ range, count })),
        user2: Object.entries(replyDistribution2).map(([range, count]) => ({ range, count })),
        user1Name,
        user2Name,
      },
      greetingAnalysis: {
        user1: { goodMorning: goodMorning1, goodNight: goodNight1 },
        user2: { goodMorning: goodMorning2, goodNight: goodNight2 },
        user1Name,
        user2Name,
      },
      longestMessage: {
        user1: longest1,
        user2: longest2,
        user1Name,
        user2Name,
      },
      callAnalysis: {
        totalCalls: totalCalls,
        totalDuration: totalCallDuration,
        averageDuration: averageCallDuration,
        user1Name,
        user2Name,
        user1Calls,
        user2Calls
      },
      loveCallAnalysis: {
          user1: loveCount1,
          user2: loveCount2,
          user1Name,
          user2Name
      },
      relationshipType,
    };
  };

  // 文字コード自動判別でファイルを読み込む
  const readFileWithAutoEncoding = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    
    // BOMの検出
    const hasBOM = bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF;
    
    // まずUTF-8として読み込みを試行
    try {
      const decoder = new TextDecoder('utf-8', { fatal: true });
      const text = decoder.decode(buffer);
      // BOMを除去
      return hasBOM ? text.slice(1) : text;
    } catch {
      // UTF-8で失敗した場合、Shift-JISとして読み込む
      try {
        const decoder = new TextDecoder('shift-jis', { fatal: false });
        return decoder.decode(buffer);
      } catch {
        // Shift-JISも失敗した場合、Windows-1252として読み込む
        const decoder = new TextDecoder('windows-1252', { fatal: false });
        return decoder.decode(buffer);
      }
    }
  };

  const handleAnalyzeFile = async (file: File) => {
    // 分析開始時に画面トップにスクロール（アニメーションを確実に表示するため）
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    setIsAnalyzing(true);
    setResults(null);

    try {
      const text = await readFileWithAutoEncoding(file);
      const messages = parseLineTalkHistory(text);
      
      if (messages.length === 0) {
        toast({
          title: "エラー",
          description: "メッセージが見つかりませんでした。正しいLINEトーク履歴ファイルか確認してください。",
          variant: "destructive",
        });
        setIsAnalyzing(false);
        return;
      }
      
      // 分析中の演出のために少し待機
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const analysisResult = await analyzeMessages(messages);
      
      // 分析回数をカウント（エラーが発生しても分析結果は表示）
      try {
        const response = await fetch('/api/analytics/count', { method: 'POST' });
        if (response.ok) {
          const data = await response.json();
          setAnalysisCount(data.count);
        }
      } catch (err) {
        // カウントエラーは無視（分析結果は表示する）
        console.error('Failed to increment analysis count:', err);
      }
      
      // 分析完了：まず結果をセットしてからShine.gifを表示
      // これにより、GIFの背景が結果ページになる
      setResults(analysisResult);
      setIsAnalyzing(false);
      setIsShowingSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // 2.5秒後にShine.gifを非表示
      setTimeout(() => {
        setIsShowingSuccess(false);
      }, 2500);
      
    } catch (err) {
      console.error("分析エラー:", err);
      toast({
        title: "エラー",
        description: err instanceof Error ? err.message : "分析中にエラーが発生しました",
        variant: "destructive",
      });
      setIsAnalyzing(false);
    }
  };

  const formatMinutes = (minutes: number): string => {
    if (minutes < 60) {
      return `${Math.round(minutes)}分`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}時間${mins > 0 ? `${mins}分` : ""}`;
  };

  const AnalyzingOverlay = () => {
    const [messageIndex, setMessageIndex] = useState(0);
    const [mounted, setMounted] = useState(false);
    const messages = [
      "トーク履歴を読み込んでいます...",
      "二人の思い出を整理中...",
      "メッセージの傾向を分析しています...",
      "もうすぐ結果が出ます！"
    ];

    useEffect(() => {
      setMounted(true);
      const interval = setInterval(() => {
        setMessageIndex((prev) => (prev + 1) % messages.length);
      }, 1500);

      return () => {
        clearInterval(interval);
      };
    }, []);

    // サーバーサイドレンダリング時はnullを返す
    if (!mounted) return null;

    const overlayContent = (
      <div 
        id="analyzing-overlay-portal"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 2147483647, // 最大値
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          boxSizing: 'border-box',
        }}
      >
        {/* 背景オーバーレイ - 画面全体を暗転 */}
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
          }}
        />
        
        {/* ポップアップカード - 画面中央 */}
        <div 
          style={{
            position: 'relative',
            backgroundColor: 'white',
            borderRadius: '24px',
            padding: '32px 24px',
            maxWidth: '320px',
            width: '90%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          }}
        >
          {/* ローディングアニメーション */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <div style={{ position: 'relative', width: '72px', height: '72px' }}>
              {/* 外側の回転するリング */}
              <div 
                style={{
                  position: 'absolute',
                  top: '-6px',
                  left: '-6px',
                  right: '-6px',
                  bottom: '-6px',
                  borderRadius: '50%',
                  border: '3px solid transparent',
                  borderTopColor: '#06b6d4', // cyan-500
                  borderRightColor: '#06b6d4',
                  animation: 'analyzing-spin 1.5s linear infinite',
                }}
              />
              <div 
                style={{
                  position: 'absolute',
                  top: '-10px',
                  left: '-10px',
                  right: '-10px',
                  bottom: '-10px',
                  borderRadius: '50%',
                  border: '3px solid transparent',
                  borderBottomColor: '#22d3ee', // cyan-400
                  borderLeftColor: '#22d3ee',
                  animation: 'analyzing-spin 2.5s linear infinite reverse',
                }}
              />
              
              {/* 中央のアイコン */}
              <div 
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #cffafe, #ecfeff)', // cyan-100 to cyan-50
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sparkles style={{ width: '28px', height: '28px', color: '#06b6d4' }} />
              </div>
            </div>
          </div>

          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', marginBottom: '6px', textAlign: 'center' }}>
            あんしん分析中
          </h3>
          <p style={{ color: '#64748b', minHeight: '20px', fontSize: '13px', textAlign: 'center', marginBottom: '20px' }}>
            {messages[messageIndex]}
          </p>
          
          {/* プライバシー保護メッセージ */}
          <div style={{ backgroundColor: '#ecfeff', borderRadius: '12px', padding: '12px', border: '1px solid #cffafe' }}>
            <p style={{ fontSize: '11px', color: '#475569', textAlign: 'center', lineHeight: '1.5', margin: 0 }}>
              <span style={{ fontWeight: 'bold', color: '#0891b2', display: 'block', marginBottom: '4px' }}>プライバシー保護</span>
              トーク内容はサーバーに保存されません。<br/>
              ページを更新すると結果が消えてしまうので<br/>
              シェアしたいところはスクショで保存してね！
            </p>
          </div>
        </div>
        
        {/* スピンアニメーション用のスタイル */}
        <style>{`
          @keyframes analyzing-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );

    // createPortalでdocument.bodyの直下にレンダリング
    return createPortal(overlayContent, document.body);
  };

  // 分析完了アニメーションオーバーレイ
  const SuccessOverlay = () => {
    const [mounted, setMounted] = useState(false);
    const [fadeOut, setFadeOut] = useState(false);

    useEffect(() => {
      setMounted(true);
      // 2秒後にフェードアウト開始
      const timer = setTimeout(() => {
        setFadeOut(true);
      }, 2000);
      
      return () => clearTimeout(timer);
    }, []);

    if (!mounted) return null;

    const overlayContent = (
      <div 
        id="success-overlay-portal"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 2147483647,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          animation: fadeOut ? 'successFadeOut 0.5s ease-out forwards' : 'successFadeIn 0.3s ease-out',
        }}
      >
        <div 
          style={{
            textAlign: 'center',
            animation: fadeOut ? 'successZoomOut 0.5s ease-out' : 'successZoomIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          {/* Shine GIF */}
          <div style={{ marginBottom: '24px' }}>
            <img 
              src="/talklens/Shine.gif" 
              alt="分析完了" 
              style={{ 
                width: '200px',
                height: '200px',
                objectFit: 'contain',
                filter: 'drop-shadow(0 10px 30px rgba(6, 182, 212, 0.3))',
              }}
            />
          </div>
          
          {/* テキスト */}
          <h2 
            style={{ 
              fontSize: '32px',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '12px',
            }}
          >
            分析完了！
          </h2>
        </div>

        {/* アニメーション用のスタイル */}
        <style>{`
          @keyframes successFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes successFadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
          }
          @keyframes successZoomIn {
            from { 
              transform: scale(0.5);
              opacity: 0;
            }
            to { 
              transform: scale(1);
              opacity: 1;
            }
          }
          @keyframes successZoomOut {
            from { 
              transform: scale(1);
              opacity: 1;
            }
            to { 
              transform: scale(0.9);
              opacity: 0;
            }
          }
        `}</style>
      </div>
    );

    return createPortal(overlayContent, document.body);
  };

  const MessageRatioChart = ({ data }: { data: { user1: number; user2: number; user1Name: string; user2Name: string } }) => {
    const total = data.user1 + data.user2;
    const user1Percent = total > 0 ? Math.round((data.user1 / total) * 100) : 0;
    const user2Percent = total > 0 ? Math.round((data.user2 / total) * 100) : 0;

    return (
      <div className="space-y-6">
        {/* User 1 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600">{data.user1Name}</span>
            <span className="text-2xl font-bold text-primary">{user1Percent}%</span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-sky-400 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${user1Percent}%` }}
            />
          </div>
        </div>

        {/* User 2 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600">{data.user2Name}</span>
            <span className="text-2xl font-bold text-slate-500">{user2Percent}%</span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-slate-400 to-slate-300 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${user2Percent}%` }}
            />
          </div>
        </div>

        {/* Total Messages */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">合計メッセージ数</span>
            <span className="font-bold text-foreground">{total.toLocaleString()}件</span>
          </div>
        </div>
      </div>
    );
  };

  // 隠しコマンド：分析回数表示モーダル（共通で表示）
  const AdminStatsModal = () => {
    if (!showAdminStats) return null;

    // 折れ線グラフの描画用データを準備
    const maxCount = dailyData.length > 0 ? Math.max(...dailyData.map(d => d.count), 1) : 1;
    const chartWidth = 600;
    const chartHeight = 200;
    const padding = 40;
    const graphWidth = chartWidth - padding * 2;
    const graphHeight = chartHeight - padding * 2;

    // 折れ線のパスを生成
    const points = dailyData.map((d, i) => {
      const x = padding + (i / (dailyData.length - 1 || 1)) * graphWidth;
      const y = padding + graphHeight - (d.count / maxCount) * graphHeight;
      return `${x},${y}`;
    }).join(' ');

    return createPortal(
      <div 
        className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={() => setShowAdminStats(false)}
      >
        <div 
          className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-6 text-center relative">
            <button 
              onClick={() => setShowAdminStats(false)}
              className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
            <h2 className="text-2xl font-black text-white mb-2">📊 分析統計</h2>
            <p className="text-white/90 text-sm">本番環境での分析実行回数</p>
          </div>
          <div className="p-8">
            {/* 総計とMAU */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center p-4 bg-purple-50 rounded-xl">
                <p className="text-sm text-slate-600 mb-2">総分析回数</p>
                <div className="text-3xl font-black text-purple-600">
                  {analysisCount !== null ? analysisCount.toLocaleString() : '---'}
                </div>
              </div>
              <div className="text-center p-4 bg-pink-50 rounded-xl">
                <p className="text-sm text-slate-600 mb-2">MAU（過去30日）</p>
                <div className="text-3xl font-black text-pink-600">
                  {mau !== null ? mau.toLocaleString() : '---'}
                </div>
              </div>
            </div>

            {/* 折れ線グラフ */}
            {dailyData.length > 0 && (
              <div className="mb-4">
                <h3 className="text-lg font-bold text-slate-800 mb-4 text-center">過去30日間の分析回数推移</h3>
                <div className="bg-slate-50 rounded-xl p-4 overflow-x-auto">
                  <svg width={chartWidth} height={chartHeight} className="w-full" viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
                    {/* グリッド線 */}
                    {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                      const y = padding + graphHeight - (ratio * graphHeight);
                      return (
                        <line
                          key={ratio}
                          x1={padding}
                          y1={y}
                          x2={padding + graphWidth}
                          y2={y}
                          stroke="#e2e8f0"
                          strokeWidth="1"
                        />
                      );
                    })}
                    
                    {/* 折れ線 */}
                    {dailyData.length > 1 && (
                      <polyline
                        points={points}
                        fill="none"
                        stroke="#8b5cf6"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}
                    
                    {/* データポイント */}
                    {dailyData.map((d, i) => {
                      const x = padding + (i / (dailyData.length - 1 || 1)) * graphWidth;
                      const y = padding + graphHeight - (d.count / maxCount) * graphHeight;
                      return (
                        <circle
                          key={i}
                          cx={x}
                          cy={y}
                          r="4"
                          fill="#8b5cf6"
                        />
                      );
                    })}
                    
                    {/* X軸ラベル（日付） */}
                    {dailyData.length > 0 && dailyData.map((d, i) => {
                      if (i % 5 !== 0 && i !== dailyData.length - 1) return null;
                      const x = padding + (i / (dailyData.length - 1 || 1)) * graphWidth;
                      const date = new Date(d.date);
                      const month = date.getMonth() + 1;
                      const day = date.getDate();
                      return (
                        <text
                          key={i}
                          x={x}
                          y={chartHeight - 10}
                          textAnchor="middle"
                          className="text-xs fill-slate-600"
                        >
                          {`${month}/${day}`}
                        </text>
                      );
                    })}
                    
                    {/* Y軸ラベル */}
                    {[0, 0.5, 1].map((ratio) => {
                      const y = padding + graphHeight - (ratio * graphHeight);
                      const value = Math.round(ratio * maxCount);
                      return (
                        <text
                          key={ratio}
                          x={padding - 10}
                          y={y + 4}
                          textAnchor="end"
                          className="text-xs fill-slate-600"
                        >
                          {value}
                        </text>
                      );
                    })}
                  </svg>
                </div>
              </div>
            )}

            <p className="text-xs text-slate-400 text-center mt-4">（Ctrl+Shift+A で再表示）</p>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  if (results) {
    return (
      <>
        {isShowingSuccess && <SuccessOverlay />}
        <div className="min-h-screen animate-fade-in-up" style={{ backgroundColor: '#F0F8FF' }}>
        {/* リッチなヘッダー - 動的エフェクト付き */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#00BFFF] via-[#00D4FF] to-[#00A0E9] pb-20 pt-10 md:pt-14 shadow-xl">
          {/* 流れるグラデーションオーバーレイ */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20" />
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          {/* 浮遊するパーティクル */}
          <div className="absolute top-20 left-10 w-3 h-3 bg-white/30 rounded-full animate-float" />
          <div className="absolute top-32 right-20 w-2 h-2 bg-white/20 rounded-full animate-float" style={{ animationDelay: '0.5s' }} />
          <div className="absolute bottom-20 left-1/3 w-4 h-4 bg-white/20 rounded-full animate-float" style={{ animationDelay: '1s' }} />
          
          <div className="relative max-w-5xl mx-auto px-4">
            <div className="flex flex-col items-center text-center gap-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-white text-sm font-medium border border-white/30 shadow-sm animate-fade-in-up">
                <Sparkles className="w-4 h-4 text-yellow-300" />
                <span>分析完了</span>
              </div>
              
              <div className="space-y-3 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white drop-shadow-md">
                  分析結果
                </h1>
                <p className="text-white text-lg md:text-xl font-medium max-w-md mx-auto">
                  二人のLINEトークの傾向を分析しました
                </p>
              </div>

            </div>
          </div>
        </div>
        
        <div className="max-w-5xl mx-auto px-4 pb-12 space-y-6 -mt-8 relative z-10">

          {/* 12型分類結果 - 最上部に表示 */}
          <FadeIn delay={0}>
          <div className="bg-white rounded-3xl p-8 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 text-center border border-slate-100">
            <div className="flex flex-col items-center justify-center gap-6 mb-6">
              {/* キャラクター画像 */}
              <div className="w-72 h-72 relative">
                <img 
                  src={results.relationshipType.image} 
                  alt={results.relationshipType.resultType}
                  className="w-full h-full object-contain drop-shadow-xl"
                />
              </div>
              
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-50 rounded-full text-cyan-600 text-sm font-bold mb-2">
                  <Heart className="w-4 h-4 fill-current animate-pulse" />
                  <span>関係性タイプ</span>
                </div>
                <h3 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                  {results.relationshipType.resultType}
                </h3>
                <p className="text-slate-600 font-medium text-lg max-w-lg mx-auto leading-relaxed">
                  {/* スマホでの改行を最適化 */}
                  <span className="hidden md:inline">{results.relationshipType.description}</span>
                  <span className="md:hidden">
                    {results.relationshipType.description.replace(/、/g, '、\n').split('\n').map((line, i, arr) => (
                      <React.Fragment key={i}>
                        {line}{i < arr.length - 1 && <br />}
                      </React.Fragment>
                    ))}
                  </span>
                </p>
              </div>
            </div>
            
            {/* 診断結果の説明文 */}
            <div className="bg-cyan-50/50 rounded-xl p-6 mt-4 border border-cyan-100">
              <p className="text-slate-700 leading-relaxed text-base text-center whitespace-pre-line">
                {results.relationshipType.detailedDescription}
              </p>
            </div>
            
            {/* 選ばれた理由（卵タイプは除外） */}
            {results.relationshipType.reason && (
              <div className="bg-amber-50 rounded-xl p-6 mt-4 border-2 border-amber-200">
                <p className="text-slate-700 leading-relaxed text-sm whitespace-pre-line">
                  {results.relationshipType.reason}
                </p>
              </div>
            )}
          </div>
          </FadeIn>

          {/* メッセージ比率 - FeaturesSectionと同じデザイン */}
          <FadeIn delay={100}>
          <div className="bg-feature-bg rounded-3xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10">
            <div className="bg-card rounded-2xl p-4 mb-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-foreground">メッセージ比率</span>
              </div>
              {(() => {
                const total = results.messageRatio.user1 + results.messageRatio.user2;
                const user1Percent = total > 0 ? Math.round((results.messageRatio.user1 / total) * 100) : 0;
                const user2Percent = total > 0 ? Math.round((results.messageRatio.user2 / total) * 100) : 0;
                return (
                  <>
                    <div className="flex gap-2 mb-2">
                      <div className="h-3 bg-primary rounded-full transition-all duration-1000" style={{ flex: user1Percent }} />
                      <div className="h-3 bg-primary/40 rounded-full transition-all duration-1000" style={{ flex: user2Percent }} />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{results.messageRatio.user1Name} {user1Percent}%</span>
                      <span>{results.messageRatio.user2Name} {user2Percent}%</span>
                    </div>
                  </>
                );
              })()}
            </div>
            <h3 className="text-xl md:text-2xl font-black text-foreground mb-3">メッセージ履歴</h3>
            
            {/* 詳細情報 - 1行ずつ */}
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between py-2 border-t border-border/50">
                <span className="text-muted-foreground">合計メッセージ数</span>
                <span className="font-bold">{(results.messageRatio.user1 + results.messageRatio.user2).toLocaleString()}件</span>
              </div>
              <div className="flex items-center justify-between py-2 border-t border-border/50">
                <span className="text-muted-foreground">{results.messageRatio.user1Name}</span>
                <span className="font-medium">{results.messageRatio.user1.toLocaleString()}件</span>
              </div>
              <div className="flex items-center justify-between py-2 border-t border-border/50">
                <span className="text-muted-foreground">{results.messageRatio.user2Name}</span>
                <span className="font-medium">{results.messageRatio.user2.toLocaleString()}件</span>
              </div>
            </div>
          </div>
          </FadeIn>

          {/* よく使う言葉 - FeaturesSectionと同じデザイン */}
          <FadeIn delay={200}>
          <div className="bg-feature-bg rounded-3xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10">
            <div className="flex flex-wrap gap-2 justify-center mb-4">
              {results.wordRanking.user1.slice(0, 5).map((item, i) => (
                <span
                  key={item.word}
                  className="bg-primary/10 text-primary text-sm px-3 py-1 rounded-full transition-all duration-300 hover:bg-primary/20 hover:scale-105"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  {item.word}
                </span>
              ))}
            </div>
            <h3 className="text-xl md:text-2xl font-black text-foreground mb-3">よく使う言葉</h3>
            <p className="text-sm text-muted-foreground mb-4">お互いがよく使うフレーズや絵文字をランキング形式で表示します</p>
            
            {/* ユーザー別ランキング - 1行ずつ */}
            <div className="space-y-4">
              {[
                { name: results.wordRanking.user1Name, words: results.wordRanking.user1 },
                { name: results.wordRanking.user2Name, words: results.wordRanking.user2 }
              ].map((user, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Avatar className="w-5 h-5">
                      <AvatarFallback className="text-xs">{user.name[0]}</AvatarFallback>
                    </Avatar>
                    {user.name}
                  </div>
                  <div className="space-y-1">
                    {user.words.slice(0, 5).map((item, i) => (
                      <div key={i} className="flex items-center justify-between py-1 text-sm">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold",
                            i === 0 ? "bg-yellow-100 text-yellow-700" :
                            i === 1 ? "bg-slate-200 text-slate-700" :
                            i === 2 ? "bg-orange-100 text-orange-700" : "bg-muted text-muted-foreground"
                          )}>
                            {i + 1}
                          </span>
                          <span className="text-foreground">{item.word}</span>
                        </div>
                        <span className="text-muted-foreground text-xs">{item.count}回</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          </FadeIn>

          {/* 時間帯分析 - FeaturesSectionと同じデザイン */}
          <FadeIn delay={300}>
          <div className="bg-feature-bg rounded-3xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10">
            <div className="flex items-end justify-center gap-1 h-16 mb-4">
              {results.timeDistribution.filter((_, i) => i % 2 === 0).map((item, i) => {
                const maxCount = Math.max(...results.timeDistribution.map(t => t.count));
                const heightPercent = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                return (
                  <div
                    key={i}
                    className="w-3 bg-primary/60 rounded-t transition-all duration-500 hover:bg-primary"
                    style={{ height: `${Math.max(10, heightPercent)}%` }}
                  />
                );
              })}
            </div>
            <h3 className="text-xl md:text-2xl font-black text-foreground mb-3 text-center">時間帯分析</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">何時頃によく会話しているか、曜日ごとの傾向も分析できます</p>
            
            {/* 時間帯詳細 - 1行ずつ */}
            <div className="space-y-2 text-sm">
              {(() => {
                const sortedTime = [...results.timeDistribution].sort((a, b) => b.count - a.count);
                const peak = sortedTime[0];
                const second = sortedTime[1];
                const third = sortedTime[2];
                return (
                  <>
                    <div className="flex items-center justify-between py-2 border-t border-border/50">
                      <span className="text-muted-foreground">🥇 ピーク時間</span>
                      <span className="font-medium">{peak?.hour}時台（{peak?.count}件）</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-t border-border/50">
                      <span className="text-muted-foreground">🥈 2位</span>
                      <span className="font-medium">{second?.hour}時台（{second?.count}件）</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-t border-border/50">
                      <span className="text-muted-foreground">🥉 3位</span>
                      <span className="font-medium">{third?.hour}時台（{third?.count}件）</span>
                    </div>
                  </>
                );
              })()}
            </div>
            
            {/* 曜日別 - 1行ずつ */}
            <div className="mt-6 space-y-2 text-sm">
              <h4 className="text-sm font-medium text-foreground flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4" />
                曜日別ボリューム
              </h4>
              {results.dayOfWeekDistribution.map((item) => {
                const maxCount = Math.max(...results.dayOfWeekDistribution.map(t => t.count));
                const widthPercent = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                const isWeekend = item.day === "土" || item.day === "日";
                return (
                  <div key={item.day} className="flex items-center gap-3 py-1">
                    <span className={cn(
                      "w-6 text-center font-medium",
                      item.day === "日" && "text-red-500",
                      item.day === "土" && "text-blue-500"
                    )}>{item.day}</span>
                    <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          isWeekend ? "bg-orange-400" : "bg-primary"
                        )}
                        style={{ width: `${widthPercent}%` }}
                      />
                    </div>
                    <span className="text-muted-foreground w-16 text-right">{item.count}件</span>
                  </div>
                );
              })}
            </div>
          </div>
          </FadeIn>

          {/* 返信スピード */}
          <FadeIn delay={400}>
          <div className="bg-feature-bg rounded-3xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-yellow-500" />
              <span className="text-sm font-medium text-foreground">返信スピード比較</span>
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">平均返信時間</h3>
            <p className="text-sm text-muted-foreground mb-4">どちらが早く返信しているか</p>
            
            <div className="space-y-2 text-sm">
              {[
                { name: results.replySpeed.user1Name, time: results.replySpeed.user1, isFast: results.replySpeed.user1 < results.replySpeed.user2 },
                { name: results.replySpeed.user2Name, time: results.replySpeed.user2, isFast: results.replySpeed.user2 < results.replySpeed.user1 }
              ].map((user, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-t border-border/50">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-5 h-5">
                      <AvatarFallback className="text-xs">{user.name[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-muted-foreground">{user.name}</span>
                    {user.isFast && <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">⚡速い</Badge>}
                  </div>
                  <span className="font-bold">{formatMinutes(user.time)}</span>
                </div>
              ))}
            </div>
          </div>
          </FadeIn>

          {/* スタンプ・絵文字率 */}
          <FadeIn delay={500}>
          <div className="bg-feature-bg rounded-3xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10">
            <div className="flex items-center gap-2 mb-4">
              <Smile className="w-5 h-5 text-pink-500" />
              <span className="text-sm font-medium text-foreground">装飾分析</span>
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">スタンプと絵文字の使用率</h3>
            <p className="text-sm text-muted-foreground mb-4">メッセージに含まれる装飾要素の割合</p>
            
            <div className="space-y-2 text-sm">
              <div className="py-2 border-t border-border/50">
                <div className="text-muted-foreground mb-2">スタンプ率</div>
                <div className="flex items-center justify-between">
                  <span>{results.replySpeed.user1Name}</span>
                  <span className="font-bold text-primary">{results.stickerRate.user1.toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span>{results.replySpeed.user2Name}</span>
                  <span className="font-bold text-primary">{results.stickerRate.user2.toFixed(1)}%</span>
                </div>
              </div>
              <div className="py-2 border-t border-border/50">
                <div className="text-muted-foreground mb-2">絵文字率</div>
                <div className="flex items-center justify-between">
                  <span>{results.replySpeed.user1Name}</span>
                  <span className="font-bold text-pink-500">{results.emojiRate.user1.toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span>{results.replySpeed.user2Name}</span>
                  <span className="font-bold text-pink-500">{results.emojiRate.user2.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
          </FadeIn>

          {/* 追撃LINE数 */}
          <FadeIn delay={600}>
          <div className="bg-feature-bg rounded-3xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10">
            <h3 className="text-lg font-bold text-foreground mb-2">追撃LINE数</h3>
            <p className="text-sm text-muted-foreground mb-4">5分以内の連続メッセージ</p>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between py-2 border-t border-border/50">
                <span className="text-muted-foreground">{results.chaserRanking.user1Name}</span>
                <span className="font-bold">{results.chaserRanking.user1}回</span>
              </div>
              <div className="flex items-center justify-between py-2 border-t border-border/50">
                <span className="text-muted-foreground">{results.chaserRanking.user2Name}</span>
                <span className="font-bold">{results.chaserRanking.user2}回</span>
              </div>
            </div>
          </div>
          </FadeIn>

          {/* 通話記録 */}
          <FadeIn delay={700}>
          <div className="bg-feature-bg rounded-3xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Phone className="w-6 h-6 text-primary" />
              </div>
              <div className="text-left">
                <div className="text-2xl font-bold">{results.callAnalysis.totalCalls}回</div>
                <span className="text-xs text-muted-foreground">総通話回数</span>
              </div>
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2 text-center">通話記録</h3>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between py-2 border-t border-border/50">
                <span className="text-muted-foreground">総通話時間</span>
                <span className="font-medium">{Math.floor(results.callAnalysis.totalDuration / 3600)}時間{Math.floor((results.callAnalysis.totalDuration % 3600) / 60)}分</span>
              </div>
              <div className="flex items-center justify-between py-2 border-t border-border/50">
                <span className="text-muted-foreground">{results.callAnalysis.user1Name}発信</span>
                <span className="font-medium">{results.callAnalysis.user1Calls}回</span>
              </div>
              <div className="flex items-center justify-between py-2 border-t border-border/50">
                <span className="text-muted-foreground">{results.callAnalysis.user2Name}発信</span>
                <span className="font-medium">{results.callAnalysis.user2Calls}回</span>
              </div>
            </div>
          </div>
          </FadeIn>

          {/* 挨拶分析 */}
          <FadeIn delay={900}>
          <div className="bg-feature-bg rounded-3xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10">
            <div className="flex items-center gap-2 mb-4">
              <Sun className="w-5 h-5 text-orange-400" />
              <span className="text-sm font-medium text-foreground">挨拶分析</span>
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">おはよう・おやすみ</h3>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between py-2 border-t border-border/50">
                <span className="text-muted-foreground">{results.greetingAnalysis.user1Name} ☀️</span>
                <span className="font-medium">{results.greetingAnalysis.user1.goodMorning}回</span>
              </div>
              <div className="flex items-center justify-between py-2 border-t border-border/50">
                <span className="text-muted-foreground">{results.greetingAnalysis.user1Name} 🌙</span>
                <span className="font-medium">{results.greetingAnalysis.user1.goodNight}回</span>
              </div>
              <div className="flex items-center justify-between py-2 border-t border-border/50">
                <span className="text-muted-foreground">{results.greetingAnalysis.user2Name} ☀️</span>
                <span className="font-medium">{results.greetingAnalysis.user2.goodMorning}回</span>
              </div>
              <div className="flex items-center justify-between py-2 border-t border-border/50">
                <span className="text-muted-foreground">{results.greetingAnalysis.user2Name} 🌙</span>
                <span className="font-medium">{results.greetingAnalysis.user2.goodNight}回</span>
              </div>
            </div>
          </div>
          </FadeIn>

          {/* 流行語大賞 */}
          {results.wordOfTheYear.length > 0 && (
          <FadeIn delay={1000}>
          <div className="bg-feature-bg rounded-3xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-foreground">二人の流行語大賞</span>
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">月ごとのトレンドワード</h3>
            
            <ScrollArea className="w-full whitespace-nowrap pb-4">
              <div className="flex gap-4 py-2">
                {results.wordOfTheYear.map((item, idx) => (
                  <div key={idx} className="inline-block min-w-[200px] bg-card rounded-xl p-4 border">
                    <div className="text-sm font-bold text-primary mb-2">
                      {item.month.split('-')[0]}年{item.month.split('-')[1]}月
                    </div>
                    <div className="space-y-1">
                      {item.words.slice(0, 3).map((w, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1">
                            <span className={cn(
                              "w-4 h-4 flex items-center justify-center rounded-full text-xs font-bold",
                              i === 0 ? "bg-yellow-100 text-yellow-700" :
                              i === 1 ? "bg-slate-200 text-slate-700" : "bg-orange-100 text-orange-700"
                            )}>
                              {i + 1}
                            </span>
                            <span className="truncate max-w-[100px]">{w.word}</span>
                          </span>
                          <span className="text-xs text-primary">+{w.increase}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
          </FadeIn>
          )}

          {/* 診断完了メッセージ */}
          <FadeIn delay={600}>
            <div className="bg-white/80 backdrop-blur-sm border border-cyan-100 rounded-2xl p-8 text-center shadow-md relative overflow-hidden mb-4">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-blue-500" />
              <div className="flex justify-center mb-4">
                <img 
                  src="/talklens/Shine (1).gif" 
                  alt="完了" 
                  className="w-24 h-24 object-contain"
                />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-slate-800 mb-4">
                トーク診断は以上だよ！<br />遊んでくれてありがとう！<br />ペアの人にスクショを送ってあげてね！
              </h3>
              <p className="text-slate-600 leading-relaxed mb-8">
                またトークをたくさんしたあとにもう一度分析してみてね！
              </p>
              
              {/* TOPに戻るボタン */}
              <div className="flex flex-col gap-4 items-center">
                <button 
                  onClick={() => setResults(null)} 
                  className="relative inline-flex items-center justify-center gap-3 px-12 py-4 bg-slate-900 text-white font-bold text-lg rounded-full shadow-xl hover:shadow-2xl hover:bg-slate-800 transition-all hover:-translate-y-1 overflow-hidden group border-2 border-slate-700"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  <ArrowLeft className="w-5 h-5 relative z-10" />
                  <span className="relative z-10">別のトークを診断してみる！</span>
                </button>

                {/* このサイトを友達に共有する */}
                <div className="flex flex-col items-center gap-4 w-full">
                  <p className="text-lg font-bold text-slate-800 mb-2">このサイトを友達に共有する！</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        const shareUrl = typeof window !== 'undefined' ? window.location.href : 'https://pairtalk.site';
                        const shareText = 'ペアトーク診断 Ι LINEトークをダウンロード不要で診断しよう！12タイプの関係性がわかります！ ダウンロード不要でいますぐできる！LINEトーク履歴を分析して、二人の関係性をカンタン診断！';
                        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
                        window.open(url, '_blank', 'width=550,height=420');
                      }}
                      className="w-14 h-14 flex items-center justify-center rounded-full bg-black text-white hover:bg-slate-800 transition-all hover:scale-110 shadow-lg"
                      aria-label="Xでシェア"
                    >
                      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => {
                        const shareUrl = typeof window !== 'undefined' ? window.location.href : 'https://pairtalk.site';
                        const url = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}`;
                        window.open(url, '_blank', 'width=550,height=420');
                      }}
                      className="w-14 h-14 flex items-center justify-center rounded-full bg-[#06C755] text-white hover:bg-[#05b04c] transition-all hover:scale-110 shadow-lg"
                      aria-label="LINEでシェア"
                    >
                      <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.105.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                      </svg>
                    </button>
                    <button
                      onClick={async () => {
                        const shareUrl = typeof window !== 'undefined' ? window.location.href : 'https://pairtalk.site';
                        try {
                          await navigator.clipboard.writeText(shareUrl);
                          alert('URLをコピーしました！');
                        } catch (err) {
                          console.error('Failed to copy:', err);
                        }
                      }}
                      className="w-14 h-14 flex items-center justify-center rounded-full bg-cyan-500 text-white hover:bg-cyan-600 transition-all hover:scale-110 shadow-lg"
                      aria-label="URLをコピー"
                    >
                      <Link className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </FadeIn>
          
          {/* イラストレーター紹介 ＋ 新機能開発中告知（横並び） */}
          <FadeIn delay={800}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
              {/* イラストレーター紹介 */}
              <div className="bg-slate-50 rounded-xl p-6 text-center border border-slate-200 flex flex-col">
                <h3 className="text-lg font-black text-slate-800 mb-4">描いてくれたイラストレーターさんはこちら</h3>
                <div className="flex justify-center mb-4">
                  <img 
                    src="/talklens/baby.png"
                    alt="イラストレーター"
                    className="w-32 h-32 object-contain animate-float"
                  />
                </div>
                <div className="flex justify-center mt-auto">
                  <a
                    href="https://x.com/mio_ney?s=21&t=4GzdYuJCnpD9cQmMyh5ZzA"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-white bg-black hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl hover:scale-105 border border-slate-700"
                    style={{
                      background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)',
                      boxShadow: '0 4px 14px 0 rgba(0,0,0,0.25), inset 0 1px 0 0 rgba(255,255,255,0.1)',
                    }}
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    イラストレーターさんをフォロー
                  </a>
                </div>
              </div>

              {/* 新機能開発中告知 */}
              <div className="bg-slate-50 rounded-xl p-6 text-center border border-slate-200 flex flex-col">
              <p className="text-slate-600 text-sm font-medium mb-3">
                ・彼氏診断してみた診断<br />
                ・今カレのモラハラ度診断<br />
                ・友達の地雷男診断<br />
                など新機能を鋭意開発中！
              </p>
              <p className="text-slate-600 text-sm font-medium mb-4">
                続報は運営会社公式Xを確認してね！<br />
                きみに幸あれ！
              </p>
              <div className="flex justify-center mt-auto">
                <a
                  href="https://x.com/writter_world"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-white bg-black hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl hover:scale-105 border border-slate-700"
                  style={{
                    background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)',
                    boxShadow: '0 4px 14px 0 rgba(0,0,0,0.25), inset 0 1px 0 0 rgba(255,255,255,0.1)',
                  }}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  公式Xをフォロー
                </a>
              </div>
              </div>
            </div>
          </FadeIn>

          {/* プレミアム・限定バッジ・イラストレーター紹介セクション - 非表示 */}
          {false && (
            <FadeIn delay={700}>
              <section className="w-full max-w-6xl mx-auto px-4 -mt-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* プレミアム会員 - リッチな金色デザイン */}
                  <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#FFD700] via-[#FDB931] to-[#F3A922] p-1 shadow-lg transition-transform hover:scale-[1.02]">
                    <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-white/20 blur-3xl rounded-full animate-pulse" />
                    <div className="relative bg-black/5 backdrop-blur-sm rounded-[20px] p-8 h-full border border-white/20">
                      <div className="flex flex-col items-center text-center space-y-4">
                        <div className="p-4 bg-white/90 rounded-full shadow-lg">
                          <Sparkles className="w-10 h-10 text-[#F3A922]" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-black text-white drop-shadow-sm mb-2">プレミアム会員</h3>
                          <p className="text-white/90 font-medium">詳細分析やグループトークの分析は<br/>プレミアム会員なら利用できます</p>
                        </div>
                        <Button className="w-full bg-white text-[#F3A922] hover:bg-white/90 font-bold text-lg h-12 rounded-xl shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5">
                          詳しく見る
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* 限定バッジ - リッチな紫グラデーションデザイン */}
                  <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#9333EA] via-[#A855F7] to-[#C084FC] p-1 shadow-lg transition-transform hover:scale-[1.02]">
                    <div className="absolute top-0 left-0 -mt-8 -ml-8 w-32 h-32 bg-white/20 blur-3xl rounded-full" />
                    <div className="relative bg-black/5 backdrop-blur-sm rounded-[20px] p-8 h-full border border-white/20">
                      <div className="flex flex-col items-center text-center space-y-4">
                        <div className="p-4 bg-white/90 rounded-full shadow-lg">
                          <Trophy className="w-10 h-10 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-black text-white drop-shadow-sm mb-2">限定バッジをゲット！</h3>
                          <p className="text-white/90 font-medium">Writterにログインしてアプリで使える<br/>限定バッジを入手しよう！</p>
                        </div>
                        <Button 
                          onClick={() => setIsWritterModalOpen(true)}
                          className="w-full bg-white text-purple-600 hover:bg-white/90 font-bold text-lg h-12 rounded-xl shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5"
                        >
                          Writterにログイン
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* イラストレーター紹介 - リッチなピンクグラデーションデザイン */}
                  <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#EC4899] via-[#F472B6] to-[#FBCFE8] p-1 shadow-lg transition-transform hover:scale-[1.02]">
                    <div className="absolute bottom-0 right-0 -mb-8 -mr-8 w-32 h-32 bg-white/20 blur-3xl rounded-full" />
                    <div className="relative bg-black/5 backdrop-blur-sm rounded-[20px] p-8 h-full border border-white/20">
                      <div className="flex flex-col items-center text-center space-y-4">
                        <div className="p-4 bg-white/90 rounded-full shadow-lg">
                          <Smile className="w-10 h-10 text-pink-600" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white/80 mb-1">ILLUSTRATION</p>
                          <p className="text-lg font-black text-white drop-shadow-sm mb-2">イラスト提供</p>
                          <p className="text-white/90 font-medium text-sm">このサイトのイラストを提供してくれた<br/>イラストレーターさんをご紹介</p>
                        </div>
                        <Button className="w-full bg-white text-pink-600 hover:bg-white/90 font-bold text-lg h-12 rounded-xl shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5">
                          詳しく見る
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </FadeIn>
          )}

          {/* Writterカード ＋ PicDNAカード（横並び） */}
          <FadeIn delay={700}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
              {/* Writterカード（PicDNAカードと同じデザインに合わせてある） */}
              <div className="relative rounded-[2rem] p-6 md:p-8 border-4 border-white bg-gradient-to-br from-slate-50 via-white to-slate-50 shadow-[0_10px_40px_-10px_rgba(100,116,139,0.2)] overflow-hidden group hover:shadow-[0_20px_50px_-10px_rgba(100,116,139,0.25)] hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-center gap-2 text-slate-600 text-sm font-bold bg-white/80 backdrop-blur-sm w-fit px-3 py-1 rounded-full shadow-sm mb-4 border border-slate-200">
                  iPhone/Androidストアで超大好評配信中！
                </div>
                <h3 className="text-xl md:text-2xl font-black text-slate-800 mb-6">こころ落ち着く、優しいSNS。</h3>

                <div className="mt-6 rounded-2xl overflow-hidden border-4 border-white shadow-md mb-6">
                  <div className="aspect-video bg-slate-100 flex items-center justify-center relative group-hover:scale-105 transition-transform duration-500">
                    <img 
                      src="/talklens/A.png"
                      alt="Writter"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                <a
                  href="https://writter.jp/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 hover:shadow-xl transition-all inline-flex items-center justify-center gap-2 shadow-lg"
                >
                  ダウンロードはこちら
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>

              {/* PicDNAカード（元デザイン） */}
              <div className="relative rounded-[2rem] p-6 md:p-8 border-4 border-white bg-gradient-to-br from-slate-50 via-white to-slate-50 shadow-[0_10px_40px_-10px_rgba(100,116,139,0.2)] overflow-hidden group hover:shadow-[0_20px_50px_-10px_rgba(100,116,139,0.25)] hover:-translate-y-1 transition-all duration-300 flex flex-col">
                <div className="flex items-center gap-2 text-slate-600 text-sm font-bold bg-white/80 backdrop-blur-sm w-fit px-3 py-1 rounded-full shadow-sm mb-4 border border-slate-200">
                  あなたの創作権を守る、見えない証明書
                </div>
                <h3 className="text-xl md:text-2xl font-black text-slate-800 mb-6">画像にオリジナルを刻印しよう！</h3>
                <div className="rounded-2xl overflow-hidden border-4 border-white shadow-md mb-6 flex-1 min-h-0">
                  <img
                    src="/talklens/pogp.png"
                    alt="PicDNA - 画像に見えない刻印"
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <a
                  href="https://writter.jp/picdna/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 hover:shadow-xl transition-all inline-flex items-center justify-center gap-2 shadow-lg"
                >
                  詳細はこちら
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          </FadeIn>

          <Footer />
        </div>

        {/* Writterログインモーダル */}
        <WritterLoginModal 
          isOpen={isWritterModalOpen} 
          onClose={() => setIsWritterModalOpen(false)} 
        />
      </div>
      <AdminStatsModal />
      </>
    );
  }

  return (
    <>
      <GlassHeader />
      <main className="min-h-screen" style={{ backgroundColor: '#F0F8FF' }}>
        {isAnalyzing && <AnalyzingOverlay />}
      <HeroSection onFileSelect={handleAnalyzeFile} isAnalyzing={isAnalyzing} />
      <CompatibilityTypesSection />
      <HowToSection />
      <FeaturesSection />
      
      <NextActionDuel />

      <Footer />
      </main>
      <AdminStatsModal />
    </>
  );
}
