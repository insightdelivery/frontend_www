'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface AccordionContextValue {
  openItem: string | null
  setOpenItem: React.Dispatch<React.SetStateAction<string | null>>
  type: 'single' | 'multiple'
}

const AccordionContext = React.createContext<AccordionContextValue | null>(null)

function useAccordion() {
  const ctx = React.useContext(AccordionContext)
  if (!ctx) throw new Error('Accordion components must be used within Accordion')
  return ctx
}

interface AccordionProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'defaultValue'> {
  type?: 'single' | 'multiple'
  defaultValue?: string | null
}

const Accordion = React.forwardRef<HTMLDivElement, AccordionProps>(
  ({ type = 'single', defaultValue = null, className, children, ...props }, ref) => {
    const [openItem, setOpenItem] = React.useState<string | null>(defaultValue)
    return (
      <AccordionContext.Provider value={{ openItem, setOpenItem, type }}>
        <div ref={ref} className={cn('space-y-1', className)} {...props}>
          {children}
        </div>
      </AccordionContext.Provider>
    )
  }
)
Accordion.displayName = 'Accordion'

interface AccordionItemContextValue {
  value: string
  isOpen: boolean
  onTrigger: () => void
}

const AccordionItemContext = React.createContext<AccordionItemContextValue | null>(null)

function useAccordionItem() {
  const ctx = React.useContext(AccordionItemContext)
  if (!ctx) throw new Error('AccordionItem must be used within Accordion')
  return ctx
}

interface AccordionItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
}

const AccordionItem = React.forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ value, className, children, ...props }, ref) => {
    const { openItem, setOpenItem, type } = useAccordion()
    const isOpen = openItem === value
    const onTrigger = React.useCallback(() => {
      setOpenItem((prev) => (prev === value ? null : value))
    }, [value, setOpenItem])
    return (
      <AccordionItemContext.Provider value={{ value, isOpen, onTrigger }}>
        <div ref={ref} className={cn('border-b border-gray-200', className)} {...props}>
          {children}
        </div>
      </AccordionItemContext.Provider>
    )
  }
)
AccordionItem.displayName = 'AccordionItem'

const AccordionTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
  const { isOpen, onTrigger } = useAccordionItem()
  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        'flex w-full items-center justify-between py-4 text-left font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180',
        className
      )}
      data-state={isOpen ? 'open' : 'closed'}
      onClick={onTrigger}
      {...props}
    >
      {children}
      <svg
        className="h-4 w-4 shrink-0 transition-transform duration-200"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  )
})
AccordionTrigger.displayName = 'AccordionTrigger'

const AccordionContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const { isOpen } = useAccordionItem()
  if (!isOpen) return null
  return (
    <div
      ref={ref}
      className={cn('overflow-hidden text-sm text-gray-600 pb-4', className)}
      {...props}
    >
      {children}
    </div>
  )
})
AccordionContent.displayName = 'AccordionContent'

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
