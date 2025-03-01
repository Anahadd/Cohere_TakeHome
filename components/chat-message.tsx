import Image from "next/image"

interface ChatMessageProps {
  role: "user" | "assistant"
  content: string
}

export default function ChatMessage({ role, content }: ChatMessageProps) {
  if (role === "user") {
    return (
      <div className="flex justify-end">
        <div className="bg-purple-600/20 text-white rounded-2xl rounded-tr-none px-6 py-4 max-w-[85%] text-xl">
          {content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-4">
      <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
        <Image src="/avatar.svg" alt="AI Avatar" width={48} height={48} className="w-full h-full object-cover" />
      </div>
      <div className="bg-gray-800/50 text-white rounded-2xl rounded-tl-none px-6 py-4 max-w-[85%] text-xl">
        {content}
      </div>
    </div>
  )
}

