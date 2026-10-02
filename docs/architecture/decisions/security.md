# セキュリティ対応方針

このプロジェクトで採用しているスタックにより、主要なセキュリティ対策は自動的に適用されている。

## SQLインジェクション（CWE-89）

**Drizzle ORM のクエリビルダーが自動でパラメータ化クエリを生成するため対策済み。**

```ts
// ✅ 安全: Drizzle が内部でパラメータ化クエリに変換する
await db.insert(users).values({ clerkId, name });

// ⚠️ 注意: sql テンプレートリテラルは安全だが、文字列結合は危険
await db.execute(sql`SELECT * FROM users WHERE id = ${userId}`); // ✅ 安全
await db.execute(`SELECT * FROM users WHERE id = '${userId}'`); // ❌ 危険
```

## XSS（クロスサイトスクリプティング）（CWE-79）

**React が JSX レンダリング時に自動でエスケープするため対策済み。**

ユーザーが入力した文字列に `<script>` タグ等が含まれていても、React がテキストとして扱うため実行されない。`dangerouslySetInnerHTML` は使用しないこと。

**うっかり混入を防ぐため、`react/no-danger`（eslint-plugin-react）をESLintルールとして有効化済み（2026-08-23決定）。** `eslint-plugin-react`の`recommended`プリセットには含まれないため、`packages/eslint-config/react-internal.js`・`next.js`の`rules`に個別追加している。将来サニタイズ済みHTMLを描画する必要が生じた場合は、該当行に`eslint-disable-next-line`を付け、DOMPurify等での事前サニタイズを必須とすること。

## IDOR（不正な直接オブジェクト参照）対策（CWE-639）

**`:id`を含む全エンドポイント（GET/PUT/DELETE）で、`WHERE id = :id AND user_id = auth.userId`のように所有者チェックを必須とする。** カテゴリ・家族構成メンバーなど、ユーザーごとのリソースを扱う機能すべてに適用する。

IDを推測されにくくする（[UUID化](./stack.md#id設計-uuid全テーブル共通)）ことは補助的な対策であり、本質的な防御はこの所有者チェック。所有者チェックが漏れると、IDが連番かUUIDかに関わらず他ユーザーのデータにアクセスできてしまう。

**再発防止（2026-08-23決定）:** `:id`を含む全エンドポイントに「他ユーザーのリソースを指定すると404になる」ことを確認するテストを必須化する（[testing-strategy.mdの該当規約](./testing-strategy.md#各層の検証責務重複を避ける)参照）。レビュー方針の記述だけでは実装漏れに気づけないため、テストで機械的に担保する。

**所有者チェック失敗時は403ではなく404を返す（2026-09-13決定）:** 対象が存在しない場合と、存在するが他ユーザーの所有物である場合を区別せず、どちらも404 Not Foundで返す。403 Forbiddenは「存在するが権限が無い」ことを暗に示してしまい、IDの総当たり（enumeration）を助けるため（CWE-203: Observable Discrepancy）。所有者チェック自体（本質的な防御）とは別の、レスポンスコードによる副次的な情報漏えい対策として採用する。`categoryPinHandler.ts`（`HTTP_STATUS.NOT_FOUND`追加）が最初の適用例。業務ルール違反（対象は自分の所有物だが状態的にNG。例: INCOMEカテゴリへのピン留め）は所有権チェックとは別問題のため、400のまま区別する。

**IDOR試行の検知ログは個別ハンドラではなく`errorHandler`で一元化する（2026-09-13決定）:** 現状このアプリで404を返す箇所は、上記の所有者チェック失敗パターンとほぼ一致する。ハンドラごとにログ呼び出しを仕込むと実装漏れが起こりうるため、`server/shared/error-handler.ts`側で`HTTPException`のステータスが404の場合に一律で`warn`ログ（[ログ出力の構造化基盤](#ログ出力の構造化基盤とセキュリティイベント記録2026-09-19更新)参照）を出す。将来「本当に存在しないリソース」と「他人の所有物」を区別する404が増えた場合は、この一律ログの前提が崩れるため見直すこと。

**IDOR試行のログには`event: 'malicious_direct_reference'`を付ける（2026-09-26決定）:** [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html)は、認可（アクセス制御）の失敗を記録すべきイベントに挙げ、ログにセキュリティ以外のイベントも混在する場合は「セキュリティ関連イベントのフラグ」を付けることを勧めている。[OWASP Logging Vocabulary](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Vocabulary_Cheat_Sheet.html)は「セキュリティイベントの標準語彙の提案」で、監視・アラートをこの用語で引けるようにするのが目的。認可失敗には`authz_fail`（一般的な認可失敗）と`malicious_direct_reference`（かつてのOWASP Top 10のIDOR。例文は「User joebob1 attempted to access an object to which they are not authorized」）があり、ここで記録するのはIDORの試行なので後者を使う。メッセージ文（「IDOR試行の疑い」）だけで識別すると言い換えで検索が壊れるため、構造化フィールドで識別する。語彙のイベント名以降のフィールド（`userid`・`resource`）は任意で、`userId`は`fields`に足し、`resource`はロガーが全行に付与する`path`で足りる。語彙のレベルはCRITICALだが、このプロジェクトのレベル体系（4xxは`warn`）に合わせて`warn`とし、語彙のレベルには合わせない（語彙にレベルの一致を求める記述はない）。存在しないIDの404も同じイベントになる限界は、上記の「一律ログの前提」と同じ。

**既存の「リクエスト完了」のwarnとは別の行になる（2026-09-26）:** `requestLogger`は404を含む4xxを`warn`の「リクエスト完了」で記録するため、404のたびに同じリクエストで`warn`が2行になる。専用の行は`userId`と`event`を持つ点が違い（「リクエスト完了」には`userId`がない）、意図的な重複とする。

## 機微データの列暗号化（アプリ層暗号化）（CWE-311）（2026-08-23決定）

DBが丸ごと流出するシナリオ（接続情報の漏えい・バックアップの誤公開等）に備え、**本人以外の第三者の同意なく入力されうる機微フィールドはアプリ層で暗号化**する。

**対象フィールド:**

- `transaction_parties.name`（取引先名。勤務先名が入ると収入取引と組み合わせて勤務先が特定されうる）
- `family_members.name`・`family_members.birthday`（家族の氏名・生年月日。本人以外の同意なく登録される）

`categories`・`transactions.amount`等は対象外（カテゴリ名は本人が選ぶ定型的な値、金額単体は個人を特定しない）。

**実装方針:**

- `server/lib/crypto.ts` に `encrypt()`/`decrypt()` を1箇所実装する（AES-256-GCM）。外部サービスアダプタと同じ思想で、暗号化ロジックへのアクセスはこのモジュール境界に一本化し、テストは`vi.mock`で差し替える
- 暗号文は鍵バージョン識別子を含む形式（例: `v1:<iv>:<ciphertext>`）で保存する。将来鍵基盤を差し替える際、新旧の鍵を`decrypt()`内で読み分けられるようにするため（既存行の一括再暗号化を強制されない）
- **鍵管理はフェーズを分ける**: リリース初期はVercelの環境変数（Production限定公開、Encrypted at rest）に32byteの鍵を1本置く（`v1`）。将来AWS KMS等へ移行する際は`v2`を追加し、新規書き込みから順次`v2`に切り替える

## 退会時の完全削除（2026-08-23決定）

既存の論理削除（`deletedAt`）は維持する（過去の取引のカテゴリ表示等を壊さないため）。一方で「退会時はデータを完全に消してほしい」という要望には別の仕組みで応える。

**アカウント削除UI・削除操作自体は自前で実装しない。** [UserButtonのドロップダウン（Manage Account）](./api-conventions.md)からClerkの`UserProfile`を開く既存方針（[architecture/overview.mdのヘッダー構成](../overview.md)参照）に乗せ、Clerkダッシュボードでアカウント削除機能を有効化するだけで、退会操作自体はClerkが提供するUIで完結する。

アプリ側はClerkが発火する **`user.deleted` Webhook** を受け取り、そのユーザーに紐づく全テーブル（`categories`・`family_members`・`transaction_parties`・`transactions`・`recurring_transactions`・`ai_advice_sessions`・`ai_advice_messages`・`ai_usage_logs`・`users`本体）の行をハード削除する処理を実装する（論理削除ではなく物理削除。子→親の順序に注意）。

## 認証の多要素化（MFA / 2FA）（CWE-308）（2026-08-23決定）

Clerkダッシュボードの設定でMFA（認証アプリ・TOTP等）を有効化し、ユーザーが`UserProfile`から**任意で**有効化できるようにする。全ユーザーへの強制は行わない（オンボーディング離脱を増やすリスクを避けるため）。アプリコード側の変更は不要（Clerk側の設定のみ）。

## ログ出力の構造化基盤とセキュリティイベント記録（2026-09-19更新）

**実行環境はVercelのNode.js runtimeのため（[stack.mdの実行環境](./stack.md#実行環境-vercel-nodejs-runtime2026-09-19決定)参照）、pino等のNode依存ロガーも選択肢に入る。** それでも当面は`console`ベースの自前実装で始める。`console.*`に3段階のJSONを書くだけで足り、追加の依存も要らないため。pinoはNext.jsの`serverExternalPackages`の既定リストに入っているが、当面導入しない（理由は下記）。「呼び出し側のAPI」と「実際にログを吐く実装」を分離しておくと、pino等へ実装だけ差し替えられ、呼び出しコードの変更が不要になる（`server/lib/crypto.ts`の「鍵基盤を差し替える際、`decrypt()`内で読み分けられるようにする」と同じ思想）。

- **配線にはHono公式組織（`honojs/middleware`）が提供する`@hono/structured-logger`を使う**。`c.var.logger`としてリクエストスコープのロガーを提供し、`hono/request-id`と組み合わせてリクエストID相関を付与できる（`app.use(requestId())`を先に登録し、`createLogger`内で`c.var.requestId`をロガーに渡す）。Node.js・Vercel Edge・AWS Lambda等、Honoがサポートする全ランタイムで動作するとREADMEに記載されており、依存ゼロ。ビルトインの`hono/logger`はメソッド・パス・ステータス・所要時間のアクセスログを出すだけで、`c.var.logger`を提供せずログレベルも持たないため、`errorHandler`から`error`・`warn`を呼ぶ用途には使えず採用しない
- **採用リスクの認識（2026-09-19）:** `@hono/structured-logger`は初回公開2026-04・1.0.0は2026-08と新しく、週間ダウンロードは約2.2万（同時期の`@hono/swagger-ui`は約67万）で実績は少なく、日本語の解説記事も見当たらない。それでも採用するのは、Hono公式組織のパッケージであり、中身が「`c.var`にロガーを載せるだけ」の薄いミドルウェアだから。問題が出た場合は`createMiddleware`による自前実装（十数行）へ差し替えても、呼び出し側（`c.var.logger`）は変わらない
- **ロガーの中身は`server/lib/logger.ts`に自前実装する**。`@hono/structured-logger`のロガー型`L`は`unknown`で制約がなく（パッケージに`BaseLogger`型はexportされていない。READMEと型定義で確認）、`error`・`warn`・`info`を持つ`Logger`型を`logger.ts`で定義してexportする。現時点ではconsoleベースのJSON構造化出力（`{ level, timestamp, message, ... }`を`console.error`/`console.warn`/`console.info`経由で書き出す）。pino等へ差し替える場合は、この実装だけを置き換えれば済む
- **`logger.ts`の実装上の決定事項（2026-09-21）:**
  - `createLogger`の引数は`requestId`・`method`・`path`の3キーに固定した型（`CreateLoggerProps`）にする。キー名を固定することで、pino公式が注意する「外部由来のキー名がロガー自身のキー（`level`・`time`等）と衝突する問題」を避ける
  - JSONは`{ ...fields, ...createLoggerProps, timestamp, level, message }`の順に組み立てる。同名のキーは後ろが勝つため、呼び出し側の`fields`が`level`・`message`・`timestamp`や`requestId`等を上書きできないようにする（ロガー自身のキーを一番強くする）。キー名は`timestamp`（値は`new Date().toISOString()`のUTC ISO 8601形式。OWASPの「日時は国際的な形式で」に沿う）
  - レベルごとの出力先は`Record<LogLevel, (payload: string) => void>`の対応表（`LogLevel = keyof Logger`）で持つ。既存の`categoryColor.ts`等と同じ「`Record`の対応表」の書き方で、レベルの書き漏らしを型が検出する。`error`→`console.error`・`warn`→`console.warn`・`info`→`console.info`とする
  - `console`のメソッドを使い分けるのは、Vercelのログ画面のレベルが、JSONの`level`ではなく**出力先（`stdout`/`stderr`）と`console.warn`**から決まるため。公式の対応表（[Vercel: Runtime Logs](https://vercel.com/docs/logs/runtime)）では、`stdout`（`console.log`等）はinfo、`stderr`（`console.error`）はerror、**通常の関数では`console.warn`もerror**（ストリーミング関数ではwarning）。加えて、ステータスが4xxのリクエストはWarning、5xxはErrorとVercelが自動でマークする。`console.info`は表に明記がないが、Node.jsでは`stdout`に出るため（NodeとBunで確認）infoとして扱われる見込み（Previewで確認する。[nodejs-runtime-migration.md](../../tasks/cross-cutting/nodejs-runtime-migration.md)参照）
  - Vercelのランタイムログの制限は、1リクエストあたり256行・1行256KB・合計1MB。保存期間はHobbyで1時間・Proで1日（Observability Plusで30日。[同ドキュメント](https://vercel.com/docs/logs/runtime)）。セキュリティイベント（IDOR試行など）をあとから調べるには短いため、Log Drains等での保存は将来検討とする
  - **`JSON.stringify`の失敗はログ側で吸収する（2026-09-21決定）:** `fields`に循環参照・BigInt・`toJSON`が例外を投げる値が入ると、`JSON.stringify`が例外を投げる。`errorHandler`内や`requestLogger`の`onResponse`内で起きると、元のレスポンス処理まで失敗する（Honoは`onError`が投げた例外を握らず再スローする）。[OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html)の「ログ処理の失敗がアプリの動作を妨げないようにする」に沿い、次の2段構えにする（2026-09-26に方針変更）。(1) 通常は`JSON.stringify`ではなく[`safe-stable-stringify`](https://github.com/BridgeAR/safe-stable-stringify)で変換する。循環参照は`"[Circular]"`に、BigIntは数値になり、例外を投げず`fields`のデータも残る。名前の「stable」は出力の決定性のことで、既定では項目をABC順に並べ替える（`userId`が先頭の今の並びが`level`始まりに変わる。実験で確認）。ログを人が読むときの見やすさを保つため`configure({ deterministic: false })`で書いた順のままにする（並べ替えを止める設定で、循環参照・BigIntの吸収には影響しない。pinoも通常のログは書いた順に出し、`safe-stable-stringify`は`JSON.stringify`失敗時のフォールバックにだけ使っている（`pino.js`で確認）。私たちは通常の変換に使うため、この設定で通常のログの並びに揃える）。pino・winstonが内部で依存している（npmレジストリで確認）実務の主流の手法で、pinoも`JSON.stringify`が失敗したときは`fields`を捨てず、深さ・要素数の上限つきのフォールバックのシリアライザでデータを残して出す（[pino API](https://github.com/pinojs/pino/blob/main/docs/api.md)）。(2) `write`の`try/catch`は最後の砦として残す。`safe-stable-stringify` 2.5.0は`toJSON`・getter・`Proxy`が例外を投げる値を吸収しないことを実験で確認したため（循環参照・BigIntは吸収される）。失敗時は`fields`を捨てて`{ ...createLoggerProps, timestamp, level, message, serializeFailed: true }`を元の`level`のまま出す（残りは全て文字列なので再失敗しない）。現状の呼び出し元の`fields`はstring・numberのみで発生しないが、AI機能等で外部データを`fields`に入れる将来に備える。Vercelのランタイムでの動作は公式の記述を直接は確認しておらず、導入後のデプロイで確認する（依存なしの純JSで、pino・winstonがNode.jsランタイムで広く使われている）
- **pino等は当面導入しない（2026-09-21決定）:** (1) Vercelのレベル推定が`console`のメソッド由来であるのに対し、pinoの既定の出力先は`stdout`のみ（[pino公式](https://github.com/pinojs/pino/blob/main/docs/help.md)）のため、errorがVercelのログ画面でinfo扱いになる可能性がある（pinoでの実際の挙動は未確認）。(2) Next.js 16（Turbopack）＋Vercelでpinoが解決できない不具合の報告がある（[vercel/next.js#84766](https://github.com/vercel/next.js/issues/84766)・[#93849](https://github.com/vercel/next.js/issues/93849)。現在も未解決かは未確認）。大量ログの処理・Log Drains・pinoの`redact`機能などが必要になった時点で、`logger.ts`だけを差し替える（呼び出し形が同じ`(fields, message)`のため、呼び出し側は変わらない）
- **ログレベルは`error`・`warn`・`info`の3段階**。想定外エラーは`error`、IDOR試行等のセキュリティイベントは`warn`、正常系は`info`。`DEBUG`は足さない（[Better Stack](https://betterstack.com/community/guides/logging/log-levels-explained/)は「量・費用・機微情報の混入のため、本番では通常有効にしない」とし、Vercelのレベル絞り込みにも`debug`がない。呼び出し箇所もなく、足すなら本番で出力を止める環境変数の仕組みも要るため、必要になった時点で検討する）。レベルを表す型は`enum`ではなく、`Logger`のキーから作る`LogLevel = keyof Logger`とする（TypeScript公式は「`as const`のオブジェクトで足りるならenumは不要」とし、このプロジェクトの既存コードも`enum`を使わず`as const`のオブジェクトで定数を定義している）
- 呼び出し側（`errorHandler`等）はロガーを直接importせず、**`c.var.logger`経由で呼び出す**（リクエストID自動付与の恩恵を受けるため）

**`errorHandler`（`server/shared/error-handler.ts`）の想定外エラー分岐は`c.var.logger.error()`を使い、`error`オブジェクトを丸ごと渡さない（CWE-532: Insertion of Sensitive Information into Log File）。** DB制約違反等のエラーはメッセージに失敗したクエリの値を含むことがあり、Vercelのログ基盤に個人データが流出する経路になり得るため。

- **「`message`・`stack`のみ」では不十分（2026-09-21）:** drizzle-orm 0.45.2の`DrizzleQueryError`は、`message`が`` `Failed query: ${query}\nparams: ${params}` ``で、バインドした値がそのまま入る（`drizzle-orm/errors.js`で確認）。V8の`stack`の1行目は`name: message`のため、`stack`にも同じ内容が入る。さらに`query`・`params`・`cause`は通常のプロパティなので、`error`を`fields`に丸ごと渡すと`JSON.stringify`でこれらも出力される。同じ漏えいは他プロジェクトでも報告されている（[portal-ai #540](https://github.com/EnterpriseBT/portal-ai/issues/540)・[trakwyn #837](https://github.com/mankatcheung/trakwyn/issues/837)）。[列暗号化](#機微データの列暗号化アプリ層暗号化cwe-3112026-08-23決定)を実装すれば暗号化列の`params`は暗号文になるはずだが、`memo`・`amount`等の非暗号化列は平文で残る
- **出力の出し分け（2026-09-21決定、2026-09-26改訂）:** `error instanceof DrizzleQueryError`の場合は、`query`（`?`のままのSQL）と`cause.message`のみを出し、`params`・`message`・`stack`は出さない。それ以外の`Error`は`message`・`stack`を出す（想定外エラーの`message`・`stack`の全文出力は、pinoのerrシリアライザやSentryなどで広く見られる方式のため現状維持。既知の入力値の混入経路はDrizzleだけで、それは上の分岐で塞いでいる。libsqlクライアントやClerk、将来のGeminiアダプタのエラーが`message`に入力値を含むかは調べていない）。`error`オブジェクトは渡さない（`Error`の`message`・`stack`は列挙不可のため、渡しても`JSON.stringify`で`{}`になり調査の材料が消える）。値を伏せ字にする方式（マスク）は採らない。文字列中のどこが値かをコードで切り出す必要があり、どの値が機微かも判断できず、結局`params`を全部伏せることになるため、出さないほうが単純
- **Drizzleのときに`stack`を出さない理由（2026-09-26決定）:** 当初は「`stack`は`at`で始まる行だけ出す」としていたが、これは誤り。`message`の`params`に「改行＋`at `」を含む入力値が入ると、`at`フィルタを通り抜けて漏れることを実験で確認した（Node 24＋drizzle-orm 0.45.2）。`DrizzleQueryError`は`super(message)`の後に`Error.captureStackTrace`を呼ぶだけで`name`は設定しないため、`stack`の先頭は`Error: Failed query: ...\nparams: ...`になる（`errors.js`で確認）。「ヘッダ全体を先頭一致で切り落とし、残りを出す」方式なら漏れずにハンドラ側の呼び出し行が残ることも実験で確認したが、採らなかった。(1) 前例が見つからず、実務の主流は「`params`も`stack`も出さない」（[quackback PR #166](https://github.com/venturi-systems/quackback/pull/166)は`error.stack`が`message`で始まる点を理由に、エラーオブジェクトをロガーに渡さない）。(2) V8の`stack`の書式への依存が要る（Bun（JavaScriptCore）ではハンドラ側の行が出ない）。(3) 本番のサーバー側ソースマップは`experimental.serverSourceMaps`と`NODE_OPTIONS=--enable-source-maps`が必要で、両方experimentalのため保証がなく（[vercel/next.js Discussion #66146](https://github.com/vercel/next.js/discussions/66146)）、有効にしないとstackの行はバンドル後の位置になり、失敗箇所の手がかりとして弱い。OWASPもスタックトレースを主のログと別扱いにする選択肢を示している。**既知の限界:** 同一エンドポイント内で同じSQLが複数回実行される場合、どの呼び出しが失敗したかは`query`だけでは区別できない（`method`・`path`は全行に付く）。実務の判断基準（公式のベストプラクティスまたは実務でよく使われる手法）を優先して受け入れた
- **`cause.message`に値が入らないことを確認した（2026-09-26）:** libsql（`:memory:`）でDrizzle 0.45を使い、NOT NULL・CHECK・外部キー・構文エラーを実際に起こして確認した。`cause.message`は`SQLITE_CONSTRAINT: NOT NULL constraint failed: c.name`・`SQLITE_CONSTRAINT: CHECK constraint failed: amount > 0`・`SQLITE_CONSTRAINT: FOREIGN KEY constraint failed`・`SQLITE_ERROR: near "?": syntax error`で、入力値は入らない（出るのはテーブル名・列名・CHECKの式などスキーマ側の情報）。UNIQUEも確認済み（`UNIQUE constraint failed: memos.title`）。ローカルのlibsqlでの結果で、本番のTurso（リモート接続）で同じ文言になるかは実測していない

**`errorHandler`は`HTTPException`のステータスが404の場合、`c.var.logger.warn()`でIDOR試行の疑いとして一律記録する（`event: 'malicious_direct_reference'`と`userId`を付ける）。** 詳細は[IDOR対策の該当項](#idor不正な直接オブジェクト参照対策cwe-639)を参照。

**`Logger`型の呼び出し形は`(fields, message)`の順（オブジェクトが先、メッセージが後）とする（2026-09-19決定）。** `@hono/structured-logger`のREADMEの例（`logger.info({ method, path, elapsedMs }, 'request completed')`）がこの順で、将来pinoに差し替える際も呼び出し側を変えずに済むため。`fields`は`Record<string, unknown>`で必須とする。`message`は日本語の固定文言（状況で変わる文章ではなく、検索できる識別子として使う）、キー名は英語とする。

**ログに載せる項目（2026-09-19決定）:** [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html)の「いつ・どこで・誰が・何を」に沿う。

- `timestamp`・`level`・`message`: `logger.ts`が付与する
- `requestId`・`method`・`path`: リクエスト開始時点で分かるため、`createLogger(c)`で全ログ行に付与する（`path`はクエリ文字列を含まない）
- `userId`: ロガー生成時点では認証が終わっていないため、呼び出し側（`errorHandler`等）が`getAuth(c)?.userId`で`fields`に足す
- `status`・`elapsedMs`: リクエスト完了ログ（下記）で、`logRequestCompleted`が`fields`に足す。完了ログへの`userId`の追加は未実装（下記）

**リクエスト/レスポンスのボディはログに出さない（2026-09-19決定）。** 金額・メモ・家族の氏名など、[列暗号化の対象](#機微データの列暗号化アプリ層暗号化cwe-3112026-08-23決定)を含む個人データが混入するため（OWASPも機微な個人データの記録を禁止している）。不正リクエストの調査は、`userId`・`method`・`path`（IDORならパスに対象IDが入る）等のメタデータで行う。特定項目の値が必要になった場合は、項目を絞り、長さを制限し、ログ注入（改行文字等）対策のサニタイズを行ったうえで出す。400の検証エラーで`field`（Zodの`path`）を残す拡張は、必要になった時点で検討する。

**リクエスト完了ログ（canonical log line）を、全リクエストに1行出す（2026-09-21決定）:**

- **構成:** `server/lib/logger.ts`はHonoにもHTTPにも依存させない（pino等へ差し替える場所）。Honoに依存する部分は`server/lib/request-logger.ts`に置き、`requestLogger`（`structuredLogger`の設定。`createLogger({ requestId, method, path })`と`onResponse`・`onError`）・`levelFromStatus`・`logRequestCompleted`を持つ。`route.ts`は`app.use(requestId())`→`app.use(requestLogger)`の2行だけ（`requestLogger`は`c.var.requestId`を使うため`requestId()`が先）。テスト用アプリは`createTestApp()`が同じ配線を済ませるので`c.var.logger`が使える（[testing-strategy.md](./testing-strategy.md)の「テスト用appの共通配線」参照）
- **`onResponse`と`onError`の両方が必要:** 実験で、`HTTPException`や`Error`を投げたリクエスト（400・404・409・500）は`onError`にだけ来て`onResponse`は呼ばれないこと、`c.json`で直接返す401（認証ミドルウェア）は`onResponse`に来ることを確認した。どちらも`c.res.status`が取れる。両方で同じ`logRequestCompleted`を呼ぶ
- **`errorHandler`の引数`c`は型付けしない（2026-09-26決定）:** `c: Context`のまま（`Context`の`Env`の既定値は`any`のため`c.var.logger`の型は`any`になる）。`Context<StructuredLoggerEnv<Logger>>`で型付けすれば`c.var.logger.eror(...)`のような打ち間違いを書いた時点で検出できるが、必須ではないため見送った。見送りの根拠: Hono公式の[Error Handling](https://hono.dev/docs/api/hono)は`app.onError((err, c) => ...)`の`c`に型を付ける例を示しておらず、`@hono/structured-logger`のREADMEも入口の`app`を`new Hono()`（`<>`なし）のまま使っている。このプロジェクトの`route.ts`とテスト用appも同じく`Env`の総称型を付けない。`errorHandler`のテスト（[タスク26](../../tasks/cross-cutting/security-hardening.md)）でも`logger.error`の呼び出しは検証できる。**この方針は順守が必須ではなく、将来変更してよい**。型付けする場合は`Context<StructuredLoggerEnv<Logger>>`にし、`app.onError(errorHandler)`で型エラーが出たら`route.ts`と`createTestApp`の`app`にも`StructuredLoggerEnv<Logger>`を足す
- **`err`（`onError`の引数）は使わない:** エラーの詳細（`message`・`stack`）は`errorHandler`に集約する。完了ログにも出すと同じ情報が2回になり、失敗したクエリの値が入りうる`message`（CWE-532）の出力箇所が増えるため。同じリクエストのログは`requestId`でつながる
- **レベルはステータスで決める:** 500以上は`error`、400以上は`warn`、それ以外は`info`。根拠は、pino-httpの`customLogLevel`（[README](https://github.com/pinojs/pino-http)）とHono＋pinoの実例（[Apitally](https://apitally.io/blog/hono-logging-guide)）が同じ基準であること。4xxを`error`にしない点は資料の意見が一致する（[NalleRooth](https://nallerooth.com/posts/dont-log-http-400-as-error/)）。`info`か`warn`かは資料で分かれるが、404のIDOR疑い（`warn`）や401の追跡を考え、4xxは`warn`に統一する。Vercelでは`console.warn`が通常の関数でErrorとして表示されるため、Errorの絞り込みに4xxが混ざる副作用がある（4xxのリクエストはVercelが自動でWarningとマークするので見落としは起きない）。この調整は`output`の対応表で行い、意味としてのレベル（JSONの`level`）は変えない
- **1行に絞る根拠:** [Stripe](https://stripe.com/blog/canonical-log-lines)・[Better Stack](https://betterstack.com/community/guides/logging/logging-best-practices/)は、リクエストの終わりに要約を1行出す方式を推奨し、失敗したリクエストでも必ず出す（Stripeは`ensure`ブロック）。pino-httpも応答が終わったときに`request completed`を出す。`onRequest`（開始ログ）は入れない（開始ログを勧める資料は見つからず、1リクエストのログが倍になるため。「始まったのに終わらないリクエスト」を調べたくなった時点で足す）
- **Vercelの既存機能との重複:** Vercelは、メソッド・パス・ステータス・実行時間・Request Idをログ詳細に標準で出す。`status`・`elapsedMs`だけの完了ログはそれと重なるため、**`userId`など、アプリの中でしか分からない情報を足すことで価値が出る**。`userId`の追加は未実装（認証後に`c.var`から取れる値を`fields`に足す）
- **AWS移行時の注意:** AWS Lambdaは、`level`と`timestamp`（RFC 3339）のキーを持つ自前のJSONを出力すれば、その`level`でログレベルの絞り込みができ、標準の`console.warn`はWARNとして扱われる（[AWS公式](https://docs.aws.amazon.com/lambda/latest/dg/nodejs-logging.html)）。今のJSON（`level`・`timestamp`）はこの形式に合う。`level`の値の大文字・小文字は未確認で、移行時に確認する

**将来検討:** 送信元IP。OWASPは「送信元アドレス」を記録項目に挙げるが、個人情報にもなりうるため、扱いとVercel上での取得方法を確認してから判断する。あわせて、Vercelのログ保存期間が短い（Hobbyは1時間）ため、セキュリティイベントの長期保存（Log Drains等）も検討する。

## セキュリティヘッダー（2026-08-23決定）

**CSP（Content-Security-Policy）**: `apps/web/proxy.ts`の`clerkMiddleware`が持つ`contentSecurityPolicy`オプションで設定する（[Clerk公式ドキュメント](https://clerk.com/docs/guides/secure/best-practices/csp-headers)）。CSPを`next.config.ts`の`headers()`で自前定義すると、ClerkのFAPIホスト・Cloudflare bot対策等の許可漏れで認証が壊れるリスクがあるため、Clerk側の仕組みに乗せる。clickjacking対策として`frame-ancestors: 'none'`をカスタムdirectiveで追加する。

**その他のヘッダー**: CSP以外は`apps/web/next.config.ts`の`headers()`で設定する。

| ヘッダー                    | 値                                    | 目的                                                                   |
| --------------------------- | ------------------------------------- | ---------------------------------------------------------------------- |
| `X-Content-Type-Options`    | `nosniff`                             | MIMEスニッフィング対策（レシート画像アップロード機能があるため）       |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains` | HTTPSへのダウングレード・中間者攻撃対策（Vercelは自動HTTPS化だが明示） |
| `X-Frame-Options`           | `DENY`                                | clickjacking対策（CWE-1021。CSPの`frame-ancestors`と二重の防御）       |
| `Referrer-Policy`           | `strict-origin-when-cross-origin`     | 他サイトへの遷移時にURLの詳細情報を渡さない                            |

## Tursoトークンの運用方針（2026-08-23決定）

Tursoの認証トークンはデータベース単位・読み取り専用/書き込み可・有効期限でスコープを絞れる（[Turso公式のAuthorization](https://docs.turso.tech/sdk/authorization)）。

- **DB単位にスコープする**: `TURSO_AUTH_TOKEN`は対象のデータベース1つだけに絞ったトークンを使う（組織全体に及ぶトークンは使わない）
- **有効期限を設定する**: 90日を既定とし、失効前にVercelの環境変数を再発行・更新する（無期限トークンは「漏れても気づかない」リスクの温床になるため）
- **読み取り専用トークンへの分離は現時点では不要**: このアプリはHonoの同一サーバーが読み書き両方を行うアーキテクチャのため、アプリ本体用トークンを読み取り専用に分離しても複雑さが増すだけで得られる効果が薄い。将来、分析用途やDrizzle Studioでの手動閲覧等、書き込み不要な用途が増えた場合はその用途専用の読み取り専用トークンを別途発行する

## 依存パッケージの既知脆弱性（CVE）対策（CWE-1104）（2026-08-23決定）

- **CI**: `.github/workflows/ci.yml`に`bun audit`のステップを追加する。**2026-08-23時点で既存の脆弱性（58件、High 22件含む。本番依存では`@libsql/client`経由の`ws`が対象）が残っているため、修正が完了するまでは非ブロッキング（`bun audit || true`）で運用する**。修正完了後、`|| true`を外してブロッキングに戻す
- **GitHub Dependabot Alerts**: リポジトリ設定（Code security）で有効化する（設定ファイル不要）。既知脆弱性の発見を通知で受け取る
- **シークレットの誤コミット検知**: `.github/workflows/ci.yml`（または別ワークフロー）に`gitleaks`（`gitleaks/gitleaks-action`）を追加し、API キー・トークンの誤コミットをPR時に機械的に検知する

## SAST（静的解析）によるコード脆弱性検出（2026-09-13決定）

依存パッケージのCVEだけでなく、**自前コードに書き込んだ脆弱性（IDOR・XSS・SSRF等）をCIで機械的に検出する**ため、GitHubネイティブの CodeQL を導入する。

- **CodeQLのDefault setup**を使う（`.github/workflows/`への自前ワークフロー追加は不要。GitHubのリポジトリ設定＞Code security＞Code scanningから有効化するだけ）。リポジトリがPublicのため、GitHub Advanced Securityの機能は無料で利用できる
- **クエリスイートはDefault**（誤検知が少ない厳選ルールセット）を使う。Extended（カバレッジは広いが誤検知も増える）は運用に慣れてから検討する
- **ブランチ保護ルールでHigh/Critical severityの検出時のみPRマージをブロックする**。Low/Medium severityは非ブロッキングで注意喚起のみに留め、初動の対応コストを抑える
- CodeQLは検出結果に**CWE番号を自動付与**する（GitHubのSecurityタブ・PRのアノテーションに表示される）。[CWE番号の注記方針](#cweマッピングの方針2026-09-13決定)も参照

将来、自前ルール（このアプリ固有の「暗号化対象フィールドを暗号化せず保存していないか」等）を検出したくなった場合は、Semgrep（CLIは無料）を補完として追加することを検討する。

## CWEマッピングの方針（2026-09-13決定）

CWE（Common Weakness Enumeration）は脆弱性の分類体系。**自動マッピングの仕組みは作らない。**

- **検出はSASTツール（CodeQL）の自動タグ付けに任せる**。CodeQLの検出結果には標準でCWE番号が付与され、GitHubのSecurityタブで確認できるため、自前の対応表やマッピング基盤を構築する必要がない
- 本ドキュメントの各決定事項には、国際的な分類との対応が分かりやすいよう**参考としてCWE番号を手動で注記する**（例: [IDOR対策](#idor不正な直接オブジェクト参照対策cwe-639)の「CWE-639」）。これは監査証跡やコンプライアンス目的の網羅的なマッピング表ではなく、読み手の理解を助けるための軽量な注記

## レシート画像アップロードのファイル検証（CWE-434）（2026-08-23決定）

拡張子・`Content-Type`ヘッダーは偽装可能なため、[レシート読み取り機能](../../specs/features/ai.md#1-レシート読み取り自動入力receipt_scan)の実装時は**ファイル先頭のマジックバイトで実際に画像形式か確認**してからGeminiに送信する（JPEG: `FF D8 FF`、PNG: `89 50 4E 47`、WebP: `RIFF....WEBP`）。軽量な検証のため専用パッケージは使わず、`server/lib/`に数十行程度の自前関数として実装する。

## Google Gemini APIキーの権限・予算上限（2026-08-23決定）

- **APIキーをGenerative Language APIのみに制限する**（Google AI Studio・Google Cloud Consoleのキー設定）。Vercelのデプロイは既定で動的IPのため、IPアドレス制限は使えない（[Vercel KB: 固定IPについて](https://vercel.com/kb/guide/can-i-get-a-fixed-ip-address)参照）
- **予算アラートと割り当て（Quota）の両方を設定する**: [Google Cloud公式](https://docs.cloud.google.com/billing/docs/how-to/budget-api-overview)の通り、**予算アラートは通知が来るだけでAPI呼び出しは止まらない**。実際に上限で止めるには別途Quota（APIs & Services > Quotas）の設定が必要。キーが漏れて[アプリ側の日次上限](../../specs/features/ai.md#共通方針)を経由せず直接叩かれた場合の被害を抑えるための最後の砦

## プロンプトインジェクション対策（2026-08-23決定）

[レシート読み取り機能](../../specs/features/ai.md#1-レシート読み取り自動入力receipt_scan)はユーザーがアップロードした画像の中身を信頼しない前提で扱う。悪意ある画像に隠しテキストを仕込み、Geminiを意図しない出力に誘導する攻撃（indirect prompt injection）が理論上成立するため、以下で影響範囲を絞る。

- **カテゴリ提案は構造化出力で既存カテゴリのみに制約する**（既存方針。任意の文字列を出力させない）
- **商品名（→メモ欄に反映される自由テキスト）は「Geminiが生成した、信頼できない入力」として扱う**。手入力のメモと同じ最大長・エスケープ処理（[XSS対策](#xssクロスサイトスクリプティングcwe-79)）を必ず経由させ、Geminiの出力だからといって検証をスキップしない

## CSRF対策（CWE-352）（2026-08-23決定・確認事項）

Clerkのセッションcookieはデフォルトで`SameSite=Lax`（[Clerk公式](https://clerk.com/docs/guides/secure/best-practices/csrf-protection)）。これは「状態を変更する操作をGETリクエストにしない」限りCSRFを防げる設定のため、**一覧取得はGET、作成・更新・削除はPOST/PUT/DELETEに限定する**という既存のREST規約を今後も崩さない（[api-conventions.mdのHonoルートの実装方針](./api-conventions.md#honoルートの実装方針)参照）。この規約が守られている限り、追加のCSRF対策（トークン発行等）は不要。

## Vercel環境変数のスコープ分離（2026-08-23決定）

Vercelの環境は Production・Preview・Development の3つがあり、**Previewデプロイ（PRごとのプレビュー環境）に本番相当の認証情報を渡さないのが公式ベストプラクティス**（[Vercel公式](https://vercel.com/docs/environment-variables/sensitive-environment-variables)）。

- `TURSO_AUTH_TOKEN`・`TURSO_CONNECTION_URL`: Preview環境には本番DBとは別のTurso DB（開発用）の値を設定する
- Gemini APIキー: Preview環境には本番より低い予算上限を設定した別キーを使う
- Clerkのシークレットキー: Clerk側もdevelopment/production instanceが分かれているため、対応するキーを環境ごとに設定する
- 上記いずれも、Vercelダッシュボードで「Sensitive」フラグを付ける（保存後は値が二度と表示されず、`vercel env pull`でも取得不可になる）

## Tursoのバックアップ・復旧（2026-08-23決定）

Tursoは継続的にバックアップを取っており、Point-in-Time Recovery（PITR）で任意時点への復元が可能（プランにより保持期間が異なる。[Turso公式](https://docs.turso.tech/features/point-in-time-recovery)）。復元は既存DBへの上書きではなく**新しいデータベースが作成される**ため、復元後はアプリの接続先（`TURSO_CONNECTION_URL`）を切り替える作業が発生する。「バックアップが取られている」ことの確認だけでなく、**実際に復元コマンド（`turso db create new-db --from-db old-db --timestamp ...`）を一度試し、復元後の接続切り替え手順を確認しておく**（本番障害時に手順を初めて試すことがないようにするため）。

- 自動更新PR（Dependabot version updates または Renovate）の導入は将来検討とする

## その他フレームワーク・サービスが対応済みのもの

| 項目                 | 対応                                                                |
| -------------------- | ------------------------------------------------------------------- |
| 認証・セッション管理 | Clerk が担当                                                        |
| HTTPS / TLS          | Vercel が自動適用                                                   |
| 入力バリデーション   | Zod（フロントエンド・バックエンド両方）                             |
| APIキー等の秘匿      | 環境変数で管理（`NEXT_PUBLIC_` プレフィックスは公開されるため注意） |

## 今後対応が必要になる可能性があるもの

- **レートリミット**: ユーザー数が増えた場合に Hono ミドルウェアで対応
- **依存パッケージの自動更新PR**: Dependabot version updates または Renovate の導入
