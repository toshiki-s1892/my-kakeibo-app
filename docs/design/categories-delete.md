# カテゴリ管理（削除）

[機能仕様](../specs/features/categories.md)に対応するカテゴリ削除確認AlertDialog。[categories-list.md](./categories-list.md)の各行の削除アイコン（独自カテゴリのみ）から開く。見た目の共通フレームワークは[modals.md](./modals.md#alertdialog共通構成カテゴリ削除確認家族メンバー削除確認取引削除確認)を参照。

## 関連画面

| 遷移元 | 遷移先 |
|---|---|
| [categories-list.md](./categories-list.md)各行の削除アイコン（独自カテゴリのみ） | カテゴリ削除確認AlertDialog（同画面上にAlertDialog表示） |

全体の遷移図は[architecture/screen-flow.md](../architecture/screen-flow.md)を参照。

## 関連API

| メソッド | パス | 用途 |
|---|---|---|
| DELETE | `/api/categories/:id` | カテゴリ論理削除 |

詳細は[機能仕様のAPIエンドポイント](../specs/features/categories.md#apiエンドポイント)を参照。

## 採番済みスクリーンショット

すべてPC版。SP版は未生成（[仕様外要素](#仕様外要素実装時は無視すること)参照）。

![カテゴリ削除確認AlertDialog](./screenshots/modal-category-delete-pc.png)

Stitch Screen ID: `screens/804616cc5c174019995c877203c09bec`

## パーツ一覧

共通の枠組み（警告アイコン・フッターのボタン配置）は[modals.mdのAlertDialog共通構成](./modals.md#alertdialog共通構成カテゴリ削除確認家族メンバー削除確認取引削除確認)を参照。

| 名称 | 説明 |
|---|---|
| タイトル | 対象名を含む確認文（例:「『サブスク代』を削除しますか？」） |
| 本文 | 削除の影響範囲の説明文。定期取引テンプレート停止+過去履歴維持を明記 |

## 状態一覧

特になし（確認ダイアログのため空状態は発生しない）。

## レスポンシブ差分

SP版は未生成のため記載なし（[仕様外要素](#仕様外要素実装時は無視すること)参照）。

## 採用した方向性

AlertDialog（削除確認系）の統一構成: アンバー系の警告アイコン、対象名入りタイトル、削除の影響範囲の説明文、「キャンセル」+赤系「削除する」を右寄せ配置（[modals.md](./modals.md#採用した方向性)参照）。

## 既存実装との差分

未実装のため差分なし。

## 仕様外要素（実装時は無視すること）

- 背景に表示されている下層画面は、Stitchが生成時に参照した旧バージョンであることが多く、実装時の背景画面は[categories-list.md](./categories-list.md)の確定モックアップを参照すること
- SP（モバイル）版は未生成。実装時にshadcn/uiのAlertDialogのレスポンシブ挙動に委ねてよい

## 更新履歴

| 日付 | 変更内容 |
|---|---|
| 2026-06-22 | 全画面作り直し方針のもと再生成し確定。`modals.md`に集約していた内容から分割し、本ファイルとして独立 |
