# 機微データの列暗号化

方針の詳細は [security.mdの機微データの列暗号化](../../architecture/decisions/security.md#機微データの列暗号化アプリ層暗号化2026-08-23決定) を参照。

## バックエンド

- [ ] 1. `server/lib/crypto.ts` に `encrypt()`/`decrypt()` を実装する（AES-256-GCM。暗号文フォーマットは`v1:<iv>:<ciphertext>`のように鍵バージョンを含める）。**`app/api/[...route]/route.ts`が`export const runtime = 'edge'`のためNode.jsの`crypto`モジュールは使えない。Web Crypto API（`crypto.subtle.encrypt`/`crypto.subtle.decrypt`、`{ name: 'AES-GCM' }`）で実装する**（2026-08-23確認）
- [ ] 2. `APP_ENCRYPTION_KEY`（32byte）をVercelの環境変数（Production限定公開）に追加する
- [ ] 3. `transaction_parties`の作成・更新・取得処理で`name`を`encrypt()`/`decrypt()`経由にする（[transaction-parties.md](../../specs/features/transaction-parties.md)のhandler）
- [ ] 4. `family_members`の作成・更新・取得処理で`name`・`birthday`を`encrypt()`/`decrypt()`経由にする（[family-members.md](../../specs/features/family-members.md)のhandler）
- [ ] 5. AIアドバイス機能（[ai.md](../../specs/features/ai.md#3-本格的アドバイスdetailed_advice)）のGeminiプロンプト生成箇所で、暗号化対象フィールドを復号して送信していないことを確認する（取引先名・家族の氏名はそもそもプロンプトに含めない方針のため）

## フロントエンド

- [ ] 1. （フロントエンド実装なし。API入出力は復号済みの平文のまま変わらない）

## クリーンアップ

- [ ] 1. （未定）

## 将来検討（今回はスコープ外）

- AWS KMSへの鍵基盤移行（`v2`鍵の追加、新規書き込みからの切り替え。既存`v1`データの一括再暗号化は不要な設計にしてある）
