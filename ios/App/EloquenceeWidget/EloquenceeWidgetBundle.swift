import WidgetKit
import SwiftUI

@main
struct EloquenceeWidgetBundle: WidgetBundle {
    @WidgetBundleBuilder
    var body: some Widget {
        EloquenceeWidget()
        if #available(iOS 18.0, *) {
            EloquenceeListenControl()
        }
    }
}
