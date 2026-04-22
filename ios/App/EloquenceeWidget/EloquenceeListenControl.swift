import WidgetKit
import SwiftUI
import AppIntents

/// Kafelek "Słuchaj" w Centrum Sterowania (iOS 18+).
/// Po kliknięciu uruchamia OpenListenIntent, który otwiera aplikację Eloquencee
/// poprzez deep link `eloquencee://listen` (DeepLinkHandler w React przekierowuje na /listen).
@available(iOS 18.0, *)
struct EloquenceeListenControl: ControlWidget {
    static let kind: String = "app.lovable.c20ad8853dec429f978dd9d0a849170f.ListenControl"

    var body: some ControlWidgetConfiguration {
        StaticControlConfiguration(kind: Self.kind) {
            ControlWidgetButton(action: OpenListenIntent()) {
                Label("Eloquencee", systemImage: "book.fill")
            }
        }
        .displayName("Eloquencee — Słuchaj")
        .description("Powiedz słowo, a Eloquencee pokaże jego znaczenie.")
    }
}
