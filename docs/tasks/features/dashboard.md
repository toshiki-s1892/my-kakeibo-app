# ダッシュボード

仕様の詳細は [specs/features/dashboard.md](../../specs/features/dashboard.md) を参照。

## バックエンド

- [ ] 1. `server/lib/`に、月+`familyMemberId`で取引を集計するヘルパー関数を作成（サマリー・カテゴリ別集計・過去6ヶ月推移で共通利用）
- [ ] 2. `server/routes/dashboard/schema.ts`・`handler.ts`・`index.ts` を作成
  - GET `/api/dashboard?month=YYYY-MM&familyMemberId=`（サマリー・カテゴリ別集計・過去6ヶ月推移をまとめて返す）
- [ ] 3. カテゴリ別集計は「`parentId`を持つカテゴリの金額を親に合算→`category_pins`にあり且つ金額が0より大きいカテゴリ（グループ）を優先表示（金額0のピン留めは枠を消費しない）→残り枠を金額上位で補完→漏れたカテゴリは「その他」に集約」のロジックをサーバー側で実装（[categories.md](./categories.md)の`parentId`・`category_pins`追加タスクに依存）
- [ ] 4. 選択中の月・メンバーに支出が1件もない場合の空状態レスポンス/表示を実装

## フロントエンド

- [ ] 1. （画面デザイン確定後に着手）
- [ ] 2. グラフライブラリの選定（現段階では未決定。デザイン確定後に検討）

## クリーンアップ

- [ ] 1. （未定）
