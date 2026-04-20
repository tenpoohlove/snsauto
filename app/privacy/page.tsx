export const metadata = {
  title: 'プライバシーポリシー | SNS自動投稿',
}

export default function PrivacyPage() {
  const updated = '2026年4月20日'
  return (
    <div className="max-w-2xl mx-auto px-6 py-12 text-gray-800">
      <h1 className="text-2xl font-bold mb-2">プライバシーポリシー</h1>
      <p className="text-sm text-gray-500 mb-8">最終更新日：{updated}</p>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">1. はじめに</h2>
        <p className="text-sm leading-7">
          本サービス「SNS自動投稿」（以下「本サービス」）は、ユーザーのInstagram・Facebookアカウントと連携し、AIを活用したSNS投稿文の生成・管理を支援するサービスです。本プライバシーポリシーは、本サービスがどのような情報を収集し、どのように利用するかを説明します。
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">2. 収集する情報</h2>
        <ul className="text-sm leading-8 list-disc list-inside space-y-1">
          <li>メールアドレス（アカウント認証のため）</li>
          <li>FacebookページおよびInstagramビジネスアカウントのID・名前</li>
          <li>Meta APIアクセストークン（投稿操作のため）</li>
          <li>ユーザーが入力した投稿テーマ・テキスト</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">3. 情報の利用目的</h2>
        <ul className="text-sm leading-8 list-disc list-inside space-y-1">
          <li>FacebookページおよびInstagramへの投稿・管理</li>
          <li>AI（Claude）を用いた投稿文の生成</li>
          <li>サービスの提供・改善</li>
          <li>ユーザーサポート</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">4. Metaプラットフォームデータの取り扱い</h2>
        <p className="text-sm leading-7 mb-3">
          本サービスはMeta（Facebook・Instagram）のAPIを通じて取得したデータを以下の目的のみに使用します：
        </p>
        <ul className="text-sm leading-8 list-disc list-inside space-y-1">
          <li>ユーザー本人のFacebookページおよびInstagramアカウントへの投稿</li>
          <li>連携アカウントの一覧表示</li>
        </ul>
        <p className="text-sm leading-7 mt-3">
          取得したMetaデータを第三者に販売・共有・広告目的で利用することは一切ありません。アクセストークンは暗号化された状態でデータベースに保存され、本サービスの機能提供以外には使用しません。
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">5. データの保存・セキュリティ</h2>
        <p className="text-sm leading-7">
          収集した情報はNeon（PostgreSQL）データベースに保存されます。通信はすべてHTTPS（TLS）で暗号化されています。アクセストークンは60日間有効であり、期限切れ後は再認証が必要です。
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">6. データの共有</h2>
        <p className="text-sm leading-7">
          本サービスはユーザーの個人情報を第三者に販売・貸与しません。ただし、以下のサービスプロバイダーとデータを共有します：
        </p>
        <ul className="text-sm leading-8 list-disc list-inside mt-2 space-y-1">
          <li>Anthropic（AI投稿生成のため、入力テキストのみ）</li>
          <li>Clerk（認証サービス）</li>
          <li>Vercel（ホスティング）</li>
          <li>Meta Platforms（API連携）</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">7. ユーザーの権利</h2>
        <ul className="text-sm leading-8 list-disc list-inside space-y-1">
          <li>アカウントの削除：サービス内の「連携解除」ボタンからいつでもMetaとの連携を解除できます</li>
          <li>データの削除：連携解除時にアクセストークンはデータベースから削除されます</li>
          <li>Facebookの権限設定からも本アプリへのアクセス許可を取り消すことができます</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">8. お問い合わせ</h2>
        <p className="text-sm leading-7">
          プライバシーに関するご質問は以下までご連絡ください：<br />
          <a href="mailto:tenpoohlove@gmail.com" className="text-blue-600 underline">tenpoohlove@gmail.com</a>
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">9. ポリシーの変更</h2>
        <p className="text-sm leading-7">
          本ポリシーは予告なく変更される場合があります。重要な変更がある場合はサービス内でお知らせします。
        </p>
      </section>
    </div>
  )
}
