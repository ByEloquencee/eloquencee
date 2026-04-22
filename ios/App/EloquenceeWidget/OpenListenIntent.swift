import AppIntents
import SwiftUI
import Foundation
#if canImport(UIKit)
import UIKit
#endif

/// AppIntent uruchamiany po kliknięciu kafelka w Centrum Sterowania.
///
/// UWAGA: W iOS 18 `ControlWidgetButton(action:)` z AppIntent zgodnym z OpenIntent
/// w praktyce często NIE otwiera aplikacji, jeśli intent nie jest zarejestrowany jako
/// AppShortcut, albo gdy parametr `target` jest nietypowym `AppEnum`. Dlatego używamy
/// najprostszego, sprawdzonego rozwiązania:
///   - `openAppWhenRun = true` zmusza system do otwarcia aplikacji hostującej
///   - dodatkowo zapisujemy flagę w shared UserDefaults (App Group), żeby aplikacja
///     po starcie wiedziała, że ma od razu przejść do trybu /listen
///   - w `perform()` próbujemy też otworzyć URL `eloquencee://listen`, który już jest
///     obsłużony przez DeepLinkHandler w React (przekierowuje na /listen)
@available(iOS 18.0, *)
struct OpenListenIntent: AppIntent {
    static let title: LocalizedStringResource = "Słuchaj słowa"
    static let description = IntentDescription("Otwiera Eloquencee w trybie słuchania mikrofonu.")

    /// KLUCZOWE: to flaga, która faktycznie wymusza uruchomienie aplikacji hostującej
    /// po wykonaniu intenta z poziomu Control Center / Lock Screen.
    static let openAppWhenRun: Bool = true

    init() {}

    @MainActor
    func perform() async throws -> some IntentResult & OpensIntent {
        // 1) Zapisz flagę w shared UserDefaults — aplikacja odczyta ją przy starcie.
        if let defaults = UserDefaults(suiteName: "group.app.lovable.eloquencee") {
            defaults.set(true, forKey: "openListenOnLaunch")
            defaults.set(Date().timeIntervalSince1970, forKey: "openListenTimestamp")
            defaults.synchronize()
        }
        // Fallback: standardowe UserDefaults
        UserDefaults.standard.set(true, forKey: "openListenOnLaunch")
        UserDefaults.standard.set(Date().timeIntervalSince1970, forKey: "openListenTimestamp")
        UserDefaults.standard.synchronize()

        // 2) Zwróć OpenURLIntent z deep linkiem — system otworzy aplikację Eloquencee
        //    przez zarejestrowany URL scheme `eloquencee://`, a DeepLinkHandler w React
        //    przekieruje użytkownika na ekran /listen.
        let url = URL(string: "eloquencee://listen")!
        return .result(opensIntent: OpenURLIntent(url))
    }
}
