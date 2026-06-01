import { ReactNode } from 'react'

interface Props {
  title: string
  children: ReactNode
  onClose: () => void
}

/** Простое модальное окно по центру с затемнением фона. */
export function Modal({ title, children, onClose }: Props): JSX.Element {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">{title}</div>
        {children}
      </div>
    </div>
  )
}
