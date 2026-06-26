# プロフィール設定

## バックエンド

- [x] 1. `OpenAPIHono` への切り替え・Swagger UI設定
- [x] 2. `server/lib/db.ts` にNext.js用DBクライアントを作成
- [x] 3. Clerk認証ミドルウェア（`@clerk/hono`）の統合
- [x] 4. `server/routes/profile/schema.ts` に `POST /api/profile/setup` のcreateRoute定義
- [x] 5. `server/routes/profile/handler.ts` に `users` + `family_members` へのトランザクションINSERT
- [ ] 5-1. 上記のトランザクションに、デフォルトカテゴリ（住居費・食費・光熱費）への`category_pins`INSERT（3件）を追加する（[categories.md](./categories.md#バックエンド)の`category_pins`テーブル追加タスクに依存。[specs/features/categories.md](../../specs/features/categories.md#カテゴリの固定表示ピン留め)参照）
- [x] 6. `server/routes/profile/index.ts` にルート登録・export
- [x] 7. `app/api/[...route]/route.ts` にルートをマウント
- [x] 8. 動作確認（DBへの挿入を確認）
- [x] 9. バリデーションエラー（400）のレスポンス形式を `ErrorResponseSchema` に統一する（詳細: [api-conventions.md](../../architecture/decisions/api-conventions.md#エラーレスポンス)）
  - [x] `server/shared/error.ts` の `ErrorResponseSchema` から `code` を削除（HTTPステータスと重複するため）
  - [x] `packages/common/src/error-message.ts` に `validationErrorMessage` を追加
  - [x] `server/shared/default-hook.ts` に `validationErrorHook` を定義（バリデーション失敗時に `HTTPException(HTTP_STATUS.BAD_REQUEST, { cause: result.error })` を throw するだけ）
  - [x] `server/shared/error-handler.ts` に `errorHandler` を定義（`HTTPException` の `cause` が `ZodError` かどうかで判定して `ErrorResponseSchema` 形式に整形する `onError` 用ハンドラ）
  - [x] `app/api/[...route]/route.ts` の `app` に `app.onError(errorHandler)` を指定（ここ1箇所で `profileRouter` 含む全エラーをキャッチできる。`app`側への`defaultHook`指定は不要）
  - [x] `server/routes/profile/index.ts` の `profileRouter` に `new OpenAPIHono({ defaultHook: validationErrorHook })` を指定（`.openapi()` 時に焼き込まれるため必須）
  - 既知の課題（別タスク）: `proxy.ts` の `auth.protect()` はセッショントークン認証失敗時に404を返すため、`schema.ts` の401レスポンス定義は実質到達不能

## フロントエンド基盤

- [x] 1. TanStack Query の `QueryClientProvider` を `components/provider.tsx` に設定
- [x] 2. orval設定（`orval.config.ts`）・型生成スクリプト（`bun run generate`）
- [x] 3. `lib/api/generated/` に型・hooksを生成

## フロントエンド（画面実装）

- [x] 1. `ProfileSetupForm` のフォームUI実装（`profileSetupFormSchema` + RHF + 各Fieldコンポーネント）
  - コンポーネント名は `RegistForm` → `ProfileSetupForm`（ファイル: `components/ProfileSetupForm.tsx`）
  - Storybook・テスト対応のためpropsベースの表示専用コンポーネントとして実装（`form`/`onSubmit`/`isPending`/`submitError` をpropsで受け取る）
- [x] 2. `bunx shadcn@latest add alert --overwrite` で `Alert` コンポーネントを追加
- [x] 3. `features/profile-setup/hooks/useProfileSetupForm.ts` を実装
  - [x] `useForm` の生成（`schema/profileSetupFormSchema.ts` の `profileSetupFormSchema` + `ProfileSetupFormValues`）
  - [x] フォーム値 → APIリクエストボディへの変換処理
    - `genderCode`: `GENDER_CODE[data.gender]`（`GENDER_OPTIONS.value` を `GENDER_CODE` のキー名に合わせているため直接参照可能）
    - `regionCode`: `Number(data.regionCode)`
    - `birthday`: `data.birthday.toISOString()`
  - [x] `usePostApiProfileSetup` でmutationを実行（`@/lib/api/generated/profile/profile` からimport）
  - [x] `onSuccess` 内で `HTTP_STATUS` 定数を使い `response.status` により分岐
    - 204: `/dashboard` へリダイレクト
    - 400: Alert表示（フィールドレベルエラーは省略、汎用メッセージで統一）
    - 上記以外（401・500）: Alert表示用のエラーメッセージをstateにセット
  - [x] `onError`（ネットワークエラー・レスポンス解析エラー）でもAlert表示用のエラーメッセージをstateにセット
- [x] 4. `ProfileSetupRoute.tsx` を更新し `useProfileSetupForm` を呼び出す
  - `'use client'` を追加
  - `useProfileSetupForm()` を呼び出し、`ProfileSetupForm` に props を渡す
- [x] 5. `ProfileSetupForm.tsx` に `submitError` の `Alert` 表示・`isPending` 中の送信ボタン `disabled` を追加

## ミドルウェア

- [x] 1. `users` テーブルにレコードがないユーザーを `/profile-setup` へリダイレクト
  - `server/lib/onboarding.ts` に `isSetupComplete(userId)` を実装
  - `app/(app)/layout.tsx`（Server Component）から呼び出してリダイレクト
- [x] 2. セットアップ完了済みユーザーが `/profile-setup` へアクセスした場合は `/dashboard` へリダイレクト
  - `app/(onboarding)/profile-setup/layout.tsx` に対称のガードを実装

## クリーンアップ

- [x] 1. `server/middleware.ts` を削除（古いテスト用コード）
