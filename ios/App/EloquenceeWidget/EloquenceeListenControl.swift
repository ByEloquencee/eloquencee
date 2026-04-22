import WidgetKit
import SwiftUI
import AppIntents

/// Kafelek "Słuchaj" w Centrum Sterowania (iOS 18+).
/// Po kliknięciu uruchamia OpenListenIntent (zgodny z OpenIntent), który
/// otwiera aplikację Eloquencee na ekranie /listen z włączonym mikrofonem.
@available(iOS 18.0, *)
struct EloquenceeListenControl: ControlWidget {
    static let kind: String = "app.lovable.c20ad8853dec429f978dd9d0a849170f.ListenControl"

    var body: some ControlWidgetConfiguration {
        StaticControlConfiguration(kind: Self.kind) {
            ControlWidgetButton(action: OpenListenIntent()) {
                Label {
                    Text("Eloquencee")
                } icon: {
                    // Custom PNG z assets widgetu (BookIcon) renderowane jako template.
                    // Jeśli asset nie jest dostępny w bundle widgetu, system użyje
                    // automatycznego fallbacku.
                    Image("BookIcon", bundle: .main)
                        .renderingMode(.template)
                        .resizable()
                }
            }
        }
        .displayName("Eloquencee — Słuchaj")
        .description("Powiedz słowo, a Eloquencee pokaże jego znaczenie.")
    }
}
