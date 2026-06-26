# カテゴリ管理

仕様の詳細は [specs/features/categories.md](../../specs/features/categories.md) を参照。

## バックエンド

- [ ] 1. `packages/db/src/schema/categories.ts` に `deletedAt`（論理削除用）・`parentId`（自己参照、nullable。1階層のみの親カテゴリ）・`icon`（text、必須。lucide-reactのアイコン名）・`color`（text、必須。キュレーションした色キー）カラムを追加するマイグレーションを作成
- [ ] 2. デフォルトカテゴリ（支出12種・収入4種）のseed dataをマイグレーションで投入（各カテゴリに合う`icon`・`color`値も設定する）
- [ ] 3. `packages/db/src/schema/categoryPins.ts` を新規作成（`userId`・`categoryId`・`createdAt`、`(userId, categoryId)`に一意制約）し、マイグレーションを作成
- [ ] 4. `server/routes/categories/schema.ts`・`handler.ts`・`index.ts` を作成
  - GET `/api/categories`（`typeCode`クエリでフィルタ可。`category_pins`をJOINし、自分のピン留め状態も含めて返す）
  - POST `/api/categories`（名前重複チェック: デフォルト+自分のカテゴリを含めて同タイプ内で判定。`parentId`指定時は「対象が子を持たない」「`typeCode`が一致」を検証）
  - PUT `/api/categories/:id`（自分のカテゴリのみ編集可。重複チェックは自分自身を除外。`parentId`変更時も同様に検証）
  - PUT `/api/categories/:id/pin`（`category_pins`にINSERT。システムデフォルトカテゴリにも設定可能）
  - DELETE `/api/categories/:id/pin`（`category_pins`から自分の行をDELETE）
  - DELETE `/api/categories/:id`（論理削除。自分のカテゴリのみ。**子カテゴリの親に設定されている場合は409エラーで削除を拒否**（カスケードしない）。紐づく`recurring_transactions`テンプレートも連動して論理削除。事前に件数を返すエンドポイントまたはレスポンスへの含め方を実装時に検討）

## フロントエンド

- [ ] 1. （画面デザイン確定後に着手）
- [ ] 2. カテゴリ作成・編集フォームの「親カテゴリ」項目の近くに常設のヘルプテキストを表示（[specs/features/categories.md](../../specs/features/categories.md#親カテゴリグラフ上のグルーピング)の「発見しやすさへの配慮」参照）
- [ ] 3. カテゴリ作成・編集フォームにアイコンピッカーUI（lucide-reactからキュレーションした一覧）・色スウォッチピッカーUI（8〜10色程度）を実装（[specs/features/categories.md](../../specs/features/categories.md#カテゴリアイコン背景色)参照。アイコン一覧・色スウォッチ・アイコン→色のプリセット対応の選定もここで行う）

## クリーンアップ

- [ ] 1. （未定）

## 将来検討（今回はスコープ外）

- 初回利用時に「光熱費を1つにまとめるか分けるか」のようなカテゴリ設計をガイドするチュートリアル/ウィザード機能。`profile-setup`とは無関係の、カテゴリ管理画面側の将来的なUX改善案
