import AppIntents
import Foundation

@available(iOS 18.0, *)
enum EloquenceeOpenTarget: String, AppEnum {
    case listen

    static let typeDisplayRepresentation = TypeDisplayRepresentation(name: "Ekran Eloquencee")
    static let caseDisplayRepresentations: [Self: DisplayRepresentation] = [
        .listen: DisplayRepresentation(title: "Nasłuchiwanie")
    ]
}

/// Intent używany przez kontrolkę w Centrum Sterowania.
/// Musi być dołączony zarówno do aplikacji, jak i do rozszerzenia widżetu,
/// aby iOS mógł poprawnie otworzyć aplikację hostującą po kliknięciu.
@available(iOS 18.0, *)
struct OpenListenIntent: OpenIntent {
    static let title: LocalizedStringResource = "Słuchaj słowa"
    static let description = IntentDescription("Otwiera Eloquencee na ekranie nasłuchiwania słowa.")
    static let openAppWhenRun = true

    @Parameter(title: "Ekran")
    var target: EloquenceeOpenTarget

    init() {
        self.target = .listen
    }

    init(target: EloquenceeOpenTarget) {
        self.target = target
    }

    func perform() async throws -> some IntentResult {
        let timestamp = Date().timeIntervalSince1970

        if let sharedDefaults = UserDefaults(suiteName: "group.app.lovable.eloquencee") {
            sharedDefaults.set(true, forKey: "openListenOnLaunch")
            sharedDefaults.set(timestamp, forKey: "openListenTimestamp")
            sharedDefaults.synchronize()
        }

        UserDefaults.standard.set(true, forKey: "openListenOnLaunch")
        UserDefaults.standard.set(timestamp, forKey: "openListenTimestamp")
        UserDefaults.standard.synchronize()

        return .result()
    }
}
