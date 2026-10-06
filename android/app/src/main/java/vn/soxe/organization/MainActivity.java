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

/** Opens the shared HTTPS app in the system browser, keeping Google OAuth outside WebView. */
public final class MainActivity extends Activity {
    private static final String APP_URL = "https://lehuynhanhtu-prog.github.io/so-xe-to-chuc/";
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        int padding = (int)(24 * getResources().getDisplayMetrics().density);
        layout.setPadding(padding, padding * 2, padding, padding);
        layout.setBackgroundColor(Color.rgb(244,247,251));
        TextView title = new TextView(this);
        title.setText("Sổ Xe Tổ Chức"); title.setTextSize(27); title.setTextColor(Color.rgb(23,106,101));
        layout.addView(title);
        TextView description = new TextView(this);
        description.setText("Quản lý xe, chi phí và bàn giao xe.\n\nỨng dụng mở trong trình duyệt hệ thống để kết nối Google an toàn. Dữ liệu dùng chung với bản Web, Windows và iOS. Cần kết nối Internet để đăng nhập và đồng bộ.\n");
        description.setTextSize(17); layout.addView(description);
        Button open = new Button(this); open.setText("Mở Sổ Xe Tổ Chức");
        open.setOnClickListener(v -> openApp()); layout.addView(open);
        TextView version = new TextView(this); version.setText("Phiên bản 4.6.0 · Android 7 trở lên"); layout.addView(version);
        setContentView(layout);
        if (state == null) openApp();
    }
    private void openApp() {
        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(APP_URL));
        intent.addCategory(Intent.CATEGORY_BROWSABLE);
        try { startActivity(intent); }
        catch (ActivityNotFoundException error) {
            Toast.makeText(this, "Hãy cài Chrome hoặc trình duyệt hỗ trợ đăng nhập Google.", Toast.LENGTH_LONG).show();
        }
    }
}
