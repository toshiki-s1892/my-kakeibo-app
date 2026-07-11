// ==========================================
// DB保存用の定数
// ==========================================

// 性別コード（GENDER_CODE）
export const GENDER_CODE = {
  MALE: 1, // 男性
  FEMALE: 2, // 女性
  OTHER: 9, // その他
} as const;

// 続柄コード（RELATIONSHIP_CODE）
export const RELATIONSHIP_CODE = {
  SELF: 1, // 本人
  SPOUSE: 2, // 配偶者
  CHILD: 3, // 子
  PARENT: 4, // 両親
  OTHER: 5, // その他
} as const;

// カテゴリタイプ（CATEGORY_TYPE）
export const CATEGORY_TYPE = {
  EXPENSE: 1, // 支出
  INCOME: 2, // 収入
} as const;

// カテゴリ背景色キー（CATEGORY_COLOR_CODE）
export const CATEGORY_COLOR_CODE = {
  ORANGE: 'orange',
  YELLOW: 'yellow',
  TEAL: 'teal',
  CYAN: 'cyan',
  INDIGO: 'indigo',
  SLATE: 'slate',
  STONE: 'stone',
  GRAY: 'gray',
} as const;

// カテゴリアイコン名（CATEGORY_ICON_CODE）。デフォルトカテゴリ16件で使用する15種のみ定義（lucide-reactの正式な候補一覧20〜30種は未確定のため、ピッカーUI実装時に拡張する）
export const CATEGORY_ICON_CODE = {
  UTENSILS: 'Utensils', // 食費
  TRAIN: 'Train', // 交通費
  HOME: 'Home', // 住まいの費用
  LIGHTBULB: 'Lightbulb', // 光熱費
  SMARTPHONE: 'Smartphone', // 通信費
  STETHOSCOPE: 'Stethoscope', // 医療費
  SHIRT: 'Shirt', // 服・靴
  SHOPPING_BASKET: 'ShoppingBasket', // 日用品費
  GAMEPAD: 'Gamepad2', // 趣味・娯楽
  GRADUATION_CAP: 'GraduationCap', // 教育費
  SHIELD: 'Shield', // 保険料
  TAG: 'Tag', // その他（支出・収入共通。フォーム未選択時のデフォルトアイコンでもある）
  WALLET: 'Wallet', // 給与
  GIFT: 'Gift', // ボーナス
  BRIEFCASE: 'Briefcase', // 副業
} as const;

// AI 機能コード（FEATURE_CODE）
export const FEATURE_CODE = {
  RECEIPT_SCAN: 1, // レシート読み取り・自動入力
  EXPENSE_ANALYSIS: 2, // 簡易支出分析（ダッシュボード表示用）
  DETAILED_ADVICE: 3, // 本格的アドバイス（地域・年齢・家族構成を考慮）
} as const;
