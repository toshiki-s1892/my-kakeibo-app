// ==========================================
// 必須
// ==========================================
export const requiredMessage = '必須項目です';
// ==========================================
// 文字列
// ==========================================
export const minLengthMessage = (min: number) => `${min}文字以上で入力してください`;
export const maxLengthMessage = (max: number) => `${max}文字以内で入力してください`;

// ==========================================
// 選択
// ==========================================
export const selectRequiredMessage = '選択してください';

// ==========================================
// 日付
// ==========================================
export const futureDateNotAllowedMessage = '未来の日付は入力できません';
export const minDateMessage = (date: string) => `${date}以降の日付を入力してください`;

// ==========================================
// 数値
// ==========================================
export const invalidNumberMessage = '数値で入力してください';
export const minNumberMessage = (number: number) => `${number}以上の数値で入力してください`;
export const maxNumberMessage = (number: number) => `${number}以内の数値で入力してください`;

// ==========================================
// apiエラー
// ==========================================
export const unexpectedErrorMessage =
  '予期しないエラーが発生しました。時間をおいて再度お試しください。';
export const validationErrorMessage = 'バリデーションエラー';
