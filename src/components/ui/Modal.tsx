interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl border border-cmsa-borde shadow-xl w-[500px] max-h-[90vh] overflow-auto">
        {/* HEADER */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-bold text-cmsa-tinta">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-cmsa-gris hover:text-cmsa-tinta"
          >
            ✕
          </button>
        </div>
        {/* BODY */}
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  )
}