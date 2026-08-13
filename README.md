# まちなか動物園

街中の看板、銅像、遊具、壁画などに描かれた「動物」を見つけて共有する写真SNSです。生きている動物ではなく、街に隠れた動物モチーフを集める楽しさをテーマにしています。

## 主な機能

- 写真投稿と動物タグによる絞り込み
- ページ分割された投稿一覧
- いいね、コメント、通報
- 自分の投稿とコメントの削除
- プロフィール編集
- Azure上への投稿・画像・リアクション情報の保存

## 技術構成

- React Native / Expo / Expo Router / TypeScript
- Azure Functions（Node.js 22 / Flex Consumption）
- Azure Cosmos DB / Azure Blob Storage
- Managed Identity / RBAC / Application Insights

## 構成

```text
src/    Expoアプリ（画面、コンポーネント、状態管理、API通信）
api/    Azure Functions
assets/ アイコン・画像
```

## 開発の目的

Azureを使った業務経験を、モバイルアプリの設計・実装・クラウド連携まで広げるために開発しています。低コスト運用を意識し、サーバーレス構成、マネージドID、Cosmos DBのパーティション設計などを採用しました。

> 現在は開発中のポートフォリオ作品です。Azureの接続情報やFunction Keyなどの秘密情報はリポジトリに含めていません。

## ローカルでの起動

```bash
npm install
copy .env.example .env.local
npx expo start
```

`.env.local`にAPIのURLとFunction Keyを設定します。このファイルはGitの管理対象外です。

## Expoの開発情報

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
