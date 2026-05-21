let aborted = false

export function resetAgentAbort() {
  aborted = false
}

export function requestAgentAbort() {
  aborted = true
}

export function isAgentAborted() {
  return aborted
}
