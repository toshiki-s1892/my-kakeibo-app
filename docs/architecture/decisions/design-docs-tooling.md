# 設計ドキュメントのツール選定

## 設計ドキュメント運用（Mermaid）

**採用ツール:** Mermaid（Markdown埋め込み）

**採用理由:**
- GitHubが標準でレンダリングできるため、専用ビューアが不要
- 既存のER図（`docs/architecture/schema.dbml`）と同様、図を「テキストで管理」できるため、Gitで差分が追いやすい

**配置方針:**
- 複数機能をまたぐ全体図（画面遷移図・認証シーケンス図）は `docs/architecture/` に配置する
  - `docs/architecture/screen-flow.md`: 画面遷移図
  - `docs/architecture/auth-sequence.md`: 認証関連のシーケンス図
- 機能固有の業務フロー（取引記録の入力フローなど）は、該当する `docs/specs/features/{feature名}.md` に追記する

**図の種類の使い分け:**
- **`flowchart`**: 1つの処理内の条件分岐・ステップ（例: 名前重複チェック→OKならINSERT、NGならエラー）
- **`sequenceDiagram`**: 複数のシステム・時間軸を伴うやり取り。`docs/specs/features/`の各CRUD操作（追加・編集・削除等）には`auth-sequence.md`と同じ形（Browser→`proxy.ts`の`clerkMiddleware`認証チェック→Hono Server→DB）で1枚ずつ用意し、`flowchart`と併記する。外部API（Gemini等）やCronのような複数システムが絡む処理も同様にシーケンス図で表現する

## 画面設計書運用（Stitch）

**採用ツール:** Google Stitch（https://stitch.withgoogle.com/、Web版を手動利用）

**位置付け:** 画面の雰囲気・方向性を決めるためのモックアップ作成専用。MCP連携は行わず、実装はStitchの出力を参考にユーザー自身が行う（CLAUDE.mdの「明示的に依頼されない限りファイルの変更・作成を行わない」方針に従う）。

**不採用:**
- v0（Vercel）: shadcn/ui準拠のコードを直接生成できるが、このリポジトリの実装規約（Route/Form分離・`server/lib/`のDALパターンなど）には対応していないため、コード生成の価値が薄い
- Figma: チーム協業・デザインシステム管理向けの機能が中心で、個人開発の本プロジェクトでは過剰

**対象画面:** ホーム（ランディング）・プロフィール設定（再設計）・ダッシュボード・取引記録・カテゴリ管理・家族構成管理・AI機能画面。

**ホーム画面の追加について:** 現状の `app/page.tsx` はClerkクイックスタートのボイラープレートのままで、未認証ユーザー向けのランディングページが存在しない。サインイン/サインアップへの導線が曖昧なため、画面設計の対象に追加する。`proxy.ts` の `isPublicRoute` に `/` を追加する対応が実装時に必要になる。

**サインイン・サインアップについて:** Clerk提供のUIをそのまま使用し、フルスクラッチでの再設計は行わない（パスワードリセット・MFA・i18n等をClerkが担保している機能を自前で再実装するリスクを避けるため）。Stitchで決めたホーム画面・ダッシュボード等の配色・トーンを、Clerk公式の `appearance` prop（`variables`・`elements`・`theme`。shadcn/uiに寄せる公式の「shadcn」テーマも提供されている）で反映し、見た目だけ統一する。

**2026-06-22追記**: 上記の方針（実装はClerkのプリビルトUIをそのまま使用）は変更しないが、`appearance` propでどう色・トーンを反映すべきかの**見た目の参考**として、Stitchで`<SignIn />`/`<SignUp />`の構成（ロゴ・入力欄・ソーシャルログインボタン・タイトル・リンク）を再現した参考モックアップを作成する。これは実装するカスタムレイアウトではなく、配色・フォント・余白等のテーマ適用イメージを掴むための資料に位置づける（実装時は引き続きClerkコンポーネントの`appearance` propのみで調整し、独自のフォーム実装は行わない）。

**共通パーツ（ヘッダー・フッター）:** 複数画面をまたぐ関心事のため、個別画面ではなく1セットとしてStitchで設計する（[screen-flow.md](../screen-flow.md)・各画面の設計書とは別管理）。

**保存先:** `docs/design/` ディレクトリに画面単位でファイルを作成する。共通パーツは画面とは別枠で管理する。Stitchの運用上の注意点（タイムアウト挙動・`list_screens`の制約等）は[design/style-guide.md](../../design/style-guide.md)を参照。

**ローカルの保持方針（2026-06-22決定）:** `docs/design/screenshots/`にはStitchで決定するため過程は記録としてStitch側のScreen IDのみで十分。ローカルには**採番済みスクリーンショット（`*-numbered.png`）のみ**を保持し、番号付け確定後は元の番号なし画像を削除する（状態パターンの画像も含む）。元のStitch画面自体は削除しないため、必要になれば`get_screen`で再取得できる。

## Stitchのレスポンシブ制約

Stitchは1プロンプトでモバイル・タブレット・デスクトップ版を同時生成できるが、これらは breakpoint ごとの**個別の静的レイアウト**であり、可変するレスポンシブデザインそのものは生成されない。実装時のブレークポイント制御は [`useMediaQuery` パターン](./frontend-conventions.md#レスポンシブ対応-usemediaquery-パターン) に従う。Stitchでモバイル・デスクトップ両方の見た目を確認した上で、実装時にどのコンポーネントを出し分けるか判断する。
