# ヘルプ

仕様の詳細は [specs/features/help.md](../../specs/features/help.md) を参照。

## バックエンド

- [ ] 1. 専用APIなし（静的コンテンツのみのページのため）

## フロントエンド

- [ ] 1. （画面デザイン確定後に着手）
- [ ] 2. `(app)/help/page.tsx` を新規作成。カテゴリ管理セクション（`#categories`）のみ実装
- [ ] 3. 親カテゴリ機能の説明: テキスト+簡易図解（電気代・ガス代・水道代→光熱費の合算イメージ）をTailwind+SVGでコード実装（[specs/features/help.md](../../specs/features/help.md#親カテゴリ機能)参照）
- [ ] 4. ピン留め機能の説明: テキストのみ
- [ ] 5. `(app)/layout.tsx`のヘッダー（`UserButton`）に`<UserButton.MenuItems>`+`<UserButton.Link label="ヘルプ" href="/help" />`を追加（[architecture/overview.md](../../architecture/overview.md#appレイアウト構成)参照）
- [ ] 6. カテゴリ作成・編集モーダルの親カテゴリヘルプテキストから`/help#categories`へのリンクを追加（[tasks/categories.md](./categories.md)のタスクと連動）

## クリーンアップ

- [ ] 1. （未定）
