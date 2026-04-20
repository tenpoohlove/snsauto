const { chromium } = require('playwright')

const APP_ID = '952763274322825'

;(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 500 })
  const page = await browser.newPage()

  await page.goto('https://developers.facebook.com/', { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('text=マイアプリ', { timeout: 120000 })
  console.log('Logged in!')

  // Go directly to App Review permissions page
  await page.goto(`https://developers.facebook.com/apps/${APP_ID}/app-review/permissions/`, {
    waitUntil: 'networkidle',
    timeout: 30000,
  })
  await page.waitForTimeout(4000)
  await page.screenshot({ path: 'C:/Users/長沼有香/OneDrive/デスクトップ/meta-perms.png' })
  console.log('Screenshot: meta-perms.png')

  const perms = ['instagram_business_content_publish', 'pages_manage_posts', 'instagram_business_basic']

  for (const perm of perms) {
    console.log(`Searching for: ${perm}`)
    try {
      // Scroll through the page to find the permission
      await page.evaluate((p) => {
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
        let node
        while ((node = walker.nextNode())) {
          if (node.textContent.includes(p)) {
            node.parentElement?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            break
          }
        }
      }, perm)
      await page.waitForTimeout(1500)

      // Find row containing this permission and click Add button
      const row = page.locator(`tr:has-text("${perm}")`).first()
      const visible = await row.isVisible({ timeout: 3000 }).catch(() => false)

      if (visible) {
        const addBtn = row.locator('button').first()
        const btnVisible = await addBtn.isVisible({ timeout: 2000 }).catch(() => false)
        if (btnVisible) {
          const btnText = await addBtn.textContent()
          if (btnText?.includes('追加') || btnText?.includes('Add') || btnText?.includes('リクエスト')) {
            await addBtn.click()
            console.log(`✅ Clicked: ${perm}`)
            await page.waitForTimeout(2000)
          } else {
            console.log(`ℹ️  Button says "${btnText}" - already configured: ${perm}`)
          }
        } else {
          console.log(`ℹ️  No button found (already added?): ${perm}`)
        }
      } else {
        console.log(`⚠️  Permission row not found: ${perm}`)
      }
    } catch (e) {
      console.log(`⚠️  Error: ${e.message}`)
    }
  }

  await page.screenshot({ path: 'C:/Users/長沼有香/OneDrive/デスクトップ/meta-perms-after.png' })
  console.log('Done! Browser stays open for 30s.')
  await page.waitForTimeout(30000)
  await browser.close()
})()
