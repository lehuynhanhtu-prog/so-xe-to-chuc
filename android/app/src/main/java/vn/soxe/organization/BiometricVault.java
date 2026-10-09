package vn.soxe.organization;

import android.content.Context;
import android.content.SharedPreferences;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;
import androidx.biometric.BiometricManager;
import androidx.biometric.BiometricPrompt;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.FragmentActivity;
import org.json.JSONObject;
import java.security.KeyStore;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

final class BiometricVault {
    interface Result { void complete(JSONObject credentials, String error); }
    private static final String KEY = "soxe.native.login.v1";
    private final FragmentActivity activity;
    private final SharedPreferences prefs;
    BiometricVault(FragmentActivity activity) { this.activity = activity; prefs = activity.getSharedPreferences("biometric", Context.MODE_PRIVATE); }
    boolean available() { return BiometricManager.from(activity).canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG) == BiometricManager.BIOMETRIC_SUCCESS; }
    boolean exists() { return prefs.contains("ciphertext"); }
    void clear() {
        prefs.edit().clear().apply();
        try { KeyStore store = KeyStore.getInstance("AndroidKeyStore"); store.load(null); store.deleteEntry(KEY); } catch (Exception ignored) { }
    }
    void authenticate(JSONObject input, Result result) {
        try {
            KeyStore store = KeyStore.getInstance("AndroidKeyStore"); store.load(null);
            if (input != null) {
                clear();
                KeyGenerator generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore");
                generator.init(new KeyGenParameterSpec.Builder(KEY, KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
                        .setBlockModes(KeyProperties.BLOCK_MODE_GCM).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                        .setUserAuthenticationRequired(true).setInvalidatedByBiometricEnrollment(true).build());
                generator.generateKey();
            }
            SecretKey key = (SecretKey) store.getKey(KEY, null);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            if (input != null) cipher.init(Cipher.ENCRYPT_MODE, key);
            else cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(128, Base64.decode(prefs.getString("iv", ""), Base64.NO_WRAP)));
            BiometricPrompt prompt = new BiometricPrompt(activity, ContextCompat.getMainExecutor(activity), new BiometricPrompt.AuthenticationCallback() {
                @Override public void onAuthenticationSucceeded(BiometricPrompt.AuthenticationResult authenticated) {
                    try {
                        Cipher verified = authenticated.getCryptoObject().getCipher();
                        if (input != null) {
                            byte[] encrypted = verified.doFinal(input.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8));
                            prefs.edit().putString("ciphertext", Base64.encodeToString(encrypted, Base64.NO_WRAP))
                                    .putString("iv", Base64.encodeToString(verified.getIV(), Base64.NO_WRAP)).apply();
                            result.complete(input, null);
                        } else {
                            byte[] bytes = verified.doFinal(Base64.decode(prefs.getString("ciphertext", ""), Base64.NO_WRAP));
                            result.complete(new JSONObject(new String(bytes, java.nio.charset.StandardCharsets.UTF_8)), null);
                        }
                    } catch (Exception e) { clear(); result.complete(null, "Đăng nhập bằng mật khẩu rồi bật lại vân tay."); }
                }
                @Override public void onAuthenticationError(int code, CharSequence message) { result.complete(null, message.toString()); }
            });
            prompt.authenticate(new BiometricPrompt.PromptInfo.Builder().setTitle(input == null ? "Đăng nhập Sổ Xe" : "Bật đăng nhập vân tay")
                    .setSubtitle("Xác thực bằng sinh trắc học của thiết bị")
                    .setAllowedAuthenticators(BiometricManager.Authenticators.BIOMETRIC_STRONG)
                    .setNegativeButtonText("Dùng mật khẩu").build(), new BiometricPrompt.CryptoObject(cipher));
        } catch (Exception e) { clear(); result.complete(null, "Thiết bị chưa hỗ trợ hoặc vân tay đã thay đổi. Dùng mật khẩu để đăng nhập."); }
    }
}
