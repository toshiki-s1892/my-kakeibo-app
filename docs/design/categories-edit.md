# カテゴリ管理（編集）

[機能仕様](../specs/features/categories.md)に対応するカテゴリ編集Dialog。[categories-list.md](./categories-list.md)の各行の編集アイコン（独自カテゴリのみ。デフォルトカテゴリは編集不可）から開く。

**専用のモックアップは生成していない**。[categories-create.md](./categories-create.md)のカテゴリ新規追加Dialogと同形式で、初期値に既存カテゴリの値（カテゴリ名・タイプ・アイコン・色）が入った状態として扱う。フォーム項目・見た目の枠組みは[categories-create.md](./categories-create.md)と[modals.mdのDialog共通構成](./modals.md#dialog共通構成カテゴリ新規追加家族メンバー追加本人情報編集)を参照。

## 関連画面

| 遷移元 | 遷移先 |
|---|---|
| [categories-list.md](./categories-list.md)各行の編集アイコン（独自カテゴリのみ） | カテゴリ編集Dialog（同画面上にDialog表示） |

全体の遷移図は[architecture/screen-flow.md](../architecture/screen-flow.md)を参照。

## 関連API

| メソッド | パス | 用途 |
|---|---|---|
| PUT | `/api/categories/:id` | カテゴリ編集（`icon`・`color`の変更も可能） |

詳細は[機能仕様のAPIエンドポイント](../specs/features/categories.md#apiエンドポイント)を参照。

## 採番済みスクリーンショット

専用のスクリーンショットはなし。[categories-create.md](./categories-create.md#採番済みスクリーンショット)のDialogと同一の見た目で、フォームに初期値が入った状態として扱う。

## パーツ一覧

[categories-create.md](./categories-create.md#パーツ一覧)と同一（カテゴリ名・タイプ・アイコン選択・色選択・プレビュー）。差分は以下のみ。

| 観点 | 新規作成との差分 |
|---|---|
| 初期値 | 各フォーム項目に編集対象カテゴリの既存値が入った状態で開く |
| 対象 | 独自カテゴリのみ（デフォルトカテゴリは編集アイコン自体を表示しない、[categories-list.md](./categories-list.md#パーツ一覧)パーツ⑥参照） |
| タイプ（支出/収入） | 既存カテゴリのタイプを引き継ぐが、編集可能かは要検討（本モックアップでは未確認） |

## 状態一覧

[categories-create.md](./categories-create.md#状態一覧)を参照。

## レスポンシブ差分

[categories-create.md](./categories-create.md#レスポンシブ差分)を参照。

## 採用した方向性

新規作成Dialogと同形式にすることで、ユーザーの学習コストを抑える（[categories-create.md](./categories-create.md#採用した方向性)参照）。

## 既存実装との差分

未実装のため差分なし。

## 仕様外要素（実装時は無視すること）

特になし。

## 更新履歴

| 日付 | 変更内容 |
|---|---|
| 2026-06-22 | 一覧・新規作成・編集・削除が1ファイルに混在し読みづらいとのユーザー指摘を受け、`categories.md`から分割して新規作成。専用モックアップはなく、新規作成Dialogとの差分のみを記載する形式とした |
