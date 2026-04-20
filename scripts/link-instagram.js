const { chromium } = require('playwright')

;(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 500 })
  const page = await browser.newPage()

  // まずFacebookにログイン
  console.log('Facebookにアクセス中...')
  await page.goto('https://www.facebook.com/login', { waitUntil: 'domcontentloaded' })

  console.log('Facebookにログインしてください（最大3分待ちます）...')
  // ホーム画面になるまで待つ
  await page.waitForURL('https://www.facebook.com/', { timeout: 180000 }).catch(async () => {
    await page.waitForSelector('[aria-label="Facebookホーム"], [data-pagelet="Stories"]', { timeout: 60000 }).catch(() => {})
  })
  console.log('ログイン確認！')
  await page.waitForTimeout(2000)

  // Meta Business Suiteに移動
  console.log('Meta Business Suiteに移動中...')
  await page.goto('https://business.facebook.com/settings/instagram-accounts', { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(5000)
  await page.screenshot({ path: 'C:/Users/長沼有香/OneDrive/デスクトップ/ig-link-1.png' })
  console.log('スクリーンショット: ig-link-1.png を確認してください')

  // 「追加」ボタンを探す
  const addBtn = page.locator('button:has-text("追加"), button:has-text("Add")').first()
  if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await addBtn.click()
    console.log('「追加」クリック！')
    await page.waitForTimeout(5000)
  }

  await page.screenshot({ path: 'C:/Users/長沼有香/OneDrive/デスクトップ/ig-link-2.png' })
  console.log('スクリーンショット: ig-link-2.png')
  console.log('ブラウザで操作を続けてください。5分後に自動終了します。')
  await page.waitForTimeout(300000)
  await browser.close()
})()
