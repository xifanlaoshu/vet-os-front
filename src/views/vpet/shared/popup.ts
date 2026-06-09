export function resolveVpetPopupContainer(triggerNode: HTMLElement) {
  return (
    (triggerNode.closest('.ant-modal-wrap, .ant-drawer-content-wrapper, .ant-popover, .ant-dropdown') as HTMLElement | null)
    || triggerNode.parentElement
    || document.body
  )
}
