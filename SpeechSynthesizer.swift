// SpeechSynthesizer.swift

import Foundation
import AVFoundation

@objc(SpeechSynthesizer)
class SpeechSynthesizer: NSObject, RCTBridgeModule {
  static func moduleName() -> String! {
    return "SpeechSynthesizer"
  }

  @objc(speak:withResolver:withRejecter:)
  func speak(text: String, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    let utterance = AVSpeechUtterance(string: text)
    let synthesizer = AVSpeechSynthesizer()
    
    synthesizer.speak(utterance)
    
    resolve(true)
  }
}
