import AppIntents
import SwiftUI
import Foundation

/// AppIntent uruchamiany po kliknięciu kafelka w Centrum Sterowania.
/// Zgodność z `OpenIntent` jest WYMAGANA, aby ControlWidgetButton rzeczywiście
/// otwierał aplikację główną na iOS 18+. Sam `openAppWhenRun = true` nie wystarcza
/// w kontekście Control Widget.
@available(iOS 18.0, *)
struct OpenListenIntent: AppIntent, OpenIntent {
    static let title: LocalizedStringResource = "Słuchaj słowa"
    static let description = IntentDescription("Otwiera Eloquencee w trybie słuchania mikrofonu.")

    static let openAppWhenRun: Bool = true

    /// Wymagany parametr protokołu OpenIntent — cel, który ma zostać otwarty.
    @Parameter(title: "Tryb")
    var target: ListenTarget

    init() {
        self.target = ListenTarget.listen
    }

    @MainActor
    func perform() async throws -> some IntentResult {
        // Zapisz flagę w shared UserDefaults — aplikacja odczyta ją przy starcie.
        if let defaults = UserDefaults(suiteName: "group.app.lovable.eloquencee") {
            defaults.set(true, forKey: "openListenOnLaunch")
            defaults.set(Date().timeIntervalSince1970, forKey: "openListenTimestamp")
            defaults.synchronize()
        }
        // Fallback: standardowe UserDefaults
        UserDefaults.standard.set(true, forKey: "openListenOnLaunch")
        UserDefaults.standard.set(Date().timeIntervalSince1970, forKey: "openListenTimestamp")
        UserDefaults.standard.synchronize()
        return .result()
    }
}

/// Enum z jedną opcją — wymagany przez protokół OpenIntent jako AppEnum.
@available(iOS 18.0, *)
enum ListenTarget: String, AppEnum {
    case listen

    static let typeDisplayRepresentation: TypeDisplayRepresentation = "Tryb słuchania"
    static let caseDisplayRepresentations: [ListenTarget: DisplayRepresentation] = [
        .listen: DisplayRepresentation(title: "Słuchaj")
    ]
}
