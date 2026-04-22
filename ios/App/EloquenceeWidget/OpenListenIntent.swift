import AppIntents
import SwiftUI
import Foundation

/// AppIntent uruchamiany po kliknięciu kafelka w Control Center.
/// `openAppWhenRun = true` wymusza otwarcie aplikacji głównej.
/// Zapisuje też flagę w UserDefaults (App Group), aby aplikacja po starcie
/// wiedziała że ma przejść na ekran /listen.
@available(iOS 18.0, *)
struct OpenListenIntent: AppIntent {
    static let title: LocalizedStringResource = "Słuchaj słowa"
    static let description = IntentDescription("Otwiera Eloquencee w trybie słuchania mikrofonu.")

    static let openAppWhenRun: Bool = true

    @MainActor
    func perform() async throws -> some IntentResult {
        // Zapisz flagę w shared UserDefaults — aplikacja odczyta ją przy starcie.
        if let defaults = UserDefaults(suiteName: "group.app.lovable.eloquencee") {
            defaults.set(true, forKey: "openListenOnLaunch")
            defaults.set(Date().timeIntervalSince1970, forKey: "openListenTimestamp")
        }
        // Fallback: standardowe UserDefaults
        UserDefaults.standard.set(true, forKey: "openListenOnLaunch")
        UserDefaults.standard.set(Date().timeIntervalSince1970, forKey: "openListenTimestamp")
        return .result()
    }
}
