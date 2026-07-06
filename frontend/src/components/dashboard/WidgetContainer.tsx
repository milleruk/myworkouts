import type { ReactNode } from 'react'
import { Card } from '../Card'

const WIDTH_CLASSES: Record<number, string> = {
  33: 'basis-full md:basis-[calc(33.333%-0.667rem)]',
  50: 'basis-full md:basis-[calc(50%-0.5rem)]',
  66: 'basis-full md:basis-[calc(66.667%-0.333rem)]',
  100: 'basis-full',
}

export function WidgetContainer({
  title,
  width,
  children,
}: {
  title: string
  width: number
  children: ReactNode
}) {
  return (
    <div className={WIDTH_CLASSES[width] ?? WIDTH_CLASSES[50]}>
      <Card title={title}>{children}</Card>
    </div>
  )
}
