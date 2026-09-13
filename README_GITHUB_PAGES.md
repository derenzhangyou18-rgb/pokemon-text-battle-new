# 文字だけポケモン対戦シミュレーター v5.0

GitHub Pages + Supabase版です。

## 構成

- GitHub Pages: HTML/CSS/JavaScriptの公開
- Supabase Auth: ログイン
- Supabase PostgreSQL: ポケモン・技・特性・持ち物・相手パーティの保存
- ブラウザ: 対戦ロジックと現在の対戦状態

## 1. Supabaseを作成

Supabaseでプロジェクトを1つ作成します。

## 2. DBを作成

Supabase Dashboard → SQL Editorで `supabase.sql` を全文実行します。

## 3. Supabaseのキーを設定

`public/config.js` を開き、Project Settings → API にあるURLとPublishable key（旧anon key）を入れます。

`service_role` / secret keyは絶対に入れないでください。

例:

```js
window.SUPABASE_CONFIG = {
  url: "https://xxxx.supabase.co",
  key: "sb_publishable_xxxx"
};
```

## 4. GitHubへpush

リポジトリの `main` ブランチへこのフォルダの内容をpushします。

## 5. GitHub Pagesを有効化

GitHub → Settings → Pages → Build and deployment → Source → GitHub Actions を選択します。

pushすると `.github/workflows/pages.yml` が自動デプロイします。

## 6. 最初のアカウント

サイトのログイン画面からメールアドレスとパスワードで新規登録します。

最初のアカウントを開発者にするには、Supabase SQL Editorで次を実行します。

```sql
update public.profiles
set role='developer'
where username='メールアドレスの@より前の部分';
```

## 7. 管理画面

開発者アカウントでログイン後、管理画面からJSON形式でデータを追加・編集・削除できます。

`pokemon-content-export.json` の形式でまとめてバックアップ・復元もできます。

## 注意

GitHub Pagesは静的ホスティングなので、Node.js/Expressをサーバーとして実行しません。Supabaseへのアクセスはブラウザから行います。

対戦中の状態はブラウザのlocalStorageにも保存します。別端末へ対戦途中の状態を同期する機能はこの版には含めていません。
