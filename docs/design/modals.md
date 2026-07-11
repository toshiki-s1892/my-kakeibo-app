# モーダル・確認ダイアログ（見た目パターン集）

[CLAUDE.mdのフォーム実装ルール](../../.claude/CLAUDE.md)に基づく、Dialog（フォーム入力）・AlertDialog（削除等の確認）・Popover（FABの選択メニュー）の**見た目の共通フレームワーク**（タイトル+×アイコンの配置、フッターのボタン配置等、画面をまたいで共通するパターン）をStitchで可視化したモックアップ集。

**画面固有のフォーム項目・業務ロジック・関連API・採用理由は各画面のcreate/edit/delete.mdに記載する**（[2026-06-22決定](./_template.md)）。本ファイルはDialog/AlertDialog/Popoverという「コンポーネント種別」単位の見た目の枠組みのみを管理し、各画面ファイルからリンクで参照される。

## 関連画面

| パターン                                         | 開く操作                                                                  | 詳細を記載しているファイル                                       |
| ------------------------------------------------ | ------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| FAB2択ポップアップ                               | 全画面共通の「+ 取引を追加」FABタップ（どこからでも）                     | [transactions/create.md](./transactions/create.md)               |
| カテゴリ新規追加Dialog                           | [カテゴリ管理一覧](./categories/list.md)の「新しいカテゴリを追加」ボタン  | [categories/create.md](./categories/create.md)                   |
| カテゴリ編集Dialog                               | カテゴリ行の編集アイコン（独自カテゴリのみ）                              | [categories/edit.md](./categories/edit.md)                       |
| カテゴリ削除確認AlertDialog                      | カテゴリ行の削除アイコン（独自カテゴリのみ）                              | [categories/delete.md](./categories/delete.md)                   |
| 家族メンバー追加Dialog                           | [家族構成管理一覧](./family-members/list.md)の「家族を追加」ボタン        | [family-members/create.md](./family-members/create.md)           |
| 本人(SELF)情報編集Dialog・家族メンバー編集Dialog | 家族構成管理の各行の編集アイコン                                          | [family-members/edit.md](./family-members/edit.md)               |
| 家族メンバー削除確認AlertDialog                  | 家族構成管理の本人以外の行の削除アイコン                                  | [family-members/delete.md](./family-members/delete.md)           |
| 取引削除確認AlertDialog                          | [取引記録一覧](./transactions/list.md)の削除アイコン                      | [transactions/delete.md](./transactions/delete.md)               |
| 取引編集Dialog                                   | [取引記録一覧](./transactions/list.md)の行クリック                        | [transactions/edit.md](./transactions/edit.md#単体編集)          |
| 一括削除確認AlertDialog                          | [取引記録一覧](./transactions/list.md)選択中バーの「一括削除」            | [transactions/edit.md](./transactions/edit.md#一括削除)          |
| 取引先新規追加Dialog                             | [取引先一覧](./transaction-parties/list.md)の「新しい取引先を追加」ボタン | [transaction-parties/create.md](./transaction-parties/create.md) |
| 取引先編集Dialog                                 | 取引先一覧の各行の編集アイコン                                            | [transaction-parties/edit.md](./transaction-parties/edit.md)     |
| 取引先削除確認AlertDialog                        | 取引先一覧の各行の削除アイコン                                            | [transaction-parties/delete.md](./transaction-parties/delete.md) |

全体の遷移図は[architecture/screen-flow.md](../architecture/screen-flow.md)を参照。関連APIは各パターンの詳細ファイルを参照。

## 採番済みスクリーンショット（Stitchモックアップ一覧）

すべてPC版。SP版は未生成（[仕様外要素](#仕様外要素実装時は無視すること)参照）。

| パターン             | コンポーネント種別 | スクリーンショット                                                   | Screen ID                                  |
| -------------------- | ------------------ | -------------------------------------------------------------------- | ------------------------------------------ |
| FAB2択ポップアップ   | Popover            | [画像](./screenshots/modal-fab-popup-pc.png)                         | `screens/6eadda98419a4b339390f519ff0ce5fc` |
| カテゴリ新規追加     | Dialog             | [画像](./screenshots/modal-category-add-pc.png)                      | `screens/edfd5598b2d74a5f8d18d4fc350138ba` |
| カテゴリ削除確認     | AlertDialog        | [画像](./screenshots/modal-category-delete-pc.png)                   | `screens/804616cc5c174019995c877203c09bec` |
| 家族メンバー追加     | Dialog             | [画像](./screenshots/modal-family-add-pc.png)                        | `screens/ad5d2305d3144156ab8fd43bd1d24d15` |
| 本人（SELF）情報編集 | Dialog             | [画像](./screenshots/modal-self-edit-pc.png)                         | `screens/daa93ce80ec9400382b68dbfedf13988` |
| 家族メンバー削除確認 | AlertDialog        | [画像](./screenshots/modal-family-delete-pc.png)                     | `screens/6dbfc7ebdf0141abb5c21522b6ca67e3` |
| 取引削除確認         | AlertDialog        | [画像](./screenshots/modal-transaction-delete-pc.png)                | `screens/439b75d3bf764c02bff7ce032f1b8d6d` |
| 取引先新規追加       | Dialog             | [画像](./screenshots/modal-transaction-party-add-pc-numbered.png)    | `screens/85cb28bfe42146d4a72de9aa30df8407` |
| 取引先編集           | Dialog             | [画像](./screenshots/modal-transaction-party-edit-pc-numbered.png)   | `screens/ddb322c65ea54b18bb6509478248ec83` |
| 取引先削除確認       | AlertDialog        | [画像](./screenshots/modal-transaction-party-delete-pc-numbered.png) | `screens/20956e8371fa4939a5f7d527b074811e` |
| 取引編集             | Dialog             | [画像](./screenshots/modal-transaction-edit-pc-numbered.png)         | `screens/5c3994a79a1449c78f8e09d7a5a89304` |
| 一括削除確認         | AlertDialog        | [画像](./screenshots/modal-transaction-bulk-delete-pc-numbered.png)  | `screens/97b946ed46d14143aa79840dd0eb6c78` |

（いずれもStitchプロジェクト `4767028127555592417` 内）

## パーツ一覧

### FAB2択ポップアップ

| 名称                 | 説明                                                                            |
| -------------------- | ------------------------------------------------------------------------------- |
| メニューカード       | FABの直上に表示する角丸の白背景カード、軽いシャドウ                             |
| 「手入力で作成」     | ペンシルアイコン付き。タップで`/transactions/new`（通常モード）                 |
| 「レシートから作成」 | カメラアイコン付き。タップでレシート読み取りUIを開いた状態の`/transactions/new` |

### Dialog共通構成（カテゴリ新規追加・家族メンバー追加・本人情報編集）

| 名称                     | 説明                                                                                                                                                                                                     |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| タイトル+閉じる×アイコン | Dialog上部に左寄せタイトル、右上に×アイコン                                                                                                                                                              |
| フォーム本体             | パターンごとの入力項目（画面固有のため[categories/create.md](./categories/create.md)・[family-members/create.md](./family-members/create.md)・[family-members/edit.md](./family-members/edit.md)を参照） |
| フッター                 | 「キャンセル」（グレーテキストボタン）+ プライマリアクション（エメラルドグリーンの塗りボタン）を右寄せ配置                                                                                               |

### AlertDialog共通構成（カテゴリ削除確認・家族メンバー削除確認・取引削除確認）

| 名称         | 説明                                                                                                                                                                                                     |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 警告アイコン | アンバー系の三角に!アイコン                                                                                                                                                                              |
| タイトル     | 対象名を含む確認文（例:「『サブスク代』を削除しますか？」）                                                                                                                                              |
| 本文         | 削除の影響範囲の説明文（画面固有のため[categories/delete.md](./categories/delete.md)・[family-members/delete.md](./family-members/delete.md)・[transactions/delete.md](./transactions/delete.md)を参照） |
| フッター     | 「キャンセル」（グレーテキストボタン）+「削除する」（赤系の塗りボタン）を右寄せ配置                                                                                                                      |

## 採用した方向性

- **Dialog（フォーム入力系）**: タイトル+右上×アイコン、フォーム本体、フッターに「キャンセル」+プライマリアクションを右寄せ配置、という構成を全パターンで統一
- **AlertDialog（削除確認系）**: アンバー系の警告アイコン、対象名入りタイトル、削除の影響範囲の説明文、「キャンセル」+赤系「削除する」を右寄せ配置、という構成を全パターンで統一
- **FAB2択ポップアップを新規作成**: 旧版では`architecture/overview.md`で方針は確定済みながらモックアップ自体が「未作成」のまま放置されていた欠落パーツ。Stitchの静止画キャプチャはJSで`opacity:0`制御されるポップオーバーの開閉アニメーションを反映できない仕様上の制約があったため、「最初から開いた状態で描画する」よう明示的に指示して解消した

画面固有の採用理由（アイコン・色ピッカー追加の経緯、本人編集モーダルの特別対応等）は各画面のcreate/edit/delete.mdに記載。

## 既存実装との差分

未実装のため差分なし。

## 仕様外要素（実装時は無視すること）

- 各モーダルの背景に表示されている下層画面は、Stitchが生成時に参照した旧バージョン（サイドバーナビ・ロゴ・ヘッダー内ナビリンク等）であることが多く、実装時の背景画面は[各機能の確定モックアップ](./README.md)を参照すること。モーダル自体の構成（フォーム項目・ボタン配置）のみがこのドキュメントの参照対象
- SP（モバイル）版の同等モーダルは未生成。レイアウトは画面幅に応じてDialog/AlertDialogが画面下部からのシート形式になる可能性があるが、Stitchでの個別検証は行っていない。実装時にshadcn/uiのDialog/AlertDialogのレスポンシブ挙動に委ねてよい

## 更新履歴

| 日付                | 変更内容                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-06-22          | 全画面作り直し方針のもと7パターン（FAB2択ポップアップ・カテゴリ新規追加・カテゴリ削除確認・家族メンバー追加・本人情報編集・家族メンバー削除確認・取引削除確認）を再生成・新規作成し確定。FAB2択ポップアップ（旧版で「未作成」のまま放置）を新規作成し、カテゴリ新規追加Dialogにアイコン・色ピッカーUIを追加。`_template.md`の新フォーマット（関連画面・関連API・採番済みスクリーンショット・パーツ一覧）に合わせて全面リライト |
| 2026-06-22（2回目） | 一覧・新規作成・編集・削除が1ファイルに混在し読みづらいとのユーザー指摘を受け、画面固有のフォーム項目・関連API・採用理由を各画面のcreate/edit/delete.mdに分割。本ファイルはDialog/AlertDialog/Popoverの見た目の共通フレームワークのみを管理する「見た目パターン集」に位置づけを変更                                                                                                                                            |
