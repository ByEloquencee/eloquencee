import WidgetKit
import SwiftUI

private let widgetFunctionURL = URL(string: "https://vcovontzkazhhatxyzsu.supabase.co/functions/v1/daily-word-widget")!
private let widgetAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjb3ZvbnR6a2F6aGhhdHh5enN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzMTIyMTksImV4cCI6MjA4Nzg4ODIxOX0.AM9GtQRCnt0zPgn6uPtGzIGxh12qwXax3mx2jkCJPu0"

struct WordEntry: TimelineEntry {
    let date: Date
    let word: String
    let definition: String
}

private struct WordResponse: Decodable {
    let word: String
    let definition: String
}

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> WordEntry {
        WordEntry(
            date: Date(),
            word: "Eloquencja",
            definition: "Sztuka pięknego i przekonującego mówienia."
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (WordEntry) -> Void) {
        Task {
            let entry = await loadEntry()
            completion(entry)
        }
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<WordEntry>) -> Void) {
        Task {
            let entry = await loadEntry()
            let nextUpdate = Calendar.current.date(byAdding: .hour, value: 6, to: Date()) ?? Date().addingTimeInterval(21600)
            completion(Timeline(entries: [entry], policy: .after(nextUpdate)))
        }
    }

    private func loadEntry() async -> WordEntry {
        var request = URLRequest(url: widgetFunctionURL)
        request.cachePolicy = .reloadIgnoringLocalCacheData
        request.timeoutInterval = 15
        request.setValue(widgetAnonKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(widgetAnonKey)", forHTTPHeaderField: "Authorization")

        do {
            let (data, _) = try await URLSession.shared.data(for: request)
            let payload = try JSONDecoder().decode(WordResponse.self, from: data)
            return WordEntry(
                date: Date(),
                word: payload.word,
                definition: payload.definition
            )
        } catch {
            return WordEntry(
                date: Date(),
                word: "Eloquencja",
                definition: "Otwórz aplikację, aby odświeżyć słowo dnia."
            )
        }
    }
}

struct EloquenceeWidgetEntryView: View {
    var entry: Provider.Entry

    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            VStack(alignment: .leading, spacing: 6) {
                Text("Słowo dnia")
                    .font(.system(size: 10, weight: .semibold))
                    .foregroundStyle(.secondary)
                    .textCase(.uppercase)

                Text(entry.word)
                    .font(.system(size: 18, weight: .bold, design: .serif))
                    .lineLimit(2)
                    .minimumScaleFactor(0.8)

                Text(entry.definition)
                    .font(.system(size: 11))
                    .foregroundStyle(.secondary)
                    .lineLimit(5)
                    .fixedSize(horizontal: false, vertical: true)

                Spacer(minLength: 0)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)

            // Watermark in bottom-right corner
            Text("eloquencee")
                .font(.system(size: 8, weight: .medium, design: .serif))
                .foregroundStyle(.secondary.opacity(0.5))
        }
        .widgetContainerBackground()
    }
}

// Modifier compatible with iOS 14+ (uses containerBackground on iOS 17+)
extension View {
    @ViewBuilder
    func widgetContainerBackground() -> some View {
        if #available(iOS 17.0, *) {
            self.containerBackground(for: .widget) {
                Color(uiColor: .secondarySystemBackground)
            }
        } else {
            self.padding(14)
                .background(Color(uiColor: .secondarySystemBackground))
        }
    }
}

struct EloquenceeWidget: Widget {
    let kind: String = "EloquenceeWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            EloquenceeWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Słowo dnia")
        .description("Codziennie nowe słowo na ekranie głównym iPhone'a.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

struct EloquenceeWidget_Previews: PreviewProvider {
    static var previews: some View {
        EloquenceeWidgetEntryView(
            entry: WordEntry(
                date: .now,
                word: "Eloquencja",
                definition: "Sztuka pięknego i przekonującego mówienia."
            )
        )
        .previewContext(WidgetPreviewContext(family: .systemSmall))
    }
}
