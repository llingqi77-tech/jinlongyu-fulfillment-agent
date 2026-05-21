let bottomAnchor: HTMLElement | null = null

export function setChatScrollBottom(el: HTMLElement | null) {
  bottomAnchor = el
}

export function scrollChatToBottom() {
  bottomAnchor?.scrollIntoView({ behavior: 'smooth', block: 'end' })
}
