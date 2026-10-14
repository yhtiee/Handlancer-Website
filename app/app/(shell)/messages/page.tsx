import { Icon } from '@/components/app/icon';

/** Desktop's empty right pane; phones show the list instead (messages-frame.tsx). */
export default function MessagesIndex() {
  return (
    <div className="grid flex-1 place-items-center p-8 text-center">
      <div>
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-[var(--band)] text-[var(--muted)]">
          <Icon name="chatbubbles" size={22} />
        </span>
        <p className="mt-3 font-semibold text-[var(--navy)]">Pick a conversation</p>
        <p className="mt-1 text-[var(--muted)]">Your chats with clients and artisans live here.</p>
      </div>
    </div>
  );
}
