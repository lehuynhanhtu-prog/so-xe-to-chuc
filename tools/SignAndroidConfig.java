import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.Key;
import java.security.KeyStore;
import java.security.PrivateKey;
import java.security.Signature;
import java.security.cert.Certificate;
import java.util.Base64;

/** Creates the small signed endpoint document consumed by the native Android app. */
public final class SignAndroidConfig {
    private static final String PREFIX="so-xe-android-config-v1";

    public static void main(String[] args) throws Exception {
        if(args.length!=6)throw new IllegalArgumentException("Usage: keystore alias revision serviceUrl expectedPublicKey output");
        String storePassword=required("ANDROID_KEYSTORE_PASSWORD"),keyPassword=required("ANDROID_KEY_PASSWORD");
        long revision=Long.parseLong(args[2]);String serviceUrl=args[3];
        if(revision<=0||!official(serviceUrl))throw new IllegalArgumentException("Invalid revision or Apps Script URL");
        KeyStore store=loadStore(Path.of(args[0]),storePassword);
        Key key=store.getKey(args[1],keyPassword.toCharArray());
        if(!(key instanceof PrivateKey))throw new IllegalArgumentException("Signing key is unavailable");
        Certificate certificate=store.getCertificate(args[1]);
        String actual=Base64.getEncoder().encodeToString(certificate.getPublicKey().getEncoded());
        String expected=Files.readString(Path.of(args[4]),StandardCharsets.UTF_8).trim();
        if(!actual.equals(expected))throw new SecurityException("APK config public key does not match the release keystore");
        Signature signer=Signature.getInstance("SHA256withRSA");signer.initSign((PrivateKey)key);signer.update(canonical(revision,serviceUrl));
        String signature=Base64.getEncoder().encodeToString(signer.sign());
        String json="{\n  \"schema\": 1,\n  \"revision\": "+revision+",\n  \"serviceUrl\": \""+serviceUrl+"\",\n  \"signatureAlgorithm\": \"SHA256withRSA\",\n  \"signature\": \""+signature+"\"\n}\n";
        Files.writeString(Path.of(args[5]),json,StandardCharsets.UTF_8);
    }

    private static byte[] canonical(long revision,String serviceUrl){return (PREFIX+"\n1\n"+revision+"\n"+serviceUrl+"\n").getBytes(StandardCharsets.UTF_8);}
    private static KeyStore loadStore(Path path,String password) throws Exception {
        Exception failure=null;
        for(String type:new String[]{"JKS","PKCS12"})try{KeyStore store=KeyStore.getInstance(type);try(java.io.InputStream in=Files.newInputStream(path)){store.load(in,password.toCharArray());}return store;}catch(Exception error){failure=error;}
        throw failure;
    }
    private static String required(String name){String value=System.getenv(name);if(value==null||value.isEmpty())throw new IllegalArgumentException(name+" is missing");return value;}
    private static boolean official(String value){try{URI uri=new URI(value);return "https".equals(uri.getScheme())&&"script.google.com".equals(uri.getHost())&&uri.getPort()==-1&&uri.getRawUserInfo()==null&&uri.getRawQuery()==null&&uri.getRawFragment()==null&&uri.getRawPath()!=null&&uri.getRawPath().matches("/macros/s/[A-Za-z0-9_-]+/exec");}catch(Exception ignored){return false;}}
}
