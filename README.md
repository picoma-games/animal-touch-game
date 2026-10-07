# どうぶつタッチ 🐘🐶🐱

2〜4歳向けの iPhone 用どうぶつタッチゲームです。
ぞう・いぬ・ねこを大きく表示し、タップするとぴょんと跳ねて、やさしい音とハート・星が出ます。

- HTML / CSS / JavaScript のみ（ライブラリ・ビルド不要）
- iPhone 縦画面に最適化（ノッチ・ホームバーのセーフエリア対応）
- 文字なし・画面いっぱいの大きなボタン
- 誤操作対策：ピンチズーム・ダブルタップズーム・長押しメニュー・スクロールを無効化

## ファイル構成

```
index.html   画面
style.css    レイアウトとアニメーション
script.js    タップ処理・効果音
.nojekyll    GitHub Pages で Jekyll 処理を無効化
```

## GitHub Pages で公開する

1. GitHub のリポジトリで **Settings → Pages** を開く
2. **Source** を「Deploy from a branch」にする
3. ブランチ（例：`main`）とフォルダ `/ (root)` を選んで **Save**
4. 数分後に `https://<ユーザー名>.github.io/animal-touch-game/` で遊べます

iPhone の Safari で開き、共有ボタン →「ホーム画面に追加」すると、アプリのように全画面で遊べます。

## ローカルで試す

`index.html` をブラウザで開くだけで動きます。
