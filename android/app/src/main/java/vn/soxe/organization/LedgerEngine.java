package vn.soxe.organization;

import android.annotation.SuppressLint;
import android.content.Context;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.webkit.WebViewAssetLoader;
import org.json.JSONObject;
import java.io.ByteArrayInputStream;
import java.util.HashMap;
import java.util.Map;

/** Local computation only. All visible application screens are Android Views. */
final class LedgerEngine {
    interface Callback { void accept(JSONObject result, String error); }
    private final WebView runtime;
    private final Map<Integer, Callback> callbacks = new HashMap<>();
    private int sequence;
    private boolean ready;
    private Runnable onReady;
    @SuppressLint("SetJavaScriptEnabled")
    LedgerEngine(Context context, Runnable onReady) {
        this.onReady = onReady;
        runtime = new WebView(context);
        runtime.getSettings().setJavaScriptEnabled(true);
        runtime.getSettings().setAllowFileAccess(false);
        runtime.getSettings().setAllowContentAccess(false);
        runtime.getSettings().setMixedContentMode(android.webkit.WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        runtime.getSettings().setDomStorageEnabled(false);
        WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(context)).build();
        runtime.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) { return true; }
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                if ("appassets.androidplatform.net".equals(request.getUrl().getHost())
                        && "https".equals(request.getUrl().getScheme())) return loader.shouldInterceptRequest(request.getUrl());
                if ("www.googleapis.com".equals(request.getUrl().getHost())
                        && "https".equals(request.getUrl().getScheme())) return null;
                return new WebResourceResponse("text/plain", "UTF-8", 403, "Blocked", new HashMap<>(), new ByteArrayInputStream(new byte[0]));
            }
        });
        runtime.addJavascriptInterface(new Object() {
            @JavascriptInterface public void ready() { runtime.post(() -> { ready = true; LedgerEngine.this.onReady.run(); }); }
            @JavascriptInterface public void reply(int id, String json) {
                runtime.post(() -> {
                    Callback callback = callbacks.remove(id);
                    if (callback == null) return;
                    try {
                        JSONObject response = new JSONObject(json);
                        callback.accept(response.optJSONObject("result"), response.optBoolean("ok") ? null : response.optString("error", "Lỗi xử lý dữ liệu"));
                    } catch (Exception e) { callback.accept(null, "Không đọc được dữ liệu trả về."); }
                });
            }
        }, "Native");
        runtime.loadUrl("https://appassets.androidplatform.net/assets/engine.html");
    }
    void call(String action, JSONObject args, Callback callback) {
        if (!ready) { callback.accept(null, "Bộ xử lý đang khởi động. Hãy thử lại."); return; }
        int id = ++sequence;
        callbacks.put(id, callback);
        runtime.evaluateJavascript("nativeCall(" + id + "," + JSONObject.quote(action) + "," + args + ")", null);
        runtime.postDelayed(() -> {
            Callback pending = callbacks.remove(id);
            if (pending != null) pending.accept(null, "Thao tác chưa hoàn tất. Kiểm tra mạng và đồng bộ để xác nhận trước khi nhập lại.");
        }, 180000);
    }
    void destroy() { callbacks.clear(); onReady = () -> {}; runtime.removeJavascriptInterface("Native"); runtime.destroy(); }
}
