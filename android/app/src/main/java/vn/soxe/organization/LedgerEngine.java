package vn.soxe.organization;

import android.annotation.SuppressLint;
import android.content.Context;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.webkit.WebViewCompat;
import androidx.webkit.WebViewFeature;
import org.json.JSONObject;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import javax.net.ssl.HttpsURLConnection;

/** Native data bridge. All visible application screens are Android Views. */
final class LedgerEngine {
    private static final String SERVICE_URL="https://script.google.com/macros/s/AKfycbx7PPZGfl9VTevOHnWhoYchI2UMAiqP_8gUcmxbIdkPPZ_gQNKoKEbnIF5ON8XotM_j/exec";
    interface Callback { void accept(JSONObject result, String error); }
    private final WebView runtime;
    private final android.os.Handler main=new android.os.Handler(android.os.Looper.getMainLooper());
    private boolean destroyed;
    private final Map<Integer, Callback> callbacks = new HashMap<>();
    private int sequence;
    private boolean ready;
    private boolean injected;
    private boolean injecting;
    private final boolean documentStartInjection;
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
        final String nativeRuntime;
        try(InputStream in=context.getAssets().open("native-runtime.js")){ByteArrayOutputStream out=new ByteArrayOutputStream();byte[] block=new byte[8192];int n;while((n=in.read(block))!=-1)out.write(block,0,n);nativeRuntime=out.toString(StandardCharsets.UTF_8.name());}
        catch(Exception error){throw new IllegalStateException("Không đọc được bộ xử lý native.",error);}
        documentStartInjection=WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT);
        runtime.setWebViewClient(new WebViewClient() {
            private boolean allowed(String scheme,String host){return "https".equals(scheme)&&host!=null&&("script.google.com".equals(host)||"script.googleusercontent.com".equals(host)||host.endsWith("-script.googleusercontent.com")||"www.gstatic.com".equals(host)||"fonts.gstatic.com".equals(host));}
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) { return !allowed(request.getUrl().getScheme(),request.getUrl().getHost()); }
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                if(allowed(request.getUrl().getScheme(),request.getUrl().getHost()))return null;
                return new WebResourceResponse("text/plain", "UTF-8", 403, "Blocked", new HashMap<>(), new ByteArrayInputStream(new byte[0]));
            }
            @Override public void onPageFinished(WebView view,String url){
                if(documentStartInjection||destroyed||injected||injecting)return;String host=android.net.Uri.parse(url).getHost();
                if("script.google.com".equals(host)||"script.googleusercontent.com".equals(host)){injecting=true;injectWhenRpcReady(view,nativeRuntime,0);}
            }
        });
        runtime.addJavascriptInterface(new Object() {
            @JavascriptInterface public void ready() { main.post(() -> { if(destroyed)return; ready = true; LedgerEngine.this.onReady.run(); }); }
            @JavascriptInterface public void reply(int id, String json) {
                main.post(() -> {
                    if(destroyed)return;
                    Callback callback = callbacks.remove(id);
                    if (callback == null) return;
                    try {
                        JSONObject response = new JSONObject(json);
                        callback.accept(response.optJSONObject("result"), response.optBoolean("ok") ? null : response.optString("error", "Lỗi xử lý dữ liệu"));
                    } catch (Exception e) { callback.accept(null, "Không đọc được dữ liệu trả về."); }
                });
            }
            @JavascriptInterface public String httpPost(String json) {
                HttpsURLConnection connection=null;
                try {
                    if(json==null||json.isEmpty()||json.length()>80*1024*1024)throw new java.io.IOException("Yêu cầu Apps Script vượt giới hạn.");
                    byte[] payload=json.getBytes(StandardCharsets.UTF_8);URL target=new URL(SERVICE_URL);boolean post=true;
                    for(int redirect=0;redirect<5;redirect++){
                        String host=target.getHost();
                        if(!"https".equals(target.getProtocol())||!("script.google.com".equals(host)||"script.googleusercontent.com".equals(host)))throw new SecurityException("Địa chỉ Apps Script không hợp lệ.");
                        connection=(HttpsURLConnection)target.openConnection();connection.setInstanceFollowRedirects(false);connection.setConnectTimeout(15000);connection.setReadTimeout(90000);connection.setUseCaches(false);connection.setRequestProperty("Accept","application/json");
                        if(post){connection.setRequestMethod("POST");connection.setDoOutput(true);connection.setFixedLengthStreamingMode(payload.length);connection.setRequestProperty("Content-Type","application/json; charset=utf-8");try(OutputStream out=connection.getOutputStream()){out.write(payload);}}
                        else connection.setRequestMethod("GET");
                        int status=connection.getResponseCode();
                        if(status==301||status==302||status==303||status==307||status==308){String location=connection.getHeaderField("Location");connection.disconnect();connection=null;if(location==null)throw new java.io.IOException("Apps Script chuyển hướng không hợp lệ.");target=new URL(target,location);post=status==307||status==308;continue;}
                        InputStream in=status>=400?connection.getErrorStream():connection.getInputStream();ByteArrayOutputStream out=new ByteArrayOutputStream();
                        if(in!=null)try(InputStream source=in){byte[] block=new byte[8192];int n,total=0;while((n=source.read(block))!=-1){total+=n;if(total>80*1024*1024)throw new java.io.IOException("Phản hồi Apps Script vượt giới hạn.");out.write(block,0,n);}}
                        String body=out.toString(StandardCharsets.UTF_8.name());if(status<200||status>=300)throw new java.io.IOException("Apps Script trả lỗi HTTP "+status+".");return body;
                    }
                    throw new java.io.IOException("Apps Script chuyển hướng quá nhiều lần.");
                } catch(Exception e) {
                    try{return new JSONObject().put("ok",false).put("error",e.getMessage()==null?"Không kết nối được Apps Script.":e.getMessage()).toString();}
                    catch(Exception ignored){return "{\"ok\":false,\"error\":\"Không kết nối được Apps Script.\"}";}
                }
                finally {if(connection!=null)connection.disconnect();}
            }
        }, "Native");
        if(documentStartInjection){
            // Apps Script rewrites the inner /blank document after it loads, so
            // inject from its same-origin parent once google.script.run exists.
            String source=JSONObject.quote(nativeRuntime);
            String frameRuntime="if(location.pathname==='/userCodeAppPanel'&&location.hostname.endsWith('-script.googleusercontent.com')){(function install(){try{var f=document.getElementById('userHtmlFrame'),w=f&&f.contentWindow;if(w&&w.google&&w.google.script&&w.google.script.run&&!w.nativeCall){var s=w.document.createElement('script');s.text="+source+";w.document.documentElement.appendChild(s);s.remove();if(w.nativeCall)return;}}catch(e){}setTimeout(install,50);}());}";
            WebViewCompat.addDocumentStartJavaScript(runtime,frameRuntime,Collections.singleton("https://*.googleusercontent.com"));
        }
        runtime.loadUrl(SERVICE_URL);
    }
    private void injectWhenRpcReady(WebView view,String nativeRuntime,int attempt){
        if(destroyed||injected)return;
        view.evaluateJavascript("!!(globalThis.google&&google.script&&google.script.run)",value->{
            if(destroyed||injected)return;
            if("true".equals(value)){injected=true;injecting=false;view.evaluateJavascript(nativeRuntime,null);return;}
            if(attempt<60)main.postDelayed(()->injectWhenRpcReady(view,nativeRuntime,attempt+1),250);
            else injecting=false;
        });
    }
    void call(String action, JSONObject args, Callback callback) {
        if (!ready) { callback.accept(null, "Bộ xử lý đang khởi động. Hãy thử lại."); return; }
        int id = ++sequence;
        callbacks.put(id, callback);
        runtime.evaluateJavascript("nativeCall(" + id + "," + JSONObject.quote(action) + "," + args + ")", null);
        main.postDelayed(() -> {
            Callback pending = callbacks.remove(id);
            if (pending != null) pending.accept(null, "Thao tác chưa hoàn tất. Kiểm tra mạng và đồng bộ để xác nhận trước khi nhập lại.");
        }, 90000);
    }
    void destroy() { destroyed=true;main.removeCallbacksAndMessages(null);callbacks.clear(); onReady = () -> {}; runtime.removeJavascriptInterface("Native"); runtime.destroy(); }
}
