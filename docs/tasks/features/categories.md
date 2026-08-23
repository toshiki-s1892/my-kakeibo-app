# カテゴリ管理

仕様の詳細は [specs/features/categories.md](../../specs/features/categories.md) を参照。

## バックエンド

- [x] 1. `packages/db/src/schema/categories.ts` を以下の内容に更新する
  - `userId`を`NOT NULL`に変更（全カテゴリは必ず特定ユーザーの所有。システム共有のデフォルト行という概念を廃止）
  - `deletedAt`（論理削除用）・`parentId`（自己参照、nullable。1階層のみの親カテゴリ）・`icon`（text、必須。lucide-reactのアイコン名）・`color`（text、必須。キュレーションした色キー）は維持
  - `isDefaultPinTarget`を`isPinned`（boolean、`NOT NULL`、デフォルト`false`。EXPENSE側のみ意味を持つ）に置き換える
  - `category_pins`テーブル・`packages/db/src/schema/categoryPins.ts`は不要になるため削除する
  - [x] 1-1. `(userId, typeCode, name)`の部分一意制約（`deletedAt IS NULL`の行のみ対象）を1本のみ追加する（自分の既存カテゴリ同士の名前重複に対するDB側の防御層。`userId`が必須になったため、システムデフォルトとの重複を考慮した2本目のインデックスは不要。詳細は[architecture/database.md](../../architecture/database.md)参照）。`transactionParties`に同様の制約を追加するかは別途検討（未決定）
- [x] 2. 初期カテゴリ（支出12種・収入4種）のテンプレートを`apps/web/server/routes/profile/defaultCategories.ts`に`DEFAULT_CATEGORIES`定数として定義する（各カテゴリに合う`icon`・`color`値、`isPinned`値も設定する。`color`は`packages/common/src/db-constants.ts`の`CATEGORY_COLOR_CODE`を参照する）。`db:seed`のような独立したseedスクリプトは使わず、[プロフィールセットアップ完了時のトランザクション](../../tasks/features/profile-setup.md)内でこのテンプレートをコピーしてINSERTする。`id`は他の全テーブルと同様`crypto.randomUUID()`の自動生成のままでよい。支出12種の名称は[specs/features/categories.md](../../specs/features/categories.md#初期カテゴリプロフィールセットアップ時に自動作成)参照（住居費→「住まいの費用」、被服費→「服・靴」、娯楽費→「趣味・娯楽」に変更済み）
- [ ] 3. `server/routes/categories/`配下にエンドポイントを実装する（`schema/`・`handler/`・`request/`・`response/`ディレクトリ構成）
  - [x] 3-1. GET `/api/categories`（`typeCode`クエリでフィルタ可。自分の`categories`のみが対象なのでJOIN不要。レスポンスは`{ categories: [...] }`形式でラップする。[api-conventions.mdの一覧取得エンドポイントのレスポンス形状](../../architecture/decisions/api-conventions.md#一覧取得エンドポイントのレスポンス形状2026-08-12決定)参照）
  - [ ] 3-2. POST `/api/categories`（名前重複チェック: 自分のカテゴリ内で同タイプ内で判定。`parentId`指定時は「対象が子を持たない」「`typeCode`が一致」を検証）
  - [ ] 3-3. PUT `/api/categories/:id`（自分のカテゴリのみ編集可。重複チェックは自分自身を除外。`parentId`変更時も同様に検証）
  - [x] 3-4. PUT `/api/categories/:id/pin`（`categories.isPinned`を`true`に更新。EXPENSEカテゴリのみ許可、INCOMEは400エラー）
  - [x] 3-5. DELETE `/api/categories/:id/pin`（`categories.isPinned`を`false`に更新。EXPENSE側のピン留めが最後の1件の場合は400エラー）
  - [ ] 3-6. DELETE `/api/categories/:id`（論理削除。自分のカテゴリのみ。**子カテゴリの親に設定されている場合・ピン留め中の場合は409エラーで削除を拒否**（カスケードしない）。紐づく`recurring_transactions`テンプレートも連動して論理削除。事前に件数を返すエンドポイントまたはレスポンスへの含め方を実装時に検討）

## フロントエンド

- [ ] 1. カテゴリ一覧画面（`CategoriesRoute`・`CategoryTable`）を実装中
  - `CategoryTable` のpropsは `categories: ReturnType<typeof useCategories>`（クエリオブジェクト丸ごと）とし、`QueryBoundary`（[frontend-conventions.mdのQueryBoundaryセクション](../../architecture/decisions/frontend-conventions.md#フロントエンドのエラーハンドリング方針)参照）によるローディング・エラー・再試行の出し分けは`CategoryTable`内に集約する（2026-08-24決定。`CategoryListItem[]`のみを受け取り`CategoriesRoute`側で処理する当初案からの変更。理由は`QueryBoundary`が一覧・サマリー系画面共通の仕組みとして`isPending`/`error`/`onRetry`をpropsで受け取る設計になっており、クエリオブジェクトを保持するコンポーネント側に処理を寄せた方が自然なため）
  - カテゴリ行は親・単独・子カテゴリの差分が少ないため、まず `CategoryRow` 1コンポーネントに `'children' in category` での構造的な型絞り込みで実装し、複雑になった場合のみ `ParentCategoryRow`/`ChildCategoryRow` への分割を検討する（YAGNI優先）
  - 子カテゴリの開閉状態はクライアント側ローカルUI状態（[specs/features/categories.md](../../specs/features/categories.md#一覧での開閉表示)参照）。各行コンポーネントが自前で `useState(true)` を持ち、`CategoryTable` 側での一元管理はしない
  - 開発中に空データ・子カテゴリなし・エラーの見た目を確認する場合は、ブラウザで`/categories?mockState=empty`（`empty`/`noChildren`/`error`）のようにURLを直接書き換えてリロードする（詳細は[testing-strategy.mdのブラウザでの手動モックシナリオ切り替え](../../architecture/decisions/testing-strategy.md#フックテストのmswモック方針)参照）
- [ ] 2. カテゴリ作成・編集フォームに「親カテゴリ」Select項目を追加（[design/categories/create.md](../../design/categories/create.md#今後反映予定の変更モックアップ未更新)参照。現行モックアップには未反映のため、Stitch再生成も別途必要）。その直下に常設のヘルプテキスト+ヘルプページ（`/help#categories`）へのリンクを表示（[specs/features/categories.md](../../specs/features/categories.md#親カテゴリグラフ上のグルーピング)の「発見しやすさへの配慮」参照）
- [ ] 3. カテゴリ作成・編集フォームにアイコンピッカーUI（lucide-reactからキュレーションした一覧）・色スウォッチピッカーUI（8〜10色程度）を実装（[specs/features/categories.md](../../specs/features/categories.md#カテゴリアイコン背景色)参照）
  - 初期表示は候補の一部（8〜12個）のグリッド、「もっと見る」でDialog内その場に残りの候補を展開する（別Popover/Sheetにしない。[design/categories/create.mdの採用した方向性](../../design/categories/create.md#採用した方向性)参照）
  - アイコン・色ともフォームを開いた時点で先頭候補を初期選択済みにする（未選択状態を作らない）。アイコン→色の自動プリセットは行わない（撤回済み）
  - アイコン文字列キー→コンポーネントの解決は、使用するアイコンを明示importした`Record`対応表を`apps/web`側に作る（[frontend-conventions.mdのアイコンライブラリの動的解決パターン](../../architecture/decisions/frontend-conventions.md#アイコンライブラリの動的解決パターン2026-08-15決定)参照。`import *`によるtree-shaking崩れを避ける）
  - **未決定（実装着手時に確認）**: 色スウォッチの具体的な8色（現行`CATEGORY_COLOR_CODE`とcreate.mdのモックアップの色が不一致。特に「赤」はstyle-guide.mdの禁止色と抵触するため要調整）。アイコン候補の追加分（現行15種→20〜30種への拡張分の中身）
- [ ] 4. hooks層のテスト（2026-08-23決定）: `useCategories`・`useCategoryPin`はGET一覧・PINのスキーマ・ハンドラーが実装済みのため先行して着手してよい（hooks層テストは実APIではなくorval mock + MSWでモックするため、backend実装の完成度に依存しない）。`useCategoryCreate`等の残りのhooksとそのテストは、対応する`server/routes/categories/schema/`（POST・PUT編集・DELETE）とハンドラーが実装されたタイミングで追加する

## クリーンアップ

- [x] 1. `CategoryTable`が`categories: ReturnType<typeof useCategories>`(クエリオブジェクト丸ごと)を受け取り内部で`QueryBoundary`によるローディング/エラー処理をしている一方、`CategoriesRoute`側にも`categories.isPending`/`categories.error`を直接JSXに出す暫定コードが残っており、ローディング/エラー表示が二重になっていた（2026-08-24修正。`CategoriesRoute`側の暫定コードを削除し、`CategoryTable`側の`QueryBoundary`に一本化。あわせて「フロントエンド」節1.の方針記述も実態に合わせて更新済み）

## 将来検討（今回はスコープ外）

- 初回利用時に「光熱費を1つにまとめるか分けるか」のようなカテゴリ設計をガイドするチュートリアル/ウィザード機能。`profile-setup`とは無関係の、カテゴリ管理画面側の将来的なUX改善案
