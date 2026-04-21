const { chromium } = require('playwright')

;(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 300 })
  const page = await browser.newPage()
  await page.goto('https://github.com/tenpoohlove?tab=repositories', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(4000)
  await page.screenshot({ path: 'C:/Users/長沼有香/OneDrive/デスクトップ/github-repos.png' })
  const repos = await page.$$eval('a[itemprop="name codeRepository"]', els => els.map(el => el.href))
  console.log('リポジトリ一覧:')
  repos.forEach(r => console.log(r))
  await browser.close()
})()
