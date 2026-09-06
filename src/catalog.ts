import type { HumorCatalog } from "./types.js";

export const builtInCatalog: HumorCatalog = {
  NETWORK_TIMEOUT: {
    dry: [
      "The remote host has entered a period of reflection.",
      "The network has chosen ambiguity over closure."
    ],
    deadpan: [
      "No response was received. This has simplified the conversation considerably."
    ],
    absurdist: [
      "The packets have chosen another path in life.",
      "Somewhere between here and there, the bits discovered free will."
    ],
    nerdy: [
      "Latency has achieved a value best described as philosophical."
    ],
    "sarcasm-light": [
      "Apparently thirty seconds was not enough time for the internet to compose itself."
    ],
    sysadmin: [
      "Networking remains a collaborative exercise in disappointment.",
      "The remote host is currently practicing extreme introversion."
    ]
  },

  DNS_FAILURE: {
    dry: ["The name exists spiritually, if not operationally."],
    deadpan: ["The requested name could not be translated into somewhere useful."],
    absurdist: ["The internet has misplaced the address book."],
    nerdy: ["Names are hard. Distributed names are harder."],
    "sarcasm-light": ["It is DNS. It was always going to be DNS."],
    sysadmin: ["It is DNS. It was always going to be DNS."]
  },

  TLS_EXPIRED: {
    dry: ["Time continues to function despite our objections."],
    deadpan: ["The certificate has exceeded its agreed period of usefulness."],
    absurdist: ["The certificate has become a historical document."],
    nerdy: ["Cryptographic trust has encountered a calendar."],
    "sarcasm-light": ["Calendars remain undefeated."],
    sysadmin: ["Time continues to function despite our change-management process."]
  },

  DISK_FULL: {
    dry: ["We have apparently decided storage is a renewable resource."],
    deadpan: ["There is no additional room for our consequences."],
    absurdist: ["The filesystem has achieved material abundance."],
    nerdy: ["Available bytes have converged toward zero."],
    "sarcasm-light": ["Apparently deleting things was never part of the architecture."],
    sysadmin: ["The disk has completed its transformation into a read-only suggestion box."]
  },

  DEPENDENCY_FAILURE: {
    dry: ["Somewhere in this dependency tree, a developer made a decision."],
    deadpan: ["One component has declined to support the ambitions of the others."],
    absurdist: ["A package three levels down has become the main character."],
    nerdy: ["Transitive dependencies remain an excellent way to meet strangers."],
    "sarcasm-light": ["Nothing says independence like forty-seven dependencies."],
    sysadmin: ["The dependency graph has requested organizational restructuring."]
  },

  MERGE_CONFLICT: {
    dry: ["Two perfectly reasonable histories have chosen violence."],
    deadpan: ["The repository contains multiple opinions about reality."],
    absurdist: ["The timelines have collided. Please select a universe."],
    nerdy: ["Concurrent edits have produced a tiny distributed-consensus problem."],
    "sarcasm-light": ["Apparently both branches were the source of truth."],
    sysadmin: ["Two perfectly reasonable histories have chosen violence."]
  },

  BUILD_FAILED: {
    dry: ["The build has reconsidered its commitment to existing."],
    deadpan: ["The requested artifact was not produced."],
    absurdist: ["The compiler has returned the ingredients uncooked."],
    nerdy: ["The transformation from source to optimism did not converge."],
    "sarcasm-light": ["The code was very confident right up until compilation."],
    sysadmin: ["The build pipeline has submitted a formal objection."]
  },

  RATE_LIMITED: {
    dry: ["You have successfully discovered that this service possesses boundaries."],
    deadpan: ["The service would prefer fewer requests at this time."],
    absurdist: ["The API has placed us in a brief conversational time-out."],
    nerdy: ["Request enthusiasm exceeded configured throughput."],
    "sarcasm-light": ["We found the limit. Science advances."],
    sysadmin: ["Capacity planning has entered the chat."]
  },

  SERVICE_UNAVAILABLE: {
    dry: ["The service is temporarily exploring nonexistence."],
    deadpan: ["The service is not currently participating."],
    absurdist: ["The service has left a very convincing empty chair."],
    nerdy: ["Availability has become temporarily theoretical."],
    "sarcasm-light": ["The service has elected not to provide service."],
    sysadmin: ["The service is currently unavailable, which is technically a kind of status."]
  },

  AUTH_FAILED: {
    dry: ["The system remains unconvinced by our identity."],
    deadpan: ["The supplied credentials did not establish access."],
    absurdist: ["The gatekeeper has examined our papers and made a face."],
    nerdy: ["Authentication reached a boolean conclusion we did not prefer."],
    "sarcasm-light": ["Apparently knowing the password was considered important."],
    sysadmin: ["Authentication failed. Security is working, inconveniently."]
  },

  PRINTER_OFFLINE: {
    dry: ["The printer has once again rejected the concept of employment."],
    deadpan: ["The printer is unavailable. This is consistent with prior observations."],
    absurdist: ["The printer has withdrawn from public life."],
    nerdy: ["The print endpoint is demonstrating strong eventual-consistency energy."],
    "sarcasm-light": ["The printer has remembered what it is."],
    sysadmin: ["The printer is offline. Nature is healing."]
  },

  UNKNOWN_ERROR: {
    dry: ["Something went wrong with admirable specificity."],
    deadpan: ["An error occurred. Additional confidence is unavailable."],
    absurdist: ["A problem has arrived without introducing itself."],
    nerdy: ["The system has emitted an exception-shaped mystery."],
    "sarcasm-light": ["The error has declined to elaborate."],
    sysadmin: ["An unknown error occurred. The logs may now begin their scavenger hunt."]
  }
};
