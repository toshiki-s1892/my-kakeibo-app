# 認証シーケンス図

Mermaidで管理する（採用理由は [decisions/design-docs-tooling.md](./decisions/design-docs-tooling.md#設計ドキュメント運用mermaid) 参照）。

## サインイン〜初回登録判定（現状の実装）

`proxy.ts`（Next.jsミドルウェア）が認証チェックを行い、`(app)/layout.tsx` がプロフィール登録済みかどうかを判定してリダイレクトする（`server/lib/onboarding.ts` の `isSetupComplete()`）。`(onboarding)/profile-setup/layout.tsx` には対称の逆方向ガードがあり、登録済みユーザーが`/profile-setup`に直接アクセスした場合は`/dashboard`へリダイレクトする。

```mermaid
sequenceDiagram
    actor User
    participant Browser
    participant Proxy as proxy.ts (clerkMiddleware)
    participant AppLayout as (app)/layout.tsx
    participant OnboardingLayout as (onboarding)/profile-setup/layout.tsx
    participant DB as Turso

    User->>Browser: (auth)/sign-in でログイン
    Browser->>Proxy: (app)/dashboard へアクセス
    Proxy->>Proxy: auth.protect()
    alt 未認証
        Proxy-->>Browser: (auth)/sign-in へリダイレクト
    else 認証済み
        Proxy->>AppLayout: リクエストを通過
        AppLayout->>DB: isSetupComplete(userId)
        alt 未登録
            AppLayout-->>Browser: (onboarding)/profile-setup へリダイレクト
        else 登録済み
            AppLayout-->>Browser: ページを表示
        end
    end

    User->>Browser: (onboarding)/profile-setup へ直接アクセス
    Browser->>OnboardingLayout: リクエストを通過
    OnboardingLayout->>DB: isSetupComplete(userId)
    alt 登録済み
        OnboardingLayout-->>Browser: (app)/dashboard へリダイレクト
    else 未登録
        OnboardingLayout-->>Browser: ページを表示
    end
```

## サインアウト

このアプリは家族で同じデバイス（タブレット・PC等）を共有して使う想定のため、サインアウト時に**TanStack Queryのキャッシュをクリアしないと、次にログインした別の家族メンバーに前のユーザーのデータが一瞬表示されるリスクがある**。`UserButton`の`signOutCallback`（または同等のフック）で`queryClient.clear()`を呼んでからサインアウトを完了させる。サインアウト後の遷移先（`afterSignOutUrl`）はホーム（`/`）とする。

```mermaid
sequenceDiagram
    actor User
    participant Browser
    participant QueryClient as TanStack Query Client
    participant Clerk

    User->>Browser: UserButtonの「サインアウト」をクリック
    Browser->>QueryClient: queryClient.clear()
    QueryClient-->>Browser: キャッシュ削除完了
    Browser->>Clerk: サインアウト実行
    Clerk-->>Browser: セッション破棄
    Browser->>User: ホーム（/）へリダイレクト
```
