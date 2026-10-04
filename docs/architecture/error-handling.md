# エラー・ログ対応表

「どの場面で、クライアントに何を返し、ログに何を出すか」を1か所で引ける対応表。**What（現状の挙動）だけを書く。** 理由・背景（Why）は下記の決定ファイルに置き、ここでは重複して書かない。

- エラーレスポンスの形式・`errorHandler`の分岐の理由: [api-conventions.md](./decisions/api-conventions.md#エラーレスポンスの形式統一-defaulthookでthrow--onerrorで一元整形)
- ログの基盤・レベル・出力する値と出さない値の理由: [security.md](./decisions/security.md#ログ出力の構造化基盤とセキュリティイベント記録2026-09-19更新)

## 全ログ行に共通するキー

`server/lib/logger.ts`が全行に付ける。`fields`（呼び出し側が渡す値）と同名のキーは、ロガー側が勝つ（`fields`は`level`・`message`・`requestId`等を上書きできない）。

| キー        | 値                                       | 付与元                                  |
| ----------- | ---------------------------------------- | --------------------------------------- |
| `requestId` | リクエストごとのID                       | `createLogger`（`hono/request-id`の値） |
| `method`    | HTTPメソッド                             | `createLogger`                          |
| `path`      | リクエストパス（クエリ文字列を含まない） | `createLogger`                          |
| `timestamp` | UTCのISO 8601                            | `write`                                 |
| `level`     | `error` / `warn` / `info`                | `write`                                 |
| `message`   | 日本語の固定文言（検索用の識別子）       | 呼び出し側                              |

## 場面別の対応表

クライアントへのレスポンスと、その場面で**専用に**出るログ。専用のログとは別に、全リクエストで[「リクエスト完了」](#全リクエスト共通のリクエスト完了ログ)が1行出る。

| 場面                                                            | 発生元                                                                                            | ステータス | レスポンスの`message`                                           | 専用のログ（level / `message` / 追加の`fields`）                             |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 未認証（Clerkのセッションなし）                                 | `authMiddleware`（`server/middleware/auth.ts`。`c.json`で直接返す）                               | 401        | `unauthorizedErrorMessage`                                      | なし                                                                         |
| ログイン済みだがDBにユーザーが未登録                            | `requireUserMiddleware`（同上）                                                                   | 401        | `unauthorizedErrorMessage`                                      | なし                                                                         |
| リクエストのバリデーション失敗                                  | `validationErrorHook`が`HTTPException(400, { cause: ZodError })`を`throw` → `errorHandler`の①分岐 | 400        | `validationErrorMessage`＋`details`（`field`・`message`の配列） | なし                                                                         |
| プロフィールの二重登録（`users`のUNIQUE違反を業務エラーに変換） | `profileSetupHandler`                                                                             | 409        | `alreadySetupMessage`                                           | なし                                                                         |
| ピン留め・解除の対象カテゴリが存在しない／他人のもの            | `categoryPinHandler`                                                                              | 404        | `categoryPinTargetInvalidMessage`                               | `warn` / `IDOR試行の疑い` / `event: 'malicious_direct_reference'`・`clerkId` |
| ピン留め・解除の対象にできないカテゴリ                          | `categoryPinHandler`                                                                              | 400        | `categoryPinTargetInvalidMessage`                               | なし                                                                         |
| ピン留めを最後の1件から解除しようとした                         | `categoryPinHandler`                                                                              | 400        | `lastPinnedCategoryMessage`                                     | なし                                                                         |
| DBクエリの失敗（制約違反を業務エラーに変換していないもの）      | `errorHandler`の③分岐（`DrizzleQueryError`）                                                      | 500        | `unexpectedErrorMessage`                                        | `error` / `DBクエリ失敗` / `clerkId`・`query`・`causeMessage`                |
| 上記以外の想定外の例外                                          | `errorHandler`の③分岐                                                                             | 500        | `unexpectedErrorMessage`                                        | `error` / `想定外エラー` / `clerkId`・`errorMessage`・`stack`                |

- 文言の定数は`packages/common/src/api-error-message.ts`にある。`HTTPException`を意図的に`throw`する箇所の`message`は、各呼び出し元が指定する（`errorHandler`が固定しない）。
- **ログに出さない値:** `DrizzleQueryError`の`params`・`message`・`stack`（入力値が混入するため。`query`は`?`のままのSQL、`causeMessage`は`cause.message`のみ）。`error`オブジェクトそのものも渡さない。
- 業務エラーの`HTTPException`（上表のうち401を除く4xx）は、404を除き`errorHandler`が専用のログを出さない。原因がレスポンスの`message`・`details`から明確なため。
- **ログに出すIDは Clerk の ID（`clerkId`）だけ**（2026-10-04決定）。`getAuth` が例外を投げる場合（`clerkMiddleware` 未適用）は、`getClerkIdForLog` が `undefined` を返し、そのキーは出ない。元のエラーのログは残る。理由は[security.mdのログに出すID](./decisions/security.md#ログに出すidはclerkidだけ2026-10-04決定)参照。

## 全リクエスト共通の「リクエスト完了」ログ

`requestLogger`（`server/middleware/request-logger.ts`）が、成功・失敗を問わず**全リクエストの終わりに1行**出す（`message`は`リクエスト完了`）。`fields`は`status`と`elapsedMs`。`level`はレスポンスのステータスで決まる。

| ステータス     | `level` | 出力先（`console`） |
| -------------- | ------- | ------------------- |
| 500以上        | `error` | `console.error`     |
| 400以上500未満 | `warn`  | `console.warn`      |
| それ以外       | `info`  | `console.info`      |

このため、1つのリクエストで複数行になる場面がある。

| 場面                              | 出る行                                                                                                 |
| --------------------------------- | ------------------------------------------------------------------------------------------------------ |
| 想定外エラー・DBクエリ失敗（500） | `error`「想定外エラー」または「DBクエリ失敗」＋`error`「リクエスト完了」                               |
| 404                               | `warn`「IDOR試行の疑い」＋`warn`「リクエスト完了」（意図的な重複。前者だけが`clerkId`・`event`を持つ） |
| 401・400・409                     | `warn`「リクエスト完了」のみ                                                                           |

## ログの組み立て自体が失敗したとき

`logger.ts`の`write`は、`fields`をJSONにする段階で例外が出ても、呼び出し元（`errorHandler`や`requestLogger`）まで失敗させない。

| 状況                                      | 挙動                                                                                                                       |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| 循環参照・BigInt                          | `safe-stable-stringify`が吸収する（循環参照は`"[Circular]"`、BigIntは数値）。`fields`のデータは残る                        |
| `toJSON`・getter・`Proxy`が例外を投げる値 | `fields`を捨て、`{ requestId, method, path, timestamp, level, message, serializeFailed: true }`を**元の`level`のまま**出す |

`serializeFailed: true`の行は、「`fields`を捨てた行」の目印。ログを検索して、書き方に問題のある呼び出し元を洗い出すのに使う。

## Vercelのログ画面での見え方（未検証を含む）

公式の対応表では、`console.error`は`error`、`console.info`は`info`、`console.warn`は非ストリーミングの関数では`error`として扱われる（[Vercel公式](https://vercel.com/docs/logs/runtime)）。4xxのリクエストは、Vercelが自動でWarningとマークする。実際の表示は、Previewデプロイでの確認待ち（[nodejs-runtime-migration.md](../tasks/cross-cutting/nodejs-runtime-migration.md)のタスク5）。

## この表を更新するとき

- 新しい`HTTPException`の`throw`元、新しいログ行、`errorHandler`の分岐を足したら、「場面別の対応表」に1行足す。
- 実装予定の行は、実装したら「（実装予定）」の表記を外す。
