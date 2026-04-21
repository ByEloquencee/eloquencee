import AppIntents
import SwiftUI

/// AppIntent uruchamiany po kliknięciu kafelka w Control Center.
/// `openAppWhenRun = true` wymusza otwarcie aplikacji głównej.
@available(iOS 18.0, *)
struct OpenListenIntent: AppIntent {
    static let title: LocalizedStringResource = "Słuchaj słowa"
    static let description = IntentDescription("Otwiera Eloquencee w trybie słuchania mikrofonu.")

    static let openAppWhenRun: Bool = true

    @MainActor
    func perform() async throws -> some IntentResult & OpensIntent {
        // Otwarcie aplikacji następuje automatycznie dzięki openAppWhenRun.
        // Deep link obsługuje AppDelegate przez URL scheme eloquencee://listen.
        return .result(opensIntent: OpenURLIntent(URL(string: "eloquencee://listen")!))
    }
}
