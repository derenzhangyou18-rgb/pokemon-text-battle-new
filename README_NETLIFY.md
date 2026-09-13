# Netlify + Netlify Blobs版

この版はSQLiteを使わず、Netlify BlobsのサイトワイドStore `pokemon-text-battle` に登録データを保存します。

## 保存されるデータ

- 開発者・プレイヤーアカウント
- ポケモン（species）
- 技（move）
- 特性（ability）
- 持ち物（item）
- 相手チーム（enemy_team）

データは `database.json` という1つのBlobに保存され、通常の再デプロイでは消えません。

## Netlifyへの配置

1. このZIPをGitHubへアップロード
2. NetlifyでGitHubリポジトリを接続
3. Build commandは空欄でOK
4. Publish directoryは `public`
5. Functions directoryは `netlify/functions`
6. Deploy

Netlify FunctionsからBlobsを利用するため、Netlifyが自動的にBlobsの実行コンテキストを提供します。通常、Site IDやPersonal Access Tokenを手動でコードへ書く必要はありません。

## Blobsの確認

Netlify管理画面から対象サイトのBlobs / Storageを開き、`pokemon-text-battle` Store内の `database.json` を確認できます。

## 注意

Netlify Blobsはキー・バリュー型ストレージです。この版では1つのBlobへデータをまとめています。データ量が大きくなった場合は、species/move/ability/item/team/usersなどを別Blobへ分割する構成へ移行するのがおすすめです。

また、Blobsは同じキーへの同時書き込みでは最後の書き込みが勝つため、この版ではサーバー内で保存処理を順番に実行しています。多数の同時管理者編集が発生する場合は、将来的にNetlify Database等の構造化DBへ移行するのが適しています。


## v4.35 追加
特性に「特定タイプの技を受けると能力上昇」を追加しました。開発者フォームで「受ける技のタイプ」「上げる能力」「上昇段階」を設定できます。
