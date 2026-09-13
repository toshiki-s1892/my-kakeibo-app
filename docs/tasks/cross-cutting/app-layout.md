# (app)レイアウト構成

仕様の詳細は [architecture/overview.md](../../architecture/overview.md#applayoutレイアウト構成) を参照。

## フロントエンド

- [ ] 0. `apps/web/app/layout.tsx` の `metadata`（`title`・`description`）を「かけぼ」用に更新（現状`"Clerk Next.js Quickstart"`のまま）
- [x] 1. `apps/web/app/(app)/layout.tsx`にヘッダー（画面タイトル + ClerkのUserButton）を実装（[Header.tsx](../../../apps/web/app/components/Header.tsx)、`usePathname()`から画面タイトルを算出）
  - [ ] 1a. `UserButton`の`appearance` propをStitchで決めた配色・トーンに合わせる（未実装）
  - [ ] 1b. `afterSignOutUrl="/"`を指定（未実装）
- [ ] 1-1. サインアウト時に`queryClient.clear()`を呼ぶ処理を実装（[auth-sequence.md](../../architecture/auth-sequence.md#サインアウト)参照。家族でデバイスを共有する場合に前のユーザーのキャッシュが残らないようにする）
- [x] 2. 自前の下部固定タブバーコンポーネントをPC・スマホ共通で実装（[Footer.tsx](../../../apps/web/app/components/Footer.tsx)、ナビ項目5つ、`usePathname()`によるアクティブ状態判定・`aria-current`・アイコンはSVGRコンポーネント化。詳細は[common-components.mdの採用した方向性](../../design/common-components.md#採用した方向性)参照）
  - [ ] 2a. PCでは幅いっぱいに伸ばさず中央寄せで幅を制限する（[architecture/overview.md](../../architecture/overview.md#applayoutレイアウト構成)の「メインコンテンツと同じ最大幅[1200px]に揃える」仕様が未反映。現状PCでも`w-full`で画面幅いっぱいに広がる）
- [ ] 3. 「+取引を追加」フローティングボタンをPC・スマホ共通レイアウトに実装し、下部タブバーに重ねて表示。`/transactions/new`へ遷移させる

## クリーンアップ

- [ ] 1. （未定）
