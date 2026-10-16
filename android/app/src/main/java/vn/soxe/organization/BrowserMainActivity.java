package vn.soxe.organization;

import android.app.Activity;
import android.os.Bundle;
import android.content.Intent;
import android.content.ActivityNotFoundException;
import android.net.Uri;
import android.graphics.Color;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

/**
 * Android 4.8.3 uses the same proven sign-in boundary as 4.7.  Google OAuth
 * and Drive consent run in Chrome/the system browser, rather than a native
 * token bridge, so the verified Web OAuth client and signed-in Google account
 * on the device are used unchanged.
 */
public final class BrowserMainActivity extends Activity {
    private static final String APP_URL = "https://lehuynhanhtu-prog.github.io/so-xe-to-chuc/";

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        int padding = (int)(24 * getResources().getDisplayMetrics().density);
        layout.setPadding(padding, padding * 2, padding, padding);
        layout.setBackgroundColor(Color.rgb(244,247,251));

        TextView title = new TextView(this);
        title.setText("Sổ Xe Tổ Chức");
        title.setTextSize(27);
        title.setTextColor(Color.rgb(23,106,101));
        layout.addView(title);

        TextView description = new TextView(this);
        description.setText("Phiên bản 4.8.3 mở Sổ Xe Tổ Chức bằng trình duyệt hệ thống, giống bản 4.7 đã đăng nhập Google ổn định. Google OAuth và quyền Drive được xử lý trực tiếp trong Chrome/trình duyệt, dùng chung dữ liệu với Web, Windows và iOS. Cần Internet để đăng nhập và đồng bộ.\n");
        description.setTextSize(17);
        layout.addView(description);

        Button open = new Button(this);
        open.setText("Mở Sổ Xe Tổ Chức");
        open.setOnClickListener(v -> openApp());
        layout.addView(open);

        TextView version = new TextView(this);
        version.setText("Phiên bản 4.8.3 · Android 7 trở lên");
        layout.addView(version);
        setContentView(layout);
        if (state == null) openApp();
    }

    private void openApp() {
        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(APP_URL));
        intent.addCategory(Intent.CATEGORY_BROWSABLE);
        Bundle extras = new Bundle();
        extras.putBinder("android.support.customtabs.extra.SESSION", null);
        intent.putExtras(extras);
        intent.putExtra("android.support.customtabs.extra.TOOLBAR_COLOR", Color.rgb(23,106,101));
        intent.putExtra("android.support.customtabs.extra.TITLE_VISIBILITY", 0);
        intent.putExtra("android.support.customtabs.extra.ENABLE_URLBAR_HIDING", true);
        try {
            startActivity(intent);
        } catch (ActivityNotFoundException error) {
            Toast.makeText(this, "Hãy cài Chrome hoặc trình duyệt hỗ trợ đăng nhập Google.", Toast.LENGTH_LONG).show();
        }
    }
}
