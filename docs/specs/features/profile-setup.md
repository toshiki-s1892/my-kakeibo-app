# プロフィール設定

## ユーザー登録の流れ

Clerkのウェブフックは使用しない。signup時はDB操作を行わず、プロフィール設定APIで初回登録を完結させる。

```
① Clerkでsignup・signin（DBへの操作なし）
② プロフィール設定画面へ遷移
③ POST /api/profile/setup を呼び出す
   → users テーブルに INSERT（clerk_id・regionCode）
   → family_members テーブルに INSERT（本人レコード・relationshipCode=1）
   → 上記2つをトランザクションで実行
④ ダッシュボードへリダイレクト
```

## セットアップ完了チェックによるリダイレクト

`users` テーブルに該当 `clerk_id` のレコードが存在しない場合、プロフィール設定未完了とみなしてリダイレクトする。

```
認証済みユーザーのリクエスト
  → (app)/layout.tsx（Server Component）が実行される
  → server/lib/onboarding.ts の isSetupComplete() で users レコードを確認
    → なし: /profile-setup へリダイレクト
    → あり: 通過
```

「レコードがある = プロフィール設定完了」と明確に判断できる。途中離脱しても再度プロフィール設定画面にリダイレクトされる。

Next.js の `proxy.ts`（Edge Runtime）ではなく `(app)/layout.tsx`（Node.js Server Component）で実装している。DB アクセスを含む処理は Edge Runtime の制約を避けるため Server Component で行う。

**逆方向のガード**: セットアップ完了済みのユーザーが`/profile-setup`に直接アクセスした場合は`/dashboard`へリダイレクトする（`app/(onboarding)/profile-setup/layout.tsx`に`(app)/layout.tsx`と対称のガードを実装）。これが無いと再度フォームが表示され、再送信時に`users`テーブルの一意制約エラーになる可能性がある。

## ルートグループ構成

| グループ | 状態 | 例 |
|---|---|---|
| `(auth)` | 未認証ユーザー向け | sign-in, sign-up |
| `(onboarding)` | 認証済み・セットアップ未完了 | profile-setup |
| `(app)` | 認証済み・セットアップ完了 | dashboard など |

## スキーマ設計（3層）

| 層 | ファイル | 役割 |
|---|---|---|
| ① フォームスキーマ | `features/profile-setup/schema.ts` | フロントのフォームバリデーション |
| ② APIリクエストスキーマ | `server/routes/profile/schema.ts` | Honoルートの入口バリデーション・OpenAPI定義 |
| ③ DB操作 | `server/routes/profile/handler.ts` | drizzle-zodを使ってDBに保存 |

## APIエンドポイント

| メソッド | パス | 説明 | レスポンス |
|---|---|---|---|
| POST | `/api/profile/setup` | プロフィール初回登録 | 204 No Content |

初回登録後に`regionCode`（居住地域）を更新する専用APIは設けない。専用の設定画面を作らない方針（[アーキテクチャ](../../architecture/overview.md#app-レイアウト構成)参照）のため、[家族構成管理の本人（SELF）編集](./family-members.md#本人selfのみの追加編集項目-居住地域)から更新する。
