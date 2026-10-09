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
            onView(withText(org.hamcrest.Matchers.containsString("· 123.456.789"))).perform(click());
            onView(withText("Sửa giao dịch")).perform(scrollTo(),click());
            onView(withText("123.456.789")).perform(scrollTo(),replaceText("987654321"),closeSoftKeyboard());
            onView(withText("987.654.321")).check(matches(isDisplayed()));
        }
    }
}
