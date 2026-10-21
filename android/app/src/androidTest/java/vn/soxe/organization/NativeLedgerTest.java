package vn.soxe.organization;

import androidx.test.core.app.ActivityScenario;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.json.JSONObject;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import static org.junit.Assert.*;
import static androidx.test.espresso.Espresso.onView;
import static androidx.test.espresso.action.ViewActions.*;
import static androidx.test.espresso.assertion.ViewAssertions.*;
import static androidx.test.espresso.matcher.ViewMatchers.*;
import android.text.InputType;
import android.widget.EditText;

@RunWith(AndroidJUnit4.class)
public class NativeLedgerTest {
    @Before public void clear() {
        android.content.Context c=InstrumentationRegistry.getInstrumentation().getTargetContext();
        c.getSharedPreferences("native-cloud",0).edit().clear().commit();
        c.getSharedPreferences("biometric",0).edit().clear().commit();
    }
    @Test public void nativeLoginHasPasswordVisibility() {
        try(ActivityScenario<MainActivity> activity=ActivityScenario.launch(MainActivity.class)) {
            onView(withText("Đăng nhập Sổ Xe Tổ Chức")).check(matches(isDisplayed()));
            activity.onActivity(a->screenshot(a,"native-login.png"));
            onView(withText("Hiện mật khẩu")).check(matches(isDisplayed()));
            onView(withText("Hiện mật khẩu")).perform(click());
            onView(withText("Đăng nhập")).check(matches(isDisplayed()));
            onView(withText(org.hamcrest.Matchers.containsString("Không cần tài khoản Google"))).check(matches(isDisplayed()));
        }
    }
    @Test public void browserLauncherHasProfessionalLoginScreen() {
        try(ActivityScenario<BrowserMainActivity> activity=ActivityScenario.launch(BrowserMainActivity.class)) {
            onView(withText("Sổ Xe Tổ Chức")).check(matches(isDisplayed()));
            onView(withText("Đăng nhập")).check(matches(isDisplayed()));
            onView(withText("MỞ ỨNG DỤNG VÀ ĐĂNG NHẬP")).perform(scrollTo()).check(matches(isDisplayed()));
        }
    }
    @Test public void screenshotsAreAllowed() {
        try(ActivityScenario<MainActivity> activity=ActivityScenario.launch(MainActivity.class)) {
            activity.onActivity(a->assertEquals(0,a.getWindow().getAttributes().flags&android.view.WindowManager.LayoutParams.FLAG_SECURE));
        }
    }
    @Test public void nativeBridgeBootsAndReachesAppsScriptHealth() throws Exception {
        CountDownLatch latch=new CountDownLatch(1);
        final String[] error=new String[1];
        final LedgerEngine[] engine=new LedgerEngine[1];
        InstrumentationRegistry.getInstrumentation().runOnMainSync(()->{
            engine[0]=new LedgerEngine(InstrumentationRegistry.getInstrumentation().getTargetContext(),()->{
                engine[0].call("health",new JSONObject(),(r,e)->{error[0]=e;if(e==null&&(r==null||r.optString("version").isEmpty()))error[0]="Invalid health result";latch.countDown();});
            });
        });
        if(!latch.await(30,TimeUnit.SECONDS)){
            final String[] debug=new String[1];
            InstrumentationRegistry.getInstrumentation().runOnMainSync(()->debug[0]=engine[0].debugState());
            fail("Bundled module engine did not start: "+debug[0]);
        }
        assertNull(error[0]);
        InstrumentationRegistry.getInstrumentation().runOnMainSync(()->engine[0].destroy());
    }
    @Test public void nativeLoginContainsNoGoogleConnectionFlow() {
        try(ActivityScenario<MainActivity> activity=ActivityScenario.launch(MainActivity.class)) {
            onView(withText("Kết nối Google")).check(doesNotExist());
            onView(withText("ADMIN / Admin bổ sung")).check(doesNotExist());
            onView(withText("NSD / Admin chỉ xem")).check(doesNotExist());
        }
    }
    @androidx.annotation.RequiresApi(29)
    private static void screenshot(MainActivity a,String name) {
        try {
            {
                android.view.View view=a.getWindow().getDecorView();
                android.graphics.Bitmap image=android.graphics.Bitmap.createBitmap(view.getWidth(),view.getHeight(),android.graphics.Bitmap.Config.ARGB_8888);
                view.draw(new android.graphics.Canvas(image));
                android.content.ContentValues values=new android.content.ContentValues();
                values.put(android.provider.MediaStore.Images.Media.DISPLAY_NAME,name);
                values.put(android.provider.MediaStore.Images.Media.MIME_TYPE,"image/png");
                values.put(android.provider.MediaStore.Images.Media.RELATIVE_PATH,"Pictures/SoXeNative");
                android.net.Uri uri=a.getContentResolver().insert(android.provider.MediaStore.Images.Media.EXTERNAL_CONTENT_URI,values);
                if(uri==null)throw new IllegalStateException("No screenshot URI");
                try(java.io.OutputStream out=a.getContentResolver().openOutputStream(uri)){image.compress(android.graphics.Bitmap.CompressFormat.PNG,100,out);}
                catch(Exception e){throw new AssertionError(e);}finally{image.recycle();}
            }
        }catch(Exception e){throw new AssertionError(e);}
    }
    private static void fixture(MainActivity a,String role,String author) {
        try {
            JSONObject state=new JSONObject("{\"organization\":{\"name\":\"Tổ chức kiểm thử\"},\"me\":{\"id\":\"driver1\",\"name\":\"Lái xe A\",\"username\":\"laixe\",\"role\":\""+role+"\"},\"users\":[{\"id\":\"driver1\",\"name\":\"Lái xe A\",\"role\":\"driver\"},{\"id\":\"driver2\",\"name\":\"Lái xe B\",\"role\":\"driver\"}],\"cars\":[{\"id\":\"car1\",\"plate\":\"51A-12345\",\"name\":\"Xe kiểm thử\",\"odo\":1000}],\"carChoices\":[{\"id\":\"car1\",\"plate\":\"51A-12345\",\"assignedUserId\":\"driver1\"}],\"transactions\":[{\"id\":\"t1\",\"carId\":\"car1\",\"date\":\"2026-10-01\",\"amount\":123456789,\"odo\":1000,\"category\":\"fuel\",\"enteredBy\":\""+author+"\",\"enteredFor\":\"driver1\",\"description\":\"Xăng kiểm thử\",\"version\":1,\"attachments\":[]}],\"assignments\":[],\"handovers\":[]}");
            Field s=MainActivity.class.getDeclaredField("state");s.setAccessible(true);s.set(a,state);
            Field p=MainActivity.class.getDeclaredField("presentation");p.setAccessible(true);p.set(a,new JSONObject("{\"reminders\":[],\"monthly\":[],\"periods\":[]}"));
            Method render=MainActivity.class.getDeclaredMethod("render");render.setAccessible(true);render.invoke(a);
        } catch(Exception e){throw new AssertionError(e);}
    }
    @Test public void driverCannotEditAnotherAuthorsTransaction() {
        try(ActivityScenario<MainActivity> activity=ActivityScenario.launch(MainActivity.class)){
            activity.onActivity(a->fixture(a,"driver","driver2"));
            onView(withText(org.hamcrest.Matchers.containsString("· 123.456.789"))).perform(click());
            onView(withText("Sửa giao dịch")).check(doesNotExist());
            onView(withText("Xóa giao dịch")).check(doesNotExist());
        }
    }
    @Test public void adminCanEditAndLargeMoneyInputIsNotTruncated() {
        try(ActivityScenario<MainActivity> activity=ActivityScenario.launch(MainActivity.class)){
            activity.onActivity(a->fixture(a,"admin","driver2"));
            onView(withText("Tổ chức kiểm thử")).check(matches(isDisplayed()));
            activity.onActivity(a->screenshot(a,"native-overview.png"));
            onView(withText(org.hamcrest.Matchers.containsString("· 123.456.789"))).perform(click());
            onView(withText("Sửa giao dịch")).perform(scrollTo(),click());
            onView(withText("123.456.789")).perform(scrollTo(),replaceText("987654321"));
            androidx.test.espresso.Espresso.closeSoftKeyboard();
            onView(withText("987.654.321")).check(matches(isDisplayed()));
        }
    }
}
