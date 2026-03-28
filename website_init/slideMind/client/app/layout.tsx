import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SlideMind - 概念关联思维导图',
  description: '上传 Slides，AI 帮你提取概念，构建个人知识网络',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
