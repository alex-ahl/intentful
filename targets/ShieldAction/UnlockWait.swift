//
//  UnlockWait.swift
//
//  Yes only unlocks once that shield has waited out the pause. Kept identical in
//  ShieldAction and ShieldConfiguration — each target compiles only its own folder.
//

import Foundation

let UNLOCK_WAIT_KEY = "unlockWait"
let PENDING_UNLOCK_KEY = "pendingUnlock"

enum UnlockWait {
  case fresh
  case waiting(remainingSeconds: Int)
  case ready
}

// Tokens are opaque, so the encoded form is what identifies the app across both extensions.
func unlockWaitKey<T: Encodable>(for token: T?) -> String? {
  guard let token = token, let data = try? JSONEncoder().encode(token) else {
    return nil
  }

  return data.base64EncodedString()
}

func unlockWaitState(for key: String, now: Date = Date()) -> UnlockWait {
  // Written by the app when it arms; without it Yes unlocks straight away, as it used to.
  guard let settings = userDefaults?.dictionary(forKey: UNLOCK_WAIT_KEY),
    let waitSeconds = settings["waitSeconds"] as? Double,
    let expirySeconds = settings["expirySeconds"] as? Double
  else {
    return .ready
  }

  guard let pending = userDefaults?.dictionary(forKey: PENDING_UNLOCK_KEY),
    pending["token"] as? String == key,
    let tappedAt = pending["tappedAt"] as? Double
  else {
    return .fresh
  }

  let elapsed = now.timeIntervalSince1970 - tappedAt

  // A clock set backwards makes elapsed negative, which must not count as waited.
  if elapsed < 0 || elapsed > waitSeconds + expirySeconds {
    return .fresh
  }

  if elapsed < waitSeconds {
    return .waiting(remainingSeconds: Int((waitSeconds - elapsed).rounded(.up)))
  }

  return .ready
}

func startUnlockWait(for key: String, now: Date = Date()) {
  userDefaults?.set(
    ["token": key, "tappedAt": now.timeIntervalSince1970], forKey: PENDING_UNLOCK_KEY)
}

func clearUnlockWait() {
  userDefaults?.removeObject(forKey: PENDING_UNLOCK_KEY)
}
