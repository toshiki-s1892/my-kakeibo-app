# カテゴリ管理

仕様の詳細は [specs/features/categories.md](../../specs/features/categories.md) を参照。

## バックエンド

- [ ] 1. `packages/db/src/schema/categories.ts` を以下の内容に更新する
  - `userId`を`NOT NULL`に変更（全カテゴリは必ず特定ユーザーの所有。システム共有のデフォルト行という概念を廃止）
  - `deletedAt`（論理削除用）・`parentId`（自己参照、nullable。1階層のみの親カテゴリ）・`icon`（text、必須。lucide-reactのアイコン名）・`color`（text、必須。キュレーションした色キー）は維持
  - `isDefaultPinTarget`を`isPinned`（boolean、`NOT NULL`、デフォルト`false`。EXPENSE側のみ意味を持つ）に置き換える
  - `category_pins`テーブル・`packages/db/src/schema/categoryPins.ts`は不要になるため削除する
  - [ ] 1-1. `(userId, typeCode, name)`の部分一意制約（`deletedAt IS NULL`の行のみ対象）を1本のみ追加する（自分の既存カテゴリ同士の名前重複に対するDB側の防御層。`userId`が必須になったため、システムデフォルトとの重複を考慮した2本目のインデックスは不要。詳細は[architecture/database.md](../../architecture/database.md)参照）。`transactionParties`に同様の制約を追加するかは別途検討（未決定）
- [ ] 2. 初期カテゴリ（支出12種・収入4種）のテンプレートを`packages/db/src/defaultCategories.ts`に`DEFAULT_CATEGORIES`定数として定義する（各カテゴリに合う`icon`・`color`値、`isPinned`値も設定する。`color`は`packages/common/src/db-constants.ts`の`CATEGORY_COLOR_CODE`を参照する）。`db:seed`のような独立したseedスクリプトは使わず、[プロフィールセットアップ完了時のトランザクション](../../tasks/features/profile-setup.md)内でこのテンプレートをコピーしてINSERTする。`id`は他の全テーブルと同様`crypto.randomUUID()`の自動生成のままでよい。支出12種の名称は[specs/features/categories.md](../../specs/features/categories.md#初期カテゴリプロフィールセットアップ時に自動作成)参照（住居費→「住まいの費用」、被服費→「服・靴」、娯楽費→「趣味・娯楽」に変更済み）
- [ ] 3. `server/routes/categories/schema.ts`・`handler.ts`・`index.ts` を作成
  - GET `/api/categories`（`typeCode`クエリでフィルタ可。自分の`categories`のみが対象なのでJOIN不要）
  - POST `/api/categories`（名前重複チェック: 自分のカテゴリ内で同タイプ内で判定。`parentId`指定時は「対象が子を持たない」「`typeCode`が一致」を検証）
  - PUT `/api/categories/:id`（自分のカテゴリのみ編集可。重複チェックは自分自身を除外。`parentId`変更時も同様に検証）
  - PUT `/api/categories/:id/pin`（`categories.isPinned`を`true`に更新。EXPENSEカテゴリのみ許可、INCOMEは400エラー）
  - DELETE `/api/categories/:id/pin`（`categories.isPinned`を`false`に更新。EXPENSE側のピン留めが最後の1件の場合は400エラー）
  - DELETE `/api/categories/:id`（論理削除。自分のカテゴリのみ。**子カテゴリの親に設定されている場合・ピン留め中の場合は409エラーで削除を拒否**（カスケードしない）。紐づく`recurring_transactions`テンプレートも連動して論理削除。事前に件数を返すエンドポイントまたはレスポンスへの含め方を実装時に検討）

## フロントエンド

- [ ] 1. （画面デザイン確定後に着手）
- [ ] 2. カテゴリ作成・編集フォームに「親カテゴリ」Select項目を追加（[design/categories/create.md](../../design/categories/create.md#今後反映予定の変更モックアップ未更新)参照。現行モックアップには未反映のため、Stitch再生成も別途必要）。その直下に常設のヘルプテキスト+ヘルプページ（`/help#categories`）へのリンクを表示（[specs/features/categories.md](../../specs/features/categories.md#親カテゴリグラフ上のグルーピング)の「発見しやすさへの配慮」参照）
- [ ] 3. カテゴリ作成・編集フォームにアイコンピッカーUI（lucide-reactからキュレーションした一覧）・色スウォッチピッカーUI（8〜10色程度）を実装（[specs/features/categories.md](../../specs/features/categories.md#カテゴリアイコン背景色)参照。アイコン一覧・色スウォッチ・アイコン→色のプリセット対応の選定もここで行う）

## クリーンアップ

- [ ] 1. （未定）

## 将来検討（今回はスコープ外）

- 初回利用時に「光熱費を1つにまとめるか分けるか」のようなカテゴリ設計をガイドするチュートリアル/ウィザード機能。`profile-setup`とは無関係の、カテゴリ管理画面側の将来的なUX改善案
