import ChatShell from "@/components/chat/chat-shell"

export const metadata = {
  title: "Tin nhắn • Snapgram",
}

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <ChatShell activeId={id} />
}
