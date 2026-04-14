# naturalquest.org 作業進捗メモ

## 完了した作業（2026-04-14）

### Google Drive 整理
- rclone + Google Drive MCP セットアップ完了
- 縮小画像 11,802件削除（372MB解放）
- rclone remote名: gdrive / nq-images-upload

### slug リネーム
- 225件を日付+英語slug形式に一括変換
- アロマ辞典59件はskip（将来のチャットUIに移行予定）
- slug-mapping-approved.csv → gdrive:slug-migration/ に保存済み

### heroImage 管理
- 154件のheroImageを抽出・リンク切れ34件確認済み
- hero-all.csv → gdrive:slug-migration/ に保存済み
- new_image列に手動でファイル名を入れてCSVを返すと一括反映可能
- R2バケット: nq-images / rclone: nq-images-upload
- 配信URL形式: https://images.naturalquest.org/年/月/ファイル名.jpg

### index.astro 修正
- popularSlugs・selectionSlugs を新slug名に更新済み

## 次にやること
- アロマ辞典チャットUIの設計・実装
- エクセルをインポートすることで完成する、商品リストフォーマットの作成
