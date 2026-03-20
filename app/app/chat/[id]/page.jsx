import { ChatRoom } from '../../../../src/flow/components/ChatRoom';

export default async function Page({ params }) {
  const { id } = await params;
  return <ChatRoom id={id} />;
}
