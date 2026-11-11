package vn.soxe.organization;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Base64;
import org.json.JSONObject;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URI;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.Signature;
import java.security.spec.X509EncodedKeySpec;
import java.util.function.Consumer;
import javax.net.ssl.HttpsURLConnection;

/** Resolves a signed Apps Script endpoint while retaining known-good fallbacks. */
final class ServiceEndpointResolver {
    private static final String PREFS="native-cloud";
    private static final String KEY_URL="serviceUrl", KEY_PREVIOUS="previousServiceUrl", KEY_REVISION="serviceConfigRevision";
    private static final String PREFIX="so-xe-android-config-v1";
    private static final int MAX_CONFIG_BYTES=32*1024, MAX_HEALTH_BYTES=64*1024;

    private ServiceEndpointResolver() {}

    static void resolveAsync(Context context, Consumer<String> callback) {
        Context app=context.getApplicationContext();
        Thread worker=new Thread(()->callback.accept(resolve(app)),"so-xe-service-config");
        worker.setDaemon(true);worker.start();
    }

    static String resolve(Context context) {
        SharedPreferences prefs=context.getSharedPreferences(PREFS,Context.MODE_PRIVATE);
        String bootstrap=BuildConfig.SO_XE_SERVICE_URL;
        String current=validOr(prefs.getString(KEY_URL,""),bootstrap);
        String previous=validOr(prefs.getString(KEY_PREVIOUS,""),bootstrap);
        long savedRevision=Math.max(0,prefs.getLong(KEY_REVISION,0));
        try {
            Config config=verifyConfiguration(fetchConfig(BuildConfig.SO_XE_CONFIG_URL),BuildConfig.SO_XE_CONFIG_PUBLIC_KEY);
            if(config.revision<savedRevision||config.revision==savedRevision&&!config.serviceUrl.equals(current))return current;
            if(healthy(config.serviceUrl)){
                SharedPreferences.Editor edit=prefs.edit().putString(KEY_URL,config.serviceUrl).putLong(KEY_REVISION,config.revision);
                if(!config.serviceUrl.equals(current))edit.putString(KEY_PREVIOUS,current);
                edit.apply();return config.serviceUrl;
            }
            if(!previous.equals(config.serviceUrl)&&healthy(previous))return previous;
        } catch(Exception ignored) { /* A bad or unavailable config must never replace the cached endpoint. */ }
        return current;
    }

    static boolean isOfficialServiceUrl(String value) {
        try {
            URI uri=new URI(value);
            return "https".equals(uri.getScheme())&&"script.google.com".equals(uri.getHost())&&uri.getPort()==-1&&uri.getRawUserInfo()==null&&uri.getRawQuery()==null&&uri.getRawFragment()==null&&uri.getRawPath()!=null&&uri.getRawPath().matches("/macros/s/[A-Za-z0-9_-]+/exec");
        } catch(Exception ignored){return false;}
    }

    static Config verifyConfiguration(String json,String publicKeyBase64) throws Exception {
        if(json==null||json.getBytes(StandardCharsets.UTF_8).length>MAX_CONFIG_BYTES)throw new SecurityException("Cấu hình quá lớn.");
        JSONObject value=new JSONObject(json);
        if(value.optInt("schema")!=1||!"SHA256withRSA".equals(value.optString("signatureAlgorithm")))throw new SecurityException("Định dạng cấu hình không hợp lệ.");
        long revision=value.optLong("revision",0);String serviceUrl=value.optString("serviceUrl","");String encoded=value.optString("signature","");
        if(revision<=0||!isOfficialServiceUrl(serviceUrl)||encoded.isEmpty())throw new SecurityException("Nội dung cấu hình không hợp lệ.");
        PublicKey key=KeyFactory.getInstance("RSA").generatePublic(new X509EncodedKeySpec(Base64.decode(publicKeyBase64,Base64.DEFAULT)));
        Signature verifier=Signature.getInstance("SHA256withRSA");verifier.initVerify(key);verifier.update(canonical(revision,serviceUrl));
        if(!verifier.verify(Base64.decode(encoded,Base64.DEFAULT)))throw new SecurityException("Chữ ký cấu hình không hợp lệ.");
        return new Config(revision,serviceUrl);
    }

    static byte[] canonical(long revision,String serviceUrl) {
        return (PREFIX+"\n1\n"+revision+"\n"+serviceUrl+"\n").getBytes(StandardCharsets.UTF_8);
    }

    private static String validOr(String value,String fallback){return isOfficialServiceUrl(value)?value:fallback;}

    private static String fetchConfig(String address) throws Exception {
        URL target=new URL(address);HttpsURLConnection connection=null;
        for(int redirect=0;redirect<3;redirect++){
            if(!"https".equals(target.getProtocol())||!"lehuynhanhtu-prog.github.io".equals(target.getHost())||target.getPort()!=-1||target.getUserInfo()!=null||!"/so-xe-to-chuc/android-service-config.json".equals(target.getPath())||target.getQuery()!=null||target.getRef()!=null)throw new SecurityException("Nguồn cấu hình không hợp lệ.");
            connection=(HttpsURLConnection)target.openConnection();connection.setInstanceFollowRedirects(false);connection.setConnectTimeout(5000);connection.setReadTimeout(7000);connection.setUseCaches(false);connection.setRequestProperty("Accept","application/json");
            int status=connection.getResponseCode();
            if(status==301||status==302||status==307||status==308){String location=connection.getHeaderField("Location");connection.disconnect();connection=null;if(location==null)throw new java.io.IOException("Thiếu địa chỉ chuyển hướng.");target=new URL(target,location);continue;}
            if(status!=200)throw new java.io.IOException("Không tải được cấu hình.");
            try(InputStream in=connection.getInputStream()){return read(in,MAX_CONFIG_BYTES);}
            finally{connection.disconnect();connection=null;}
        }
        throw new java.io.IOException("Cấu hình chuyển hướng quá nhiều lần.");
    }

    private static boolean healthy(String serviceUrl) {
        HttpsURLConnection connection=null;
        try {
            byte[] payload="{\"method\":\"health\",\"request\":{}}".getBytes(StandardCharsets.UTF_8);URL target=new URL(serviceUrl);boolean post=true;
            for(int redirect=0;redirect<5;redirect++){
                String host=target.getHost();
                if(!"https".equals(target.getProtocol())||!("script.google.com".equals(host)||"script.googleusercontent.com".equals(host)||host.endsWith("-script.googleusercontent.com")))return false;
                connection=(HttpsURLConnection)target.openConnection();connection.setInstanceFollowRedirects(false);connection.setConnectTimeout(5000);connection.setReadTimeout(8000);connection.setUseCaches(false);connection.setRequestProperty("Accept","application/json");
                if(post){connection.setRequestMethod("POST");connection.setDoOutput(true);connection.setFixedLengthStreamingMode(payload.length);connection.setRequestProperty("Content-Type","application/json; charset=utf-8");try(OutputStream out=connection.getOutputStream()){out.write(payload);}}
                else connection.setRequestMethod("GET");
                int status=connection.getResponseCode();
                if(status==301||status==302||status==303||status==307||status==308){String location=connection.getHeaderField("Location");connection.disconnect();connection=null;if(location==null)return false;target=new URL(target,location);post=status==307||status==308;continue;}
                if(status!=200)return false;
                JSONObject response=new JSONObject(read(connection.getInputStream(),MAX_HEALTH_BYTES));
                return response.optBoolean("ok")&&response.optJSONObject("result")!=null&&!response.optJSONObject("result").optString("version").isEmpty();
            }
        } catch(Exception ignored) { return false; }
        finally{if(connection!=null)connection.disconnect();}
        return false;
    }

    private static String read(InputStream in,int limit) throws Exception {
        try(InputStream source=in;ByteArrayOutputStream out=new ByteArrayOutputStream()){byte[] block=new byte[4096];int n,total=0;while((n=source.read(block))!=-1){total+=n;if(total>limit)throw new java.io.IOException("Phản hồi vượt giới hạn.");out.write(block,0,n);}return out.toString(StandardCharsets.UTF_8.name());}
    }

    static final class Config { final long revision;final String serviceUrl;Config(long revision,String serviceUrl){this.revision=revision;this.serviceUrl=serviceUrl;} }
}
