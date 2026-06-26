# API・サーバー実装の規約

Hono + Zod OpenAPIを採用した理由は[stack.md](./stack.md#api-hono--zod-openapi)を参照。ここでは実装パターンを定義する。

## Honoルートの実装方針

- アプリの初期化は `OpenAPIHono` を使用（`Hono` の代わり）
- ルート定義は `createRoute` で行い、リクエスト・レスポンスのスキーマを明示する
- 各機能のルートは `server/routes/{feature名}/` ディレクトリに以下の3ファイルで分離する
  - `schema.ts`: Zodスキーマ・OpenAPI定義（`createRoute`）
  - `handler.ts`: DBアクセスなどの処理
  - `index.ts`: `OpenAPIHono` インスタンスにルートを登録してexport
- メインの `app/api/[...route]/route.ts` で各ルートを `.route()` でマウントすると OpenAPI スペックに自動集約される
- Clerk認証は `@clerk/hono` の `clerkMiddleware()` を使用する（`@hono/clerk-auth` は非推奨）
- `app.use('/profile/*', clerkMiddleware())` のようにルートごとにミドルウェアを適用する
- Swagger UI は `/api/ui`、OpenAPI スペックは `/api/doc` で公開する（認証不要）
- 各ハンドラ内では `getAuth(c)` で userId を取得する（`@clerk/hono` からimport）
- Next.jsミドルウェア（`proxy.ts`）でページルーティングレベルの認証を行い、Honoミドルウェアでは `getAuth(c)` のコンテキストセットアップを担当する
- エラーレスポンスは全ルートで共通スキーマ（`ErrorResponseSchema`）を使用する（詳細は[エラーレスポンス](#エラーレスポンス)参照）
- 共有スキーマ（複数ルートで使うもの）は `server/shared/` に配置する
  - `error.ts`: `ErrorResponseSchema`
  - `id-schema.ts`: `IdParamSchema`（パスパラメータ用）・`IdResponseSchema`（ID返却レスポンス用）
- パスパラメータの `:id` はUUID文字列のため変換不要（[ID設計: UUID](./stack.md#id設計-uuid全テーブル共通)参照）
- DBスキーマは `@repo/db/schema` サブパスからimportする（DBクライアント本体は次項の`server/lib/db.ts`から）

## DBクライアントの分離

`@repo/db` が提供する `db` インスタンスは `dotenv` を使って `.env.local` を読み込むため、Next.js環境（環境変数を独自管理）と競合する。そのため `apps/web` 側で独自のDBクライアントを作成する。

```
packages/db/   ← スキーマ定義・マイグレーションのみ提供
apps/web/server/lib/db.ts ← Next.js用のDBクライアント（process.envを直接参照）
```

`@repo/db` からはスキーマ（テーブル定義）のみをimportし、`db` インスタンスは `server/lib/db.ts` からimportする。

## エラーレスポンス

全ルートで以下の共通スキーマを使用する。

```ts
const ErrorResponseSchema = z.object({
  message: z.string(),
  details: z.array(z.object({
    field: z.string(),
    message: z.string(),
  })).optional(),
});
```

`code`（HTTPステータスと同じ値を持つフィールド）は持たせない。`errorHandler`の全分岐で`code`の値が常に`response.status`と完全一致し、レスポンスボディとHTTPステータスで同じ情報を二重に持つだけだったため削除した。将来「同じHTTPステータスでも複数の業務エラーを区別したい」という要件が出てきた時点で、業務エラーコードとして追加し直す。

ユーザー向けの固定文言（`message`に入れる値）は `packages/common/src/error-message.ts` に定数として集約する（`unexpectedErrorMessage`・`validationErrorMessage` など）。`HTTPException`を意図的に`throw`する箇所のメッセージ（`error.message`）はこの集約の対象外で、各呼び出し元が文脈に応じて指定する。

| HTTPステータス | 用途 |
|---|---|
| 400 | 不正なリクエスト・フォームバリデーションエラー |
| 422 | 形式は正しいが処理できない（AIがレシートを読み取れないなど） |
| 503 | 外部サービス障害（Gemini APIダウンなど） |
| 500 | 予期しないサーバーエラー |

### エラーレスポンスの形式統一: defaultHookでthrow + onErrorで一元整形

`@hono/zod-openapi` は `defaultHook` を指定しない場合、`createRoute` の `request.body` スキーマでのバリデーション失敗時に `{ success: false, error: <ZodError> }`（status 400）を返す。また `app.onError` を設定していない場合、ハンドラ内の未処理例外（`throw new Error(...)` 等）は Hono のデフォルト挙動でプレーンテキスト `"Internal Server Error"`（status 500）になる。いずれも上記の `ErrorResponseSchema` と形式が一致しない。

これらを統一フォーマットに揃えるため、**`defaultHook` では `HTTPException` を `throw` するだけにし、実際の整形は `app.onError` に一元化する**方式を採用する。

- `server/shared/default-hook.ts` に `validationErrorHook` を定義する。バリデーション失敗時に `HTTPException(HTTP_STATUS.BAD_REQUEST, { cause: result.error })` を `throw` するだけの関数
  ```ts
  export const validationErrorHook = (
    result: { success: true; data: unknown } | { success: false; error: ZodError },
    c: Context
  ): Response | void => {
    if (!result.success) {
      throw new HTTPException(HTTP_STATUS.BAD_REQUEST, { cause: result.error });
    }
  };
  ```
- `server/shared/error-handler.ts` に `errorHandler` を定義する。`app.onError` に渡し、`HTTPException` の `cause` が `ZodError` かどうかで判定して `ErrorResponseSchema` に整形する
  ```ts
  export const errorHandler = (error: Error, c: Context) => {
    if (error instanceof HTTPException && error.cause instanceof ZodError) {
      const details = error.cause.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return c.json({ message: validationErrorMessage, details }, HTTP_STATUS.BAD_REQUEST);
    }
    if (error instanceof HTTPException) {
      return c.json({ message: error.message }, error.status);
    }
    return c.json({ message: unexpectedErrorMessage }, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  };
  ```

**3つの分岐の設計意図:**

| 分岐 | ステータス | 判定方法 | 理由 |
|---|---|---|---|
| ① バリデーション失敗 | 常に400固定（`HTTP_STATUS.BAD_REQUEST`） | `error.cause instanceof ZodError` | `error.status === 400`で判定すると、将来Zod検証と無関係な理由で意図的に400を`throw`するケースが増えた際に誤って`error.cause.issues`を読みに行き実行時エラーになる。`cause`の型で判定する方が安全 |
| ② 業務ロジックが意図的に`throw`した`HTTPException` | `error.status`（動的） | `error instanceof HTTPException` | ステータス・メッセージを`errorHandler`側で固定せず、各`throw`元（401/403/404/409/422/503など）に委ねることで、新しい業務エラーが増えても`errorHandler`の変更が不要になる |
| ③ 想定外の例外 | 常に500固定（`HTTP_STATUS.INTERNAL_SERVER_ERROR`） | 上記以外 | `HTTPException`でない（意図的に`throw`されていない）例外はすべて予期しないエラーとして扱う |

**`defaultHook` と `onError` で設定場所が非対称になる点に注意:**

- `defaultHook` は `.openapi()` 呼び出し時にバリデーターへ焼き込まれるため、親の `OpenAPIHono` インスタンスに設定しても `.route()` でマウントしたサブルーター（各 `server/routes/{feature名}/index.ts` の `OpenAPIHono` インスタンス）には伝播しない（[honojs/middleware#708](https://github.com/honojs/middleware/issues/708), [#773](https://github.com/honojs/middleware/issues/773)）。そのため **各サブルーター（例: `profileRouter`）に個別に `new OpenAPIHono({ defaultHook: validationErrorHook })` を指定する**必要がある
- `onError` は `.route()` によるルート統合の仕組み上、サブルーター側で個別に `onError` を設定していない限りそのまま親のルーティングテーブルに統合されるため、**`app/api/[...route]/route.ts` の `app` に `app.onError(errorHandler)` を1箇所設定するだけで、マウントされた全サブルーターのエラーもキャッチできる**（サブルーター側に重複設定は不要）

なお、ステータスコードは [REST的には `422 Unprocessable Entity` がより正確という議論があるが](https://github.com/w3cj/stoker)、既存の `schema.ts`・フロントエンドの分岐コードとの整合性を優先し、**400のまま**とした。
