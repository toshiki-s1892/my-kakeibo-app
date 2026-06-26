# (app)レイアウト構成

仕様の詳細は [architecture/overview.md](../../architecture/overview.md#applayoutレイアウト構成) を参照。

## フロントエンド

- [ ] 0. `apps/web/app/layout.tsx` の `metadata`（`title`・`description`）を「かけぼ」用に更新（現状`"Clerk Next.js Quickstart"`のまま）
- [ ] 1. （画面デザイン確定後に着手）`apps/web/app/(app)/layout.tsx` にヘッダー（画面タイトル + ClerkのUserButton）を実装。`UserButton`の`appearance` propをStitchで決めた配色・トーンに合わせ、`afterSignOutUrl="/"`を指定
- [ ] 1-1. サインアウト時に`queryClient.clear()`を呼ぶ処理を実装（[auth-sequence.md](../../architecture/auth-sequence.md#サインアウト)参照。家族でデバイスを共有する場合に前のユーザーのキャッシュが残らないようにする）
- [ ] 2. 自前の下部固定タブバーコンポーネントをPC・スマホ共通で実装（ナビ項目5つ。PCでは幅いっぱいに伸ばさず中央寄せで幅を制限する）
- [ ] 3. 「+取引を追加」フローティングボタンをPC・スマホ共通レイアウトに実装し、下部タブバーに重ねて表示。`/transactions/new`へ遷移させる

## クリーンアップ

- [ ] 1. （未定）
