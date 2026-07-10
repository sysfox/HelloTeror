# MacBook Pro Page Topology

## Page Layout
- Dark theme (black/dark gray background) for product sections
- Light theme (white/light gray background) for support, compare, and footer sections
- Full-width sections, centered content with max-width constraints
- Global nav at top, local nav below it
- Sticky global nav on scroll

## Sections (Top to Bottom)

### 1. Global Navigation (Fixed/Sticky)
- Apple logo, nav links, search, bag
- Dark translucent background
- Sticky on scroll

### 2. Local Navigation (Sticky)
- "MacBook Pro" title, "购买" button
- Section links: 概览, 规格, etc.
- Sticky below global nav

### 3. Hero / Welcome Section (section-welcome)
- Dark background (black)
- "MacBook Pro" headline
- "全员疾速派" subheadline
- "M5、M5 Pro 和 M5 Max 现已集结。" body
- MacBook Pro product image (hero)
- Price and "购买" CTA

### 4. Highlights Section (section-highlights)
- Dark gray background (rgb(29, 29, 31))
- "先刷重点" header
- Card grid with feature highlights:
  - M5、M5 Pro 和 M5 Max 芯片
  - AI 表现
  - 电池续航
  - macOS Tahoe
  - 电话 App 和实时活动
- "观看影片" CTA

### 5. Product Viewer Section (section-product-viewer)
- Dark gray background
- "定睛细看" header
- Interactive product showcase with tabs/panels:
  - 摆在眼前 (hero view)
  - 尺寸 (sizes)
  - 颜色 (colors: 深空黑色, 银色)
  - 显示屏 (display)
  - 端口 (connectivity)
  - 摄像头 (camera)
  - 音响 (audio)
  - 耐用性 (durability)
- Previous/Next navigation buttons

### 6. Performance Section (section-performance)
- Black background
- Very tall section (~3170px) with scroll-driven content
- M5 chip showcase with parallax/scroll animations
- "性能" eyebrow, "M5、M5 Pro、M5 Max" headline
- GPU section with hardware visualization
- "三款芯片，实力说一不二" subsection
- Multiple scroll-triggered text reveals

### 7. AI Section (section-artificial-intelligence)
- Black background
- ~1952px tall
- "AI" eyebrow, "从头打造芯片，为 AI 精心构建。" headline
- Apple Intelligence features
- Scroll-driven animations

### 8. Battery Section (section-battery)
- Black background
- ~1443px tall
- "电池续航" eyebrow, "从早到晚都挺你，好想法不断电。" headline
- Battery life stats

### 9. macOS Section (section-macos)
- Black background
- ~1542px tall
- macOS Tahoe features
- Liquid Glass design

### 10. Continuity Section (section-continuity)
- Black background
- ~815px tall
- "Mac + iPhone" headline
- "组成队，实力加成。" subheadline
- Cross-device features

### 11. Apps Section (section-apps)
- Black background
- ~800px tall
- "App" eyebrow, "种种志向，款款 App 助实现。" headline

### 12. Display Section (section-display)
- Black background
- ~1592px tall
- "显示屏" eyebrow, "满是亮点，超亮眼。" headline
- Display features: Liquid Retina XDR, ProMotion, etc.

### 13. Camera Section (section-camera)
- Black background
- ~699px tall
- "摄像头" eyebrow, "你的专场，看你秀。" headline
- 12MP Center Stage camera

### 14. Connectivity Section (section-connectivity)
- Black background
- ~1170px tall
- "端口和连接" eyebrow, "强强相连，路路显实力。" headline
- Port showcase: HDMI, SDXC, MagSafe, USB-C/Thunderbolt, headphone jack
- Wi-Fi 7, Bluetooth

### 15. Security Section (section-security)
- Black background
- ~948px tall
- "安全性" eyebrow, "不妥协，不容有失。" headline
- Touch ID, Secure Enclave

### 16. Upgraders Section (section-upgraders)
- Black background
- ~1305px tall
- "想升级，时机正正好。" headline
- Comparison tool for existing MacBook Pro

### 17. Incentive Section (section-incentive)
- Light background (rgb(245, 245, 247))
- "在 Apple 购买 Mac，好处多多。"
- Benefits cards

### 18. Contrast / Compare Section (section-contrast)
- Light background
- "看看哪款 Mac 适合你"
- Mac model comparison cards

### 19. Environment Section (section-environment)
- Light background
- "MacBook Pro 与环境"

### 20. Values Section (section-values)
- Light background
- "我们的价值观，为我们导航。"

### 21. Index / Footer Links Section (section-index)
- Light background (rgb(250, 250, 252))
- Mac product links index
- Footer sitemap

### 22. Global Footer
- Light background
- Apple footer with links, copyright, legal

## Interaction Models
- **Global nav**: Sticky on scroll, backdrop blur
- **Local nav**: Sticky below global nav
- **Product viewer**: Click-driven tab switching with prev/next
- **Performance section**: Scroll-driven (long section with text reveals on scroll)
- **Most product stories sections**: Scroll-driven animations (fade-in, staggered)
- **Highlights cards**: Hover states
- **Color picker**: Click-driven (radio buttons)

## Color Palette
- **Dark bg (primary)**: rgb(0, 0, 0) - black
- **Dark bg (alt)**: rgb(29, 29, 31) - dark gray
- **Light bg (primary)**: rgb(245, 245, 247) - light gray
- **Light bg (alt)**: rgb(250, 250, 252) - very light gray
- **Dark text**: rgb(29, 29, 31) - near black
- **Light text**: rgb(245, 245, 247) - near white

## Fonts
- SF Pro SC, SF Pro Text, SF Pro Icons
- PingFang SC
- Helvetica Neue, Helvetica, Arial (fallbacks)
