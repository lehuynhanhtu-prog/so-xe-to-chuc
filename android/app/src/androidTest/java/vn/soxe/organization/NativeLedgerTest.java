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
        c.getSharedPreferences("google-storage",0).edit().clear().commit();
        c.getSharedPreferences("biometric",0).edit().clear().commit();
    }
    @Test public void nativeLoginHasPasswordVisibility() {
        try(ActivityScenario<MainActivity> activity=ActivityScenario.launch(MainActivity.class)) {
            onView(withText("NSD / Admin chỉ xem")).perform(click());
            onView(withText("Đăng nhập NSD")).check(matches(isDisplayed()));
            activity.onActivity(a->screenshot(a,"native-login.png"));
            onView(withText("Hiện mật khẩu")).check(matches(isDisplayed()));
            onView(withText("Hiện mật khẩu")).perform(click());
            onView(withText("Đăng nhập")).check(matches(isDisplayed()));
        }
    }
    @Test public void localLedgerCoreBootsWithoutBrowserOrNetwork() throws Exception {
        CountDownLatch latch=new CountDownLatch(1);
        final String[] error=new String[1];
        final LedgerEngine[] engine=new LedgerEngine[1];
        InstrumentationRegistry.getInstrumentation().runOnMainSync(()->{
            engine[0]=new LedgerEngine(InstrumentationRegistry.getInstrumentation().getTargetContext(),()->{
                engine[0].call("logout",new JSONObject(),(r,e)->{error[0]=e;if(r==null||!r.optBoolean("loggedOut"))error[0]="Invalid result";latch.countDown();});
            });
        });
        assertTrue("Bundled module engine did not start",latch.await(30,TimeUnit.SECONDS));
        assertNull(error[0]);
        InstrumentationRegistry.getInstrumentation().runOnMainSync(()->engine[0].destroy());
    }
    @Test public void googleAccountChoiceIsCommittedBeforeAuthorizationAndSurvivesRecreation() throws Exception {
        try(ActivityScenario<MainActivity> activity=ActivityScenario.launch(MainActivity.class)) {
            activity.onActivity(a->{
                try {
                    Method save=MainActivity.class.getDeclaredMethod("saveGoogleAccount",String.class,String.class);save.setAccessible(true);
                    assertTrue((Boolean)save.invoke(a,"primary","Admin.Storage@Example.Test"));
                    Field attemptField=MainActivity.class.getDeclaredField("loginAttempt");attemptField.setAccessible(true);
                    MainActivity.LoginAttempt attempt=(MainActivity.LoginAttempt)attemptField.get(a);
                    attempt.begin("admin","secret",true);
                } catch(Exception e){throw new AssertionError(e);}
            });
            activity.recreate();
            activity.onActivity(a->{
                try {
                    Method account=MainActivity.class.getDeclaredMethod("accountName",String.class);account.setAccessible(true);
                    Method pending=MainActivity.class.getDeclaredMethod("pendingGoogleSlot");pending.setAccessible(true);
                    assertEquals("admin.storage@example.test",account.invoke(a,"primary"));
                    assertEquals("primary",pending.invoke(a));
                    Field attemptField=MainActivity.class.getDeclaredField("loginAttempt");attemptField.setAccessible(true);
                    MainActivity.LoginAttempt attempt=(MainActivity.LoginAttempt)attemptField.get(a);
                    assertTrue(attempt.pending);assertEquals("admin",attempt.username);assertEquals("secret",attempt.password);assertTrue(attempt.adminMode);
                } catch(Exception e){throw new AssertionError(e);}
            });
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
