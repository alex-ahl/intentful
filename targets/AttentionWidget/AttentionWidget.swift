import WidgetKit
import SwiftUI

// MARK: - Data

struct WidgetData {
    let interventions: Int
    let topApp: String?
    let topAppCount: Int
    let streak: Int
    let isActive: Bool
}

// MARK: - Provider

struct AttentionProvider: TimelineProvider {
    let appGroup = "group.intentful.shared"

    func placeholder(in context: Context) -> AttentionEntry {
        AttentionEntry(date: Date(), data: WidgetData(
            interventions: 3,
            topApp: "Instagram",
            topAppCount: 7,
            streak: 5,
            isActive: true
        ))
    }

    func getSnapshot(in context: Context, completion: @escaping (AttentionEntry) -> Void) {
        completion(AttentionEntry(date: Date(), data: loadData()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<AttentionEntry>) -> Void) {
        let entry = AttentionEntry(date: Date(), data: loadData())
        // Refresh every 15 minutes
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: Date())!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }

    private func loadData() -> WidgetData {
        guard let defaults = UserDefaults(suiteName: appGroup) else {
            return WidgetData(interventions: 0, topApp: nil, topAppCount: 0, streak: 0, isActive: false)
        }

        let interventions = defaults.integer(forKey: "widget_interventions_today")
        let topApp = defaults.string(forKey: "widget_top_app")
        let topAppCount = defaults.integer(forKey: "widget_top_app_count")
        let streak = defaults.integer(forKey: "widget_streak")
        let isActive = defaults.bool(forKey: "widget_is_active")

        return WidgetData(
            interventions: interventions,
            topApp: topApp,
            topAppCount: topAppCount,
            streak: streak,
            isActive: isActive
        )
    }
}

// MARK: - Entry

struct AttentionEntry: TimelineEntry {
    let date: Date
    let data: WidgetData
}

// MARK: - Views

struct AttentionWidgetSmallView: View {
    let data: WidgetData

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Circle()
                    .fill(data.isActive ? Color.green : Color.gray)
                    .frame(width: 8, height: 8)
                Text(data.isActive ? "Active" : "Paused")
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }

            Text("\(data.interventions)")
                .font(.system(size: 36, weight: .bold, design: .rounded))
                .foregroundColor(Color(red: 0.506, green: 0.549, blue: 0.973))

            Text("interventions today")
                .font(.caption2)
                .foregroundColor(.secondary)

            Spacer()

            if data.streak > 0 {
                Text("\(data.streak)d streak")
                    .font(.caption)
                    .foregroundColor(.green)
            }
        }
        .padding()
        .containerBackground(.fill.tertiary, for: .widget)
    }
}

struct AttentionWidgetMediumView: View {
    let data: WidgetData

    var body: some View {
        HStack(spacing: 16) {
            // Left: intervention count
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Circle()
                        .fill(data.isActive ? Color.green : Color.gray)
                        .frame(width: 8, height: 8)
                    Text(data.isActive ? "Active" : "Paused")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }

                Text("\(data.interventions)")
                    .font(.system(size: 42, weight: .bold, design: .rounded))
                    .foregroundColor(Color(red: 0.506, green: 0.549, blue: 0.973))

                Text("interventions")
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }

            Divider()

            // Right: details
            VStack(alignment: .leading, spacing: 8) {
                if let topApp = data.topApp, data.topAppCount > 0 {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(topApp)
                            .font(.subheadline)
                            .fontWeight(.semibold)
                        Text("\(data.topAppCount) opens today")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }

                if data.streak > 0 {
                    HStack(spacing: 4) {
                        Image(systemName: "flame.fill")
                            .foregroundColor(.green)
                            .font(.caption)
                        Text("\(data.streak)-day streak")
                            .font(.caption)
                            .foregroundColor(.green)
                    }
                }

                Spacer()
            }
        }
        .padding()
        .containerBackground(.fill.tertiary, for: .widget)
    }
}

// MARK: - Widget

struct AttentionWidget: Widget {
    let kind: String = "AttentionWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: AttentionProvider()) { entry in
            if #available(iOS 17.0, *) {
                switch WidgetFamily.systemSmall {
                default:
                    AttentionWidgetSmallView(data: entry.data)
                }
            }
        }
        .configurationDisplayName("Attention")
        .description("See your daily awareness stats at a glance.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

@main
struct AttentionWidgetBundle: WidgetBundle {
    var body: some Widget {
        AttentionWidget()
    }
}
