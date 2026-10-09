package vn.soxe.organization;

import android.accounts.Account;
import android.app.AlertDialog;
import android.app.DatePickerDialog;
import android.app.TimePickerDialog;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.provider.OpenableColumns;
import android.text.Editable;
import android.text.InputType;
import android.text.TextWatcher;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import android.widget.*;
import androidx.fragment.app.FragmentActivity;
import androidx.core.content.FileProvider;
import com.google.android.gms.auth.api.identity.AuthorizationRequest;
import com.google.android.gms.auth.api.identity.AuthorizationResult;
import com.google.android.gms.auth.api.identity.Identity;
import com.google.android.gms.common.AccountPicker;
import com.google.android.gms.common.api.Scope;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.text.NumberFormat;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.concurrent.Executors;
import java.util.concurrent.ExecutorService;
import java.util.function.Consumer;

/** Native Views; the local JS runtime supplies only the shared ledger core. */
public class MainActivity extends FragmentActivity {
    private static final int PICK_ACCOUNT=101, AUTHORIZE=102, PICK_FILE=103, SAVE_FILE=104;
    private static final int INK=Color.rgb(24,42,62), BLUE=Color.rgb(20,95,153);
    private final Handler handler=new Handler(Looper.getMainLooper());
    private final ExecutorService io=Executors.newSingleThreadExecutor();
    private SharedPreferences prefs;
    private LedgerEngine engine;
    private BiometricVault vault;
    private LinearLayout root,body;
    private TextView status;
    private JSONObject state,presentation;
    private boolean ready,busy,stopped,adminMode,homeScreen;
    private final Map<String,Long> tokenExpiry=new HashMap<>();
    private String page="Tổng quan",primaryToken="",secondaryToken="",loginName="",loginPassword="";
    private String selecting="",filterCar="",filterCategory="",filterFrom="",filterTo="";
    private Account pendingAccount;
    private Runnable authorized;
    private Consumer<JSONObject> attachmentPicked;
    private Consumer<String> backupPicked;
    private byte[] exportBytes;
    private final Runnable automaticSync=new Runnable(){
        @Override public void run(){
            if(!stopped&&state!=null&&!busy) operation("read",obj(),r->{if(homeScreen)render();},false);
            handler.postDelayed(this,60000);
        }
    };
    @Override public void onCreate(Bundle saved){
        super.onCreate(saved);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_SECURE);
        prefs=getSharedPreferences("google-storage",MODE_PRIVATE);
        adminMode=prefs.getBoolean("adminMode",false);
        vault=new BiometricVault(this);
        engine=new LedgerEngine(this,()->{ready=true;if(status!=null)status.setText("Sẵn sàng");});
        login();handler.postDelayed(automaticSync,60000);
    }
    @Override protected void onStart(){super.onStart();stopped=false;}
    @Override protected void onStop(){super.onStop();stopped=true;}
    @Override protected void onDestroy(){handler.removeCallbacksAndMessages(null);io.shutdownNow();engine.destroy();super.onDestroy();}
    private static JSONObject obj(Object...values){
        JSONObject o=new JSONObject();
        try{for(int i=0;i<values.length;i+=2)o.put((String)values[i],values[i+1]);}catch(Exception e){throw new IllegalArgumentException(e);}
        return o;
    }
    private static void put(JSONObject o,String k,Object v){try{o.put(k,v);}catch(Exception e){throw new IllegalArgumentException(e);}}
    private int dp(int n){return Math.round(n*getResources().getDisplayMetrics().density);}
    private TextView text(LinearLayout parent,String value,int size,boolean bold){
        TextView t=new TextView(this);t.setText(value);t.setTextSize(size);t.setTextColor(INK);
        if(bold)t.setTypeface(null,Typeface.BOLD);
        t.setPadding(dp(4),dp(7),dp(4),dp(7));parent.addView(t);return t;
    }
    private LinearLayout column(LinearLayout parent){LinearLayout l=new LinearLayout(this);l.setOrientation(LinearLayout.VERTICAL);parent.addView(l);return l;}
    private Button button(LinearLayout parent,String label,Runnable action){
        Button b=new Button(this);b.setText(label);b.setAllCaps(false);b.setTextSize(15);b.setMinHeight(dp(48));
        b.setOnClickListener(v->{if(!busy)action.run();});parent.addView(b);return b;
    }
    private void shell(String title){
        homeScreen=false;
        root=new LinearLayout(this);root.setOrientation(LinearLayout.VERTICAL);root.setBackgroundColor(Color.rgb(244,247,251));
        root.setPadding(dp(12),0,dp(12),0);root.setFitsSystemWindows(true);setContentView(root);
        text(root,title,23,true);status=text(root,busy?"Đang xử lý…":ready?"Sẵn sàng":"Đang khởi động…",12,false);
        ScrollView scroll=new ScrollView(this);scroll.setFillViewport(true);root.addView(scroll,new LinearLayout.LayoutParams(-1,0,1));
        body=new LinearLayout(this);body.setOrientation(LinearLayout.VERTICAL);body.setPadding(0,0,0,dp(20));scroll.addView(body);
    }
    private LinearLayout card(String heading,String detail,Runnable action){
        LinearLayout l=column(body);l.setPadding(dp(12),dp(8),dp(12),dp(8));
        GradientDrawable bg=new GradientDrawable();bg.setColor(Color.WHITE);bg.setCornerRadius(dp(12));bg.setStroke(dp(1),Color.rgb(220,229,238));l.setBackground(bg);
        LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(-1,-2);p.setMargins(0,dp(5),0,dp(5));l.setLayoutParams(p);
        text(l,heading,17,true);text(l,detail,14,false);
        if(action!=null){l.setOnClickListener(v->{if(!busy)action.run();});l.setFocusable(true);l.setContentDescription(heading+". "+detail+". Nhấn để xem.");}
        return l;
    }
    private void message(String value){if(!isFinishing())new AlertDialog.Builder(this).setTitle("Sổ Xe Tổ Chức").setMessage(value).setPositiveButton("Đóng",null).show();}
    private void progress(boolean value){busy=value;if(status!=null)status.setText(value?"Đang đồng bộ Drive…":"Sẵn sàng");}
    private String accountName(String slot){return prefs.getString(slot,"");}
    private void login(){
        state=null;presentation=null;
        if(!prefs.contains("adminMode")){chooseRole();return;}
        shell(adminMode?"Đăng nhập ADMIN":"Đăng nhập NSD");
        Form f=new Form();f.input("username","Tên đăng nhập",adminMode?"admin":"",false);f.password("password","Mật khẩu","");
        button(body,"Đăng nhập",()->doLogin(f.string("username"),f.string("password")));
        if(vault.exists()&&vault.available())button(body,"Đăng nhập bằng vân tay",()->vault.authenticate(null,(credentials,error)->{
            if(error!=null){message(error);return;}
            if(!credentials.optString("primaryEmail").equals(accountName("primary"))||!credentials.optString("secondaryEmail").equals(accountName("secondary"))){message("Tài khoản Google đã thay đổi. Đăng nhập bằng mật khẩu rồi bật lại vân tay.");return;}
            adminMode=credentials.optBoolean("adminMode");doLogin(credentials.optString("username"),credentials.optString("password"));
        }));
        if(accountName("secondary").isEmpty()||adminMode&&accountName("primary").isEmpty())text(body,"Lần đầu, Android sẽ yêu cầu kết nối tài khoản Google lưu dữ liệu.",14,false);
        button(body,"Đổi loại đăng nhập",this::chooseRole);
        if(adminMode&&accountName("primary").isEmpty())button(body,"Khởi tạo tổ chức mới",this::createOrganization);
        button(body,"Tài khoản Google đã kết nối",this::connections);
    }
    private void chooseRole(){
        shell("Sổ Xe Tổ Chức");text(body,"Chọn loại đăng nhập",18,true);
        button(body,"ADMIN / Admin bổ sung",()->{adminMode=true;prefs.edit().putBoolean("adminMode",true).apply();login();});
        button(body,"NSD / Admin chỉ xem",()->{adminMode=false;prefs.edit().putBoolean("adminMode",false).apply();login();});
    }
    private void doLogin(String username,String password){
        if(username.trim().isEmpty()||password.isEmpty()){message("Nhập tên đăng nhập và mật khẩu.");return;}
        loginName=username.trim();loginPassword=password;
        if(loginName.equalsIgnoreCase("admin")&&!adminMode){adminMode=true;prefs.edit().putBoolean("adminMode",true).apply();}
        withGoogle(()->engine.call("login",obj("username",loginName,"password",loginPassword),(result,error)->{
            progress(false);
            if(error!=null){loginPassword="";message(error);return;}
            if(result.optBoolean("needsPrimary")){adminMode=true;prefs.edit().putBoolean("adminMode",true).apply();doLogin(loginName,loginPassword);return;}
            if(result.optBoolean("mustChange")){changePassword(true);return;}
            if(result.optBoolean("deletionPending")){message("Tổ chức đang chờ xóa. Hoàn tất thao tác trên bản Web bằng Admin sở hữu.");return;}
            accept(result);render();
        }));
    }
    private void connections(){
        shell("Kết nối Google");text(body,"Google lưu dữ liệu Admin: "+accountName("primary")+"\nTK Google lưu dữ liệu NSD: "+accountName("secondary"),15,false);
        if(adminMode)button(body,"Kết nối Google lưu dữ liệu Admin",()->chooseGoogle("primary",this::connections));
        button(body,"Kết nối TK Google lưu dữ liệu NSD",()->chooseGoogle("secondary",this::connections));
        button(body,"Ngắt kết nối trên thiết bị",()->new AlertDialog.Builder(this).setMessage("Xóa kết nối và đăng nhập vân tay trên thiết bị này? Dữ liệu Drive được giữ nguyên.")
            .setNegativeButton("Hủy",null).setPositiveButton("Ngắt kết nối",(d,w)->{prefs.edit().clear().apply();primaryToken=secondaryToken=loginPassword="";tokenExpiry.clear();vault.clear();engine.call("logout",obj(),(r,e)->{state=null;chooseRole();});}).show());
        button(body,"Quay lại",()->{if(state==null)login();else render();});
    }
    private void chooseGoogle(String slot,Runnable next){
        if(state!=null){message("Đăng xuất trước khi đổi tài khoản lưu dữ liệu.");return;}
        selecting=slot;authorized=next;
        try{startActivityForResult(AccountPicker.newChooseAccountIntent(new AccountPicker.AccountChooserOptions.Builder().setAllowableAccountsTypes(Collections.singletonList("com.google")).build()),PICK_ACCOUNT);}
        catch(Exception e){progress(false);message("Thiết bị cần Google Play services để kết nối Drive.");}
    }
    private void authorize(String slot,Runnable next){
        selecting=slot;authorized=next;String name=accountName(slot);
        if(tokenExpiry.getOrDefault(slot,0L)>System.currentTimeMillis()&&!(slot.equals("primary")?primaryToken:secondaryToken).isEmpty()){authorized=null;next.run();return;}
        if(name.isEmpty()){progress(false);chooseGoogle(slot,next);return;}
        pendingAccount=new Account(name,"com.google");requestAuthorization();
    }
    private void requestAuthorization(){
        progress(true);
        AuthorizationRequest request=AuthorizationRequest.builder().setAccount(pendingAccount).setRequestedScopes(Collections.singletonList(new Scope("https://www.googleapis.com/auth/drive.file"))).build();
        Identity.getAuthorizationClient(this).authorize(request).addOnSuccessListener(result->{
            if(result.hasResolution()){try{startIntentSenderForResult(result.getPendingIntent().getIntentSender(),AUTHORIZE,null,0,0,0);}catch(Exception e){googleError(e);}}
            else finishAuthorization(result);
        }).addOnFailureListener(this::googleError);
    }
    private void googleError(Exception e){progress(false);message("Không kết nối được Google: "+e.getMessage()+"\n\nKiểm tra OAuth Client loại Android, tên gói vn.soxe.organization và SHA-1 trong hướng dẫn bản native.");}
    private void finishAuthorization(AuthorizationResult result){
        String token=result.getAccessToken(),slot=selecting;
        if(token==null||token.isEmpty()){progress(false);message("Google chưa cấp quyền Drive.");return;}
        io.execute(()->{try{
            HttpURLConnection c=(HttpURLConnection)new URL("https://www.googleapis.com/drive/v3/about?fields=user(emailAddress)").openConnection();
            c.setRequestProperty("Authorization","Bearer "+token);c.setConnectTimeout(20000);c.setReadTimeout(20000);String email;
            try(InputStream stream=c.getInputStream()){email=new JSONObject(new String(read(stream,65536),java.nio.charset.StandardCharsets.UTF_8)).getJSONObject("user").getString("emailAddress").toLowerCase(Locale.ROOT);}
            finally{c.disconnect();}
            handler.post(()->{
                if(email.equals(accountName(slot.equals("primary")?"secondary":"primary"))){progress(false);message("Hai tài khoản lưu dữ liệu Admin và NSD phải khác nhau.");return;}
                prefs.edit().putString(slot,email).apply();tokenExpiry.put(slot,System.currentTimeMillis()+45*60000);if(slot.equals("primary"))primaryToken=token;else secondaryToken=token;
                Runnable next=authorized;authorized=null;progress(false);if(next!=null)next.run();
            });
        }catch(Exception e){handler.post(()->googleError(e));}});
    }
    private void withGoogle(Runnable action){
        if(!ready){message("Đang khởi động bộ xử lý. Hãy thử lại sau vài giây.");return;}
        Runnable secondary=()->authorize("secondary",()->{
            progress(true);engine.call("configure",obj("primaryToken",adminMode?primaryToken:"","primaryEmail",adminMode?accountName("primary"):"","secondaryToken",secondaryToken,"secondaryEmail",accountName("secondary")),(r,e)->{
                if(e!=null){progress(false);message(e);}else{progress(true);action.run();}
            });
        });
        if(adminMode)authorize("primary",secondary);else secondary.run();
    }
    private void operation(String action,JSONObject args,Consumer<JSONObject> next,boolean interactive){
        if(busy)return;
        withGoogle(()->engine.call(action,args,(result,error)->{
            progress(false);if(error!=null){if(interactive)message(error);else if(status!=null)status.setText("Chưa đồng bộ: "+error);return;}
            accept(result);next.accept(result);
            if(interactive&&result.optJSONArray("warnings")!=null&&result.optJSONArray("warnings").length()>0)message(result.optJSONArray("warnings").toString());
        }));
    }
    private void accept(JSONObject result){if(result!=null&&result.optJSONObject("data")!=null){state=result.optJSONObject("data");presentation=result;}}
    private boolean admin(){return state!=null&&"admin".equals(me("role"));}
    private boolean editable(JSONObject record){return admin()||!"viewer".equals(me("role"))&&me("id").equals(record.optString("enteredBy"));}
    private String me(String field){return state.optJSONObject("me").optString(field);}
    private JSONArray list(String key){return state.optJSONArray(key)==null?new JSONArray():state.optJSONArray(key);}
    private JSONArray drivers(){JSONArray a=new JSONArray();for(int i=0;i<list("users").length();i++){JSONObject u=list("users").optJSONObject(i);if("driver".equals(u.optString("role")))a.put(u);}return a;}
    private JSONObject find(String key,String id){JSONArray a=list(key);for(int i=0;i<a.length();i++)if(id.equals(a.optJSONObject(i).optString("id")))return a.optJSONObject(i);return obj();}
    private String person(String id){return find("users",id).optString("name","—");}
    private String car(String id){return find("carChoices",id).optString("plate","—");}
    private static String money(double value){return NumberFormat.getNumberInstance(new Locale("vi","VN")).format(value);}
    private static String date(String v){return v.length()>=10?v.substring(8,10)+"/"+v.substring(5,7)+"/"+v.substring(0,4):v;}
    private static final String[] CATEGORY_KEYS={"fuel","charge","battery_rental","maintenance","parts","insurance","inspection","road_fee","other"};
    private static final String[] CATEGORY_NAMES={"Tiền xăng","Sạc xe","Thuê pin","Bảo dưỡng","Phụ tùng","Bảo hiểm TNDS","Đăng kiểm","Phí đường bộ","Khác"};
    private static String category(String key){for(int i=0;i<CATEGORY_KEYS.length;i++)if(CATEGORY_KEYS[i].equals(key))return CATEGORY_NAMES[i];return key;}
    private void render(){
        if(state==null){login();return;}
        shell(state.optJSONObject("organization").optString("name"));
        LinearLayout top=new LinearLayout(this);body.addView(top);button(top,"Đồng bộ",()->operation("read",obj(),r->render(),true));button(top,"Tài khoản",this::account);
        text(body,page+" · "+me("name"),19,true);
        switch(page){case "Xe":cars();break;case "Chi phí":transactions();break;case "Báo cáo":reports();break;default:overview();}
        LinearLayout nav=new LinearLayout(this);nav.setGravity(Gravity.CENTER);root.addView(nav);
        for(String name:new String[]{"Tổng quan","Xe","Chi phí","Báo cáo"}){Button b=button(nav,name,()->{page=name;render();});b.setTextSize(12);b.setTextColor(page.equals(name)?BLUE:INK);b.setLayoutParams(new LinearLayout.LayoutParams(0,dp(58),1));}
        homeScreen=true;
        if(state.optInt("pending")>0)status.setText(state.optInt("pending")+" giao dịch đang chờ Admin đồng bộ");
    }
    private void overview(){
        double total=0;for(int i=0;i<list("transactions").length();i++)total+=list("transactions").optJSONObject(i).optDouble("amount");
        card(list("cars").length()+" xe · "+list("transactions").length()+" giao dịch","Tổng chi phí: "+money(total)+" ₫",null);
        text(body,"Cảnh báo đến hạn",18,true);JSONArray reminders=presentation.optJSONArray("reminders");int count=0;
        if(reminders!=null)for(int i=0;i<reminders.length();i++){
            JSONObject r=reminders.optJSONObject(i);if("valid".equals(r.optString("level")))continue;
            JSONObject t=r.optJSONObject("transaction"),c=r.optJSONObject("car");count++;
            card(c.optString("plate")+" · "+category(t.optString("category")),"Quản lý/Lái xe: "+person(find("carChoices",c.optString("id")).optString("assignedUserId"))+"\nĐến hạn: "+date(r.optString("dueDate"))+(r.isNull("leftKm")?"":" · Còn "+money(r.optDouble("leftKm"))+" km"),()->viewTransaction(t));
        }
        if(count==0)text(body,"Chưa có mục sắp đến hạn.",14,false);
        text(body,"Giao dịch gần đây",18,true);List<JSONObject> recent=sortedTransactions();for(int i=0;i<Math.min(8,recent.size());i++)transactionCard(recent.get(i));
    }
    private List<JSONObject> sortedTransactions(){
        List<JSONObject> rows=new ArrayList<>();
        for(int i=0;i<list("transactions").length();i++){
            JSONObject t=list("transactions").optJSONObject(i);String d=t.optString("date");
            if(!filterCar.isEmpty()&&!filterCar.equals(t.optString("carId"))||!filterCategory.isEmpty()&&!filterCategory.equals(t.optString("category"))||!filterFrom.isEmpty()&&d.compareTo(filterFrom)<0||!filterTo.isEmpty()&&d.compareTo(filterTo)>0)continue;
            rows.add(t);
        }
        rows.sort((a,b)->b.optString("date").compareTo(a.optString("date")));return rows;
    }
    private void transactionCard(JSONObject t){
        card(car(t.optString("carId"))+" · "+category(t.optString("category"))+" · "+money(t.optDouble("amount"))+" ₫",
            date(t.optString("date"))+" · "+person(t.optString("enteredBy"))+(t.optBoolean("onBehalf")?" · Nhập hộ "+person(t.optString("enteredFor")):"")+"\n"+t.optString("description")+" · ODO "+money(t.optDouble("odo")),()->viewTransaction(t));
    }
    private void cars(){
        if(admin()){button(body,"+ Thêm xe",()->editCar(obj()));button(body,"Người sử dụng",this::users);}
        button(body,"Bàn giao xe",this::handovers);
        if(list("cars").length()==0)text(body,"Chưa có xe trong phạm vi được xem.",15,false);
        for(int i=0;i<list("cars").length();i++){JSONObject c=list("cars").optJSONObject(i);
            card(c.optString("plate")+" · "+c.optString("name"),"Quản lý/Lái xe: "+person(find("carChoices",c.optString("id")).optString("assignedUserId"))+"\nODO "+money(c.optDouble("odo"))+" km",()->viewCar(c));
        }
    }
    private void viewCar(JSONObject c){
        shell(c.optString("plate"));text(body,c.optString("name")+"\nNăm: "+c.optString("year")+"\nODO: "+money(c.optDouble("odo")),17,false);
        if(admin()){
            button(body,"Sửa xe",()->editCar(c));button(body,"Phân công xe",()->assign(c));
            button(body,"Xóa xe",()->{
                shell("Xác nhận xóa xe");Form f=new Form();text(body,"Xóa xe và giao dịch liên quan. Nhập biển số "+c.optString("plate")+" để xác nhận.",15,false);
                f.input("confirmation","Biển số xác nhận","",false);button(body,"Xóa",()->operation("deleteCar",obj("id",c.optString("id"),"version",c.optInt("version"),"confirmation",f.string("confirmation"),"operationId",f.operationId),r->render(),true));button(body,"Hủy",this::render);
            });
        }
        JSONArray reminders=presentation.optJSONArray("reminders");
        if(reminders!=null)for(int i=0;i<reminders.length();i++){JSONObject r=reminders.optJSONObject(i);if(r.optJSONObject("car").optString("id").equals(c.optString("id")))text(body,category(r.optJSONObject("transaction").optString("category"))+" · "+date(r.optString("dueDate"))+"\nQuản lý/Lái xe: "+person(find("carChoices",c.optString("id")).optString("assignedUserId")),15,false);}
        attachments(c,"carId");button(body,"Quay lại",this::render);
    }
    private void editCar(JSONObject old){
        shell(old.has("id")?"Sửa xe":"Thêm xe");Form f=new Form();
        f.input("plate","Biển số",old.optString("plate"),false);f.input("name","Tên xe",old.optString("name"),false);
        f.input("year","Năm sản xuất",old.optString("year"),true);f.number("odo","ODO (km)",old.optDouble("odo"));
        f.options("powerType","Loại xe",new String[]{"fuel","electric","hybrid"},new String[]{"Xăng/dầu","Điện","Điện–xăng"},old.optString("powerType","fuel"));
        f.attachments(old);button(body,"Lưu xe",()->operation("saveCar",f.values(old,"odo"),r->render(),true));button(body,"Hủy",this::render);
    }
    private void assign(JSONObject c){
        shell("Phân công "+c.optString("plate"));Form f=new Form();f.select("userId","Người quản lý/lái xe",drivers(),"name",find("carChoices",c.optString("id")).optString("assignedUserId"),true);
        button(body,"Lưu phân công",()->operation("assign",obj("carId",c.optString("id"),"userId",f.string("userId"),"operationId",f.operationId),r->render(),true));button(body,"Hủy",this::render);
    }
    private void transactions(){
        if(!"viewer".equals(me("role")))button(body,"+ Nhập chi phí",()->editTransaction(obj()));
        button(body,"Lọc giao dịch",this::filters);
        List<JSONObject> rows=sortedTransactions();text(body,rows.size()+" giao dịch",14,false);for(JSONObject t:rows)transactionCard(t);
    }
    private void filters(){
        shell("Lọc chi phí");Form f=new Form();f.select("carId","Xe",list("cars"),"plate",filterCar,true);
        String[] keys=new String[CATEGORY_KEYS.length+1],labels=new String[keys.length];keys[0]="";labels[0]="Tất cả";System.arraycopy(CATEGORY_KEYS,0,keys,1,CATEGORY_KEYS.length);System.arraycopy(CATEGORY_NAMES,0,labels,1,CATEGORY_NAMES.length);
        f.options("category","Loại chi phí",keys,labels,filterCategory);f.date("from","Từ ngày",filterFrom,true);f.date("to","Đến ngày",filterTo,true);
        button(body,"Áp dụng",()->{filterCar=f.string("carId");filterCategory=f.string("category");filterFrom=f.string("from");filterTo=f.string("to");render();});
        button(body,"Bỏ lọc",()->{filterCar=filterCategory=filterFrom=filterTo="";render();});button(body,"Hủy",this::render);
    }
    private void viewTransaction(JSONObject t){
        shell(category(t.optString("category"))+" · "+car(t.optString("carId")));text(body,money(t.optDouble("amount"))+" ₫",29,true);
        text(body,date(t.optString("date"))+" · ODO "+money(t.optDouble("odo"))+" km\n"+t.optString("description")+"\nNgười nhập: "+person(t.optString("enteredBy"))+(t.optBoolean("onBehalf")?"\nNhập hộ: "+person(t.optString("enteredFor")):""),17,false);
        for(String k:new String[]{"liters","fuelPrice","batteryFrom","batteryTo","repeatKm","repeatMonths"})if(t.optDouble(k)>0)text(body,fieldLabel(k)+": "+money(t.optDouble(k)),15,false);
        for(String k:new String[]{"insuranceProvider","insurancePolicy","insuranceStart","insuranceExpiry","note"})if(!t.optString(k).isEmpty())text(body,fieldLabel(k)+": "+(k.equals("insuranceStart")||k.equals("insuranceExpiry")?date(t.optString(k)):t.optString(k)),15,false);
        attachments(t,"transactionId");if(editable(t)){button(body,"Sửa giao dịch",()->editTransaction(t));button(body,"Xóa giao dịch",()->confirmDelete("deleteTransaction",t));}button(body,"Quay lại",this::render);
    }
    private static String fieldLabel(String k){
        switch(k){
            case "liters":return "Số lít";case "fuelPrice":return "Đơn giá xăng";case "batteryFrom":return "Pin trước sạc (%)";case "batteryTo":return "Pin sau sạc (%)";
            case "repeatKm":return "Chu kỳ (km)";case "repeatMonths":return "Chu kỳ (tháng)";case "insuranceProvider":return "Đơn vị";case "insurancePolicy":return "Số hợp đồng";
            case "insuranceStart":return "Ngày hiệu lực";case "insuranceExpiry":return "Ngày hết hạn";default:return "Ghi chú";
        }
    }
    private void editTransaction(JSONObject old){
        shell(old.has("id")?"Sửa giao dịch":"Nhập chi phí");Form f=new Form();JSONArray choices=list("carChoices");String selected=old.optString("carId");
        if(selected.isEmpty())for(int i=0;i<choices.length();i++)if(me("id").equals(choices.optJSONObject(i).optString("assignedUserId"))){selected=choices.optJSONObject(i).optString("id");break;}
        f.select("carId","Xe",choices,"plate",selected,false);
        CheckBox behalf=new CheckBox(this);behalf.setText("Nhập hộ");behalf.setChecked(old.optBoolean("onBehalf"));body.addView(behalf);f.checks.put("onBehalf",behalf);
        if("driver".equals(me("role"))&&!old.has("id"))f.views.get("carId").setEnabled(behalf.isChecked());
        f.select("enteredFor","Người được ghi nhận",list("users"),"name",old.optString("enteredFor",me("id")),false);f.views.get("enteredFor").setEnabled(behalf.isChecked()||admin());
        behalf.setOnCheckedChangeListener((v,checked)->{
            f.views.get("enteredFor").setEnabled(checked||admin());if("driver".equals(me("role"))&&!old.has("id"))f.views.get("carId").setEnabled(checked);
            if(!checked){f.setChoice("enteredFor",me("id"));if(!old.has("id"))for(int i=0;i<choices.length();i++){JSONObject c=choices.optJSONObject(i);if(me("id").equals(c.optString("assignedUserId"))){f.setChoice("carId",c.optString("id"));break;}}}
        });
        f.options("category","Loại chi phí",CATEGORY_KEYS,CATEGORY_NAMES,old.optString("category","fuel"));f.date("date","Ngày giao dịch",old.optString("date",today()),false);
        f.number("amount","Tổng số tiền (₫)",old.optDouble("amount"));f.moneyFormatting("amount");f.number("odo","ODO (km)",old.optDouble("odo"));f.input("description","Nội dung",old.optString("description"),false);
        for(String k:new String[]{"fuelPrice","liters","batteryFrom","batteryTo","repeatKm","repeatMonths"})f.number(k,fieldLabel(k),old.optDouble(k));f.fuelCalculation();
        f.input("insuranceProvider","Đơn vị",old.optString("insuranceProvider"),false);f.input("insurancePolicy","Số hợp đồng",old.optString("insurancePolicy"),false);
        f.date("insuranceStart","Ngày hiệu lực",old.optString("insuranceStart"),true);f.date("insuranceExpiry","Ngày hết hạn",old.optString("insuranceExpiry"),true);f.input("note","Ghi chú",old.optString("note"),false);f.categoryVisibility();f.attachments(old);
        button(body,"Lưu giao dịch",()->operation("saveTransaction",f.values(old,"amount","odo","fuelPrice","liters","batteryFrom","batteryTo","repeatKm","repeatMonths"),r->render(),true));button(body,"Hủy",this::render);
    }
    private void confirmDelete(String action,JSONObject record){
        new AlertDialog.Builder(this).setTitle("Xác nhận xóa").setMessage("Xóa bản ghi này khỏi dữ liệu tổ chức?").setNegativeButton("Hủy",null)
            .setPositiveButton("Xóa",(d,w)->operation(action,obj("id",record.optString("id"),"version",record.optInt("version"),"operationId",UUID.randomUUID().toString()),r->render(),true)).show();
    }
    private void reports(){
        double total=0;for(JSONObject t:sortedTransactions())total+=t.optDouble("amount");text(body,"Chi phí trong phạm vi được xem: "+money(total)+" ₫",19,true);
        JSONArray months=presentation.optJSONArray("monthly");if(months!=null)for(int i=0;i<months.length();i++){JSONObject m=months.optJSONObject(i);card(m.optString("plate")+" · "+month(m.optString("month")),"Tổng: "+money(m.optDouble("total"))+" ₫\nSố lít: "+money(m.optDouble("liters"))+(m.isNull("rate")?"":" · "+money(m.optDouble("rate"))+" L/100km"),null);}
        text(body,"Thời gian quản lý xe",18,true);JSONArray periods=presentation.optJSONArray("periods");
        if(periods!=null)for(int i=0;i<periods.length();i++){JSONObject p=periods.optJSONObject(i);card(person(p.optString("userId"))+" · "+car(p.optString("carId")),localTime(p.optString("from"))+" → "+(p.optBoolean("ongoing")?"Đang quản lý":localTime(p.optString("to")))+"\n"+p.optString("duration"),null);}
        button(body,"Xuất giao dịch CSV",this::exportCsv);
    }
    private void users(){
        if(!admin())return;shell("Người sử dụng");button(body,"+ Tạo NSD",()->editUser(obj()));
        for(int i=0;i<list("users").length();i++){JSONObject u=list("users").optJSONObject(i);card(u.optString("name")+" · "+u.optString("username"),u.optString("role")+" · "+(u.optBoolean("active")?"Đã khởi tạo":"Chưa khởi tạo"),()->editUser(u));}
        button(body,"Quay lại",this::render);
    }
    private void editUser(JSONObject old){
        shell(old.has("id")?"Sửa NSD":"Tạo NSD");Form f=new Form();f.input("username","Tên đăng nhập",old.optString("username"),false);f.input("name","Họ tên",old.optString("name"),false);
        if(!old.has("id")){f.options("role","Vai trò",new String[]{"driver","viewer","admin"},new String[]{"Người quản lý/lái xe","Admin chỉ xem","Admin bổ sung"},"driver");text(body,"Mật khẩu ban đầu: 000000. NSD phải đổi ở lần đăng nhập đầu.",15,false);}
        else f.password("newPassword","Mật khẩu mới (để trống nếu giữ nguyên)","");
        button(body,"Lưu",()->{JSONObject args=f.values(obj());if(old.has("id")){put(args,"id",old.optString("id"));put(args,"version",old.optInt("editVersion"));}operation(old.has("id")?"editUser":"createUser",args,r->users(),true);});
        if(old.has("id")&&!old.optString("id").equals(me("id")))button(body,"Xóa NSD",()->new AlertDialog.Builder(this).setMessage("Xóa NSD này? Tài khoản có phân công hoặc giao dịch sẽ không thể xóa.").setNegativeButton("Hủy",null).setPositiveButton("Xóa",(d,w)->operation("deleteUser",obj("id",old.optString("id"),"operationId",f.operationId),r->users(),true)).show());
        button(body,"Hủy",this::users);
    }
    private void handovers(){
        shell("Bàn giao xe");if(!"viewer".equals(me("role")))button(body,"+ Nhập bàn giao",()->editHandover(obj()));
        for(int i=0;i<list("handovers").length();i++){JSONObject h=list("handovers").optJSONObject(i);card(car(h.optString("carId"))+" · "+date(h.optString("date")),person(h.optString("fromUserId"))+" → "+person(h.optString("toUserId"))+"\nNgười nhập: "+person(h.optString("enteredBy")),()->{
            shell("Chi tiết bàn giao");text(body,person(h.optString("fromUserId"))+" → "+person(h.optString("toUserId"))+"\n"+localTime(h.optString("at"))+"\nODO "+money(h.optDouble("odo"))+"\n"+h.optString("note"),17,false);
            if(editable(h)){button(body,"Sửa",()->editHandover(h));button(body,"Xóa",()->confirmDelete("deleteHandover",h));}button(body,"Quay lại",this::handovers);
        });}button(body,"Quay lại",this::render);
    }
    private void editHandover(JSONObject old){
        shell(old.has("id")?"Sửa bàn giao":"Nhập bàn giao");Form f=new Form();f.select("carId","Xe",list("carChoices"),"plate",old.optString("carId"),false);
        f.select("fromUserId","Người giao",drivers(),"name",old.optString("fromUserId",me("id")),false);f.select("toUserId","Người nhận",drivers(),"name",old.optString("toUserId"),false);
        Calendar initial=Calendar.getInstance();try{if(old.has("at"))initial.setTime(isoFormat().parse(old.optString("at")));}catch(Exception ignored){}
        f.date("date","Ngày bàn giao",new SimpleDateFormat("yyyy-MM-dd",Locale.ROOT).format(initial.getTime()),false);f.time("time","Giờ bàn giao",initial.get(Calendar.HOUR_OF_DAY),initial.get(Calendar.MINUTE));
        f.number("odo","ODO (km)",old.optDouble("odo"));f.input("note","Ghi chú",old.optString("note"),false);
        button(body,"Lưu bàn giao",()->{try{
            Calendar at=Calendar.getInstance();String[] d=f.string("date").split("-"),t=f.string("time").split(":");at.set(Integer.parseInt(d[0]),Integer.parseInt(d[1])-1,Integer.parseInt(d[2]),Integer.parseInt(t[0]),Integer.parseInt(t[1]),0);at.set(Calendar.MILLISECOND,0);
            JSONObject args=f.values(old,"odo");put(args,"at",isoFormat().format(at.getTime()));operation("saveHandover",args,r->handovers(),true);
        }catch(Exception e){message("Ngày giờ không hợp lệ.");}});button(body,"Hủy",this::handovers);
    }
    private static SimpleDateFormat isoFormat(){SimpleDateFormat f=new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",Locale.ROOT);f.setTimeZone(TimeZone.getTimeZone("UTC"));return f;}
    private static String month(String value){return value.length()==7?value.substring(5,7)+"/"+value.substring(0,4):value;}
    private static String localTime(String iso){try{return new SimpleDateFormat("dd/MM/yyyy HH:mm",Locale.ROOT).format(isoFormat().parse(iso));}catch(Exception e){return "";}}
    private static String today(){return new SimpleDateFormat("yyyy-MM-dd",Locale.ROOT).format(new Date());}
    @Override public void onBackPressed(){
        if(busy)return;
        if(state!=null&&!homeScreen){render();return;}
        if(state!=null&&!page.equals("Tổng quan")){page="Tổng quan";render();return;}
        super.onBackPressed();
    }
    private void createOrganization(){
        shell("Tạo tổ chức mới");Form f=new Form();f.input("organizationName","Tên tổ chức","",false);f.input("adminName","Tên Admin","Admin",false);f.password("password","Mật khẩu Admin (từ 6 ký tự)","");
        button(body,"Kết nối Google và tạo tổ chức",()->{loginName="admin";loginPassword=f.string("password");operation("createOrganization",f.values(obj()),r->render(),true);});button(body,"Hủy",this::login);
    }
    private void changePassword(boolean first){
        shell(first?"Đặt mật khẩu mới":"Đổi mật khẩu");Form f=new Form();f.password("currentPassword","Mật khẩu hiện tại",first?loginPassword:"");f.password("password","Mật khẩu mới (từ 6 ký tự)","");f.password("repeat","Nhập lại mật khẩu mới","");
        button(body,"Lưu mật khẩu",()->{if(!f.string("password").equals(f.string("repeat"))){message("Hai mật khẩu mới không trùng nhau.");return;}
            operation("changePassword",obj("currentPassword",f.string("currentPassword"),"password",f.string("password")),r->{loginPassword=f.string("password");vault.clear();render();},true);
        });if(!first)button(body,"Hủy",this::account);
    }
    private void account(){
        shell("Tài khoản");text(body,me("name")+" · "+me("username")+"\nVai trò: "+me("role"),17,true);button(body,"Đổi mật khẩu",()->changePassword(false));
        if(vault.available()&&!loginPassword.isEmpty())button(body,"Bật đăng nhập bằng vân tay",()->vault.authenticate(obj("username",loginName,"password",loginPassword,"adminMode",adminMode,"primaryEmail",accountName("primary"),"secondaryEmail",accountName("secondary")),(r,error)->{if(error!=null)message(error);else message("Đã bật đăng nhập vân tay trên thiết bị này.");}));
        if(vault.exists())button(body,"Tắt đăng nhập vân tay",()->{vault.clear();account();});
        if(admin()){button(body,"Người sử dụng",this::users);button(body,"Sao lưu và phục hồi",this::backup);button(body,"Sửa tên tổ chức",this::renameOrganization);button(body,"Xóa tổ chức",this::deleteOrganization);}
        button(body,"Kết nối Google",this::connections);
        button(body,"Đăng xuất",()->{state=presentation=null;loginPassword=loginName="";filterCar=filterCategory=filterFrom=filterTo="";engine.call("logout",obj(),(r,e)->login());});button(body,"Quay lại",this::render);
    }
    private void renameOrganization(){
        shell("Sửa tổ chức");Form f=new Form();f.input("name","Tên tổ chức",state.optJSONObject("organization").optString("name"),false);
        button(body,"Lưu",()->operation("renameOrganization",f.values(obj()),r->render(),true));button(body,"Hủy",this::account);
    }
    private void deleteOrganization(){
        shell("Xóa tổ chức");Form f=new Form();String name=state.optJSONObject("organization").optString("name");
        text(body,"Xóa toàn bộ dữ liệu liên quan. Sao lưu trước khi tiếp tục. Nhập chính xác tên: "+name,17,true);f.input("confirmation","Tên tổ chức xác nhận","",false);f.password("password","Mật khẩu Admin","");
        button(body,"Xóa toàn bộ tổ chức",()->new AlertDialog.Builder(this).setTitle("Xác nhận lần cuối").setMessage("Xóa tất cả dữ liệu tổ chức "+name+"?").setNegativeButton("Hủy",null).setPositiveButton("Xóa",(d,w)->operation("deleteOrganization",f.values(obj()),r->{if(r.optBoolean("deleted")){vault.clear();loginPassword="";state=null;login();}else render();},true)).show());button(body,"Hủy",this::account);
    }
    private void backup(){
        shell("Sao lưu và phục hồi");text(body,"Bản sao lưu gồm dữ liệu, tài khoản NSD và toàn bộ tệp đính kèm. Giữ mật khẩu sao lưu để phục hồi.",15,false);
        Form f=new Form();f.password("password","Mật khẩu sao lưu (từ 6 ký tự)","");
        button(body,"Tạo bản sao lưu",()->operation("export",obj("password",f.string("password")),r->saveDocument("So-Xe-"+today()+".json","application/json",r.optString("backup").getBytes(java.nio.charset.StandardCharsets.UTF_8)),true));
        button(body,"Chọn bản sao lưu để phục hồi",()->{attachmentPicked=null;backupPicked=this::inspectRestore;startActivityForResult(new Intent(Intent.ACTION_OPEN_DOCUMENT).setType("application/json").addCategory(Intent.CATEGORY_OPENABLE),PICK_FILE);});button(body,"Quay lại",this::account);
    }
    private void inspectRestore(String content){
        shell("Kiểm tra bản sao lưu");Form f=new Form();f.password("password","Mật khẩu bản sao lưu","");
        button(body,"Kiểm tra",()->operation("inspectBackup",obj("backup",content,"password",f.string("password")),r->{
            shell("Xác nhận phục hồi");JSONObject s=r.optJSONObject("summary");text(body,s.optString("organizationName")+"\n"+s.optInt("cars")+" xe · "+s.optInt("transactions")+" giao dịch · "+s.optInt("attachments")+" tệp\nPhục hồi sẽ thay dữ liệu hiện tại.",17,true);
            int revision=state.optInt("revision");Form confirmation=new Form();confirmation.input("confirmation","Nhập tên tổ chức hiện tại","",false);confirmation.password("adminPassword","Mật khẩu Admin hiện tại","");
            button(body,"Phục hồi dữ liệu và tệp",()->new AlertDialog.Builder(this).setMessage("Thay thế dữ liệu hiện tại bằng bản sao lưu đã kiểm tra?").setNegativeButton("Hủy",null).setPositiveButton("Phục hồi",(d,w)->operation("restoreBackup",obj("backup",content,"password",f.string("password"),"adminPassword",confirmation.string("adminPassword"),"confirmation",confirmation.string("confirmation"),"expectedRevision",revision),restored->{vault.clear();loginPassword="";render();},true)).show());button(body,"Hủy",this::backup);
        },true));button(body,"Hủy",this::backup);
    }
    private void attachments(JSONObject record,String recordKey){
        JSONArray files=record.optJSONArray("attachments");if(files==null)return;
        for(int i=0;i<files.length();i++){JSONObject file=files.optJSONObject(i);button(body,"Tệp: "+file.optString("name"),()->operation("attachment",obj(recordKey,record.optString("id"),"id",file.optString("id")),r->openAttachment(r.optJSONObject("file")),true));}
    }
    private void openAttachment(JSONObject file){
        io.execute(()->{try{
            File dir=new File(getCacheDir(),"attachments");if(!dir.exists()&&!dir.mkdirs())throw new IOException();
            String safe=file.optString("name","tep").replaceAll("[^\\p{L}\\p{N}._-]","_");if(safe.isEmpty())safe="tep";
            File target=new File(dir,safe);try(FileOutputStream out=new FileOutputStream(target)){out.write(android.util.Base64.decode(file.optString("base64"),android.util.Base64.DEFAULT));}
            Uri uri=FileProvider.getUriForFile(this,getPackageName()+".files",target);
            handler.post(()->{try{startActivity(new Intent(Intent.ACTION_VIEW).setDataAndType(uri,file.optString("type","application/octet-stream")).addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION));}catch(Exception e){message("Thiết bị chưa có ứng dụng mở loại tệp này.");}});
        }catch(Exception e){handler.post(()->message("Không mở được tệp đính kèm."));}});
    }
    private void exportCsv(){
        StringBuilder csv=new StringBuilder("\uFEFFNgày,Biển số,Loại chi phí,Nội dung,Số tiền,ODO,Người nhập,Nhập hộ\r\n");
        for(JSONObject t:sortedTransactions()){
            String[] cols={date(t.optString("date")),car(t.optString("carId")),category(t.optString("category")),t.optString("description"),String.valueOf(t.optDouble("amount")),String.valueOf(t.optDouble("odo")),person(t.optString("enteredBy")),t.optBoolean("onBehalf")?person(t.optString("enteredFor")):""};
            for(int i=0;i<cols.length;i++){if(i>0)csv.append(',');String value=cols[i];if(value.matches("^[=+@-].*"))value="'"+value;csv.append('"').append(value.replace("\"","\"\"")).append('"');}csv.append("\r\n");
        }
        saveDocument("Chi-phi-"+today()+".csv","text/csv",csv.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8));
    }
    private void saveDocument(String name,String type,byte[] bytes){exportBytes=bytes;startActivityForResult(new Intent(Intent.ACTION_CREATE_DOCUMENT).setType(type).addCategory(Intent.CATEGORY_OPENABLE).putExtra(Intent.EXTRA_TITLE,name),SAVE_FILE);}
    private static byte[] read(InputStream stream,int limit)throws IOException{
        ByteArrayOutputStream out=new ByteArrayOutputStream();byte[] block=new byte[8192];int n;
        while((n=stream.read(block))!=-1){if(out.size()+n>limit)throw new IOException("Tệp vượt giới hạn cho phép.");out.write(block,0,n);}return out.toByteArray();
    }
    @Override protected void onActivityResult(int request,int result,Intent data){
        super.onActivityResult(request,result,data);
        if(result!=RESULT_OK||data==null){progress(false);attachmentPicked=null;backupPicked=null;return;}
        if(request==PICK_ACCOUNT){String name=data.getStringExtra("authAccount");if(name==null){message("Chưa chọn tài khoản Google.");return;}pendingAccount=new Account(name,"com.google");requestAuthorization();}
        else if(request==AUTHORIZE){try{finishAuthorization(Identity.getAuthorizationClient(this).getAuthorizationResultFromIntent(data));}catch(Exception e){googleError(e);}}
        else if(request==SAVE_FILE&&data.getData()!=null){
            Uri uri=data.getData();byte[] bytes=exportBytes;exportBytes=null;
            io.execute(()->{try(OutputStream out=getContentResolver().openOutputStream(uri)){if(out==null||bytes==null)throw new IOException();out.write(bytes);handler.post(()->message("Đã lưu tệp."));}catch(Exception e){handler.post(()->message("Không ghi được tệp."));}});
        }else if(request==PICK_FILE&&data.getData()!=null){
            Uri uri=data.getData();Consumer<JSONObject> attach=attachmentPicked;Consumer<String> restore=backupPicked;attachmentPicked=null;backupPicked=null;
            io.execute(()->{try(InputStream in=getContentResolver().openInputStream(uri)){
                if(in==null)throw new IOException();byte[] bytes=read(in,attach==null?200*1024*1024:2*1024*1024);
                if(restore!=null)handler.post(()->restore.accept(new String(bytes,java.nio.charset.StandardCharsets.UTF_8)));
                else if(attach!=null){
                    String name="tep";try(android.database.Cursor cursor=getContentResolver().query(uri,new String[]{OpenableColumns.DISPLAY_NAME},null,null,null)){if(cursor!=null&&cursor.moveToFirst())name=cursor.getString(0);}
                    JSONObject file=obj("name",name,"type",getContentResolver().getType(uri)==null?"application/octet-stream":getContentResolver().getType(uri),"base64",android.util.Base64.encodeToString(bytes,android.util.Base64.NO_WRAP));handler.post(()->attach.accept(file));
                }
            }catch(Exception e){handler.post(()->message("Không đọc được tệp. Tệp đính kèm tối đa 2 MB; bản sao lưu tối đa 200 MB."));}});
        }
    }
    private final class Form{
        final String operationId=UUID.randomUUID().toString();
        final Map<String,View> views=new LinkedHashMap<>();
        final Map<String,String[]> options=new HashMap<>();
        final Map<String,String> dates=new HashMap<>();
        final Map<String,CheckBox> checks=new HashMap<>();
        final Map<String,LinearLayout> groups=new HashMap<>();
        final Set<String> secrets=new HashSet<>();
        JSONArray files;
        boolean calculating;
        EditText input(String key,String label,String initial,boolean numeric){
            LinearLayout group=column(body);groups.put(key,group);text(group,label,14,true);EditText edit=new EditText(MainActivity.this);edit.setTextSize(17);edit.setSingleLine(!key.equals("note")&&!key.equals("description"));
            edit.setInputType(numeric?InputType.TYPE_CLASS_NUMBER|InputType.TYPE_NUMBER_FLAG_DECIMAL:InputType.TYPE_CLASS_TEXT|InputType.TYPE_TEXT_FLAG_CAP_SENTENCES);
            if(key.equals("username"))edit.setInputType(InputType.TYPE_CLASS_TEXT|InputType.TYPE_TEXT_FLAG_NO_SUGGESTIONS);
            edit.setText(initial);edit.setMinHeight(dp(48));group.addView(edit);views.put(key,edit);return edit;
        }
        void number(String key,String label,double value){if(!Double.isFinite(value))value=0;input(key,label,value==0?"":String.valueOf(value).replaceAll("\\.0$",""),true);}
        void password(String key,String label,String initial){
            secrets.add(key);EditText e=input(key,label,initial,false);e.setInputType(InputType.TYPE_CLASS_TEXT|InputType.TYPE_TEXT_VARIATION_PASSWORD);
            CheckBox show=new CheckBox(MainActivity.this);show.setText("Hiện mật khẩu");body.addView(show);
            show.setOnCheckedChangeListener((v,shown)->{int pos=e.getSelectionStart();e.setInputType(InputType.TYPE_CLASS_TEXT|(shown?InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD:InputType.TYPE_TEXT_VARIATION_PASSWORD));e.setSelection(Math.max(0,pos));});
        }
        void options(String key,String label,String[] keys,String[] labels,String initial){
            LinearLayout group=column(body);groups.put(key,group);text(group,label,14,true);Spinner spinner=new Spinner(MainActivity.this);ArrayAdapter<String> adapter=new ArrayAdapter<>(MainActivity.this,android.R.layout.simple_spinner_item,labels);adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
            spinner.setAdapter(adapter);spinner.setMinimumHeight(dp(48));group.addView(spinner);views.put(key,spinner);options.put(key,keys);setChoice(key,initial);
        }
        void setChoice(String key,String value){String[] keys=options.get(key);for(int i=0;i<keys.length;i++)if(keys[i].equals(value)){((Spinner)views.get(key)).setSelection(i);return;}}
        void select(String key,String label,JSONArray rows,String display,String initial,boolean empty){
            int offset=empty?1:0;String[] keys=new String[rows.length()+offset],labels=new String[keys.length];if(empty){keys[0]="";labels[0]="—";}
            for(int i=0;i<rows.length();i++){JSONObject r=rows.optJSONObject(i);keys[i+offset]=r.optString("id");labels[i+offset]=r.optString(display);}options(key,label,keys,labels,initial);
        }
        void date(String key,String label,String initial,boolean optional){
            LinearLayout group=column(body);groups.put(key,group);text(group,label,14,true);dates.put(key,initial);
            Button b=button(group,initial.isEmpty()?"Chọn ngày":MainActivity.date(initial),()->{
                Calendar c=Calendar.getInstance();String prior=dates.get(key);if(!prior.isEmpty()){String[] parts=prior.split("-");c.set(Integer.parseInt(parts[0]),Integer.parseInt(parts[1])-1,Integer.parseInt(parts[2]));}
                new DatePickerDialog(MainActivity.this,(v,y,m,d)->{String value=String.format(Locale.ROOT,"%04d-%02d-%02d",y,m+1,d);dates.put(key,value);((Button)views.get(key)).setText(MainActivity.date(value));},c.get(Calendar.YEAR),c.get(Calendar.MONTH),c.get(Calendar.DAY_OF_MONTH)).show();
            });views.put(key,b);if(optional)button(group,"Xóa ngày "+label.toLowerCase(Locale.ROOT),()->{dates.put(key,"");b.setText("Chọn ngày");});
        }
        void time(String key,String label,int hour,int minute){
            dates.put(key,String.format(Locale.ROOT,"%02d:%02d",hour,minute));text(body,label,14,true);
            Button b=button(body,dates.get(key),()->{String[] t=dates.get(key).split(":");new TimePickerDialog(MainActivity.this,(v,h,m)->{dates.put(key,String.format(Locale.ROOT,"%02d:%02d",h,m));((Button)views.get(key)).setText(dates.get(key));},Integer.parseInt(t[0]),Integer.parseInt(t[1]),true).show();});views.put(key,b);
        }
        String string(String key){
            if(dates.containsKey(key))return dates.get(key);
            if(options.containsKey(key)){int i=((Spinner)views.get(key)).getSelectedItemPosition();return i>=0?options.get(key)[i]:"";}
            View v=views.get(key);if(!(v instanceof EditText))return "";String value=((EditText)v).getText().toString();return secrets.contains(key)?value:value.trim();
        }
        double numeric(String key){
            String s=string(key);if(key.equals("amount"))s=s.replace(".","").replace(",",".");else s=s.replace(",",".");
            try{return s.isEmpty()?0:Double.parseDouble(s);}catch(Exception e){return Double.NaN;}
        }
        JSONObject values(JSONObject old,String...numericKeys){
            JSONObject o=obj("operationId",operationId);Set<String> nums=new HashSet<>(Arrays.asList(numericKeys));
            for(String k:views.keySet()){if(nums.contains(k)){double value=numeric(k);if(!Double.isFinite(value)){message("Giá trị số chưa đúng: "+k);return obj();}put(o,k,value);}else put(o,k,string(k));}
            for(String k:checks.keySet())put(o,k,checks.get(k).isChecked());if(old.has("id")){put(o,"id",old.optString("id"));put(o,"version",old.optInt("version"));}
            if(files!=null)put(o,"attachments",files);return o;
        }
        void moneyFormatting(String key){
            EditText e=(EditText)views.get(key);String original=e.getText().toString();e.setInputType(InputType.TYPE_CLASS_NUMBER);if(!original.isEmpty())e.setText(money(Double.parseDouble(original)));
            e.addTextChangedListener(new TextWatcher(){boolean changing;public void beforeTextChanged(CharSequence s,int st,int count,int after){}public void onTextChanged(CharSequence s,int st,int before,int count){}
                public void afterTextChanged(Editable s){if(changing)return;String digits=s.toString().replaceAll("[^0-9]","");if(digits.length()>13)digits=digits.substring(0,13);changing=true;String formatted=digits.isEmpty()?"":money(Double.parseDouble(digits));if(!s.toString().equals(formatted)){e.setText(formatted);e.setSelection(formatted.length());}changing=false;}
            });
        }
        void categoryVisibility(){
            Runnable update=()->{String c=string("category");for(String k:new String[]{"fuelPrice","liters","batteryFrom","batteryTo","repeatKm","repeatMonths","insuranceProvider","insurancePolicy","insuranceStart","insuranceExpiry"}){
                boolean show=k.equals("fuelPrice")||k.equals("liters")?c.equals("fuel"):k.equals("batteryFrom")||k.equals("batteryTo")?c.equals("charge"):k.startsWith("repeat")?c.equals("maintenance")||c.equals("parts"):k.equals("insuranceProvider")||k.equals("insurancePolicy")?c.equals("insurance"):c.equals("insurance")||c.equals("inspection")||c.equals("road_fee");
                groups.get(k).setVisibility(show?View.VISIBLE:View.GONE);
            }};
            ((Spinner)views.get("category")).setOnItemSelectedListener(new AdapterView.OnItemSelectedListener(){public void onItemSelected(AdapterView<?> p,View v,int pos,long id){update.run();}public void onNothingSelected(AdapterView<?> p){}});update.run();
        }
        void fuelCalculation(){
            for(String key:new String[]{"amount","fuelPrice","liters"})((EditText)views.get(key)).addTextChangedListener(new TextWatcher(){
                public void beforeTextChanged(CharSequence s,int st,int count,int after){}public void onTextChanged(CharSequence s,int st,int before,int count){}
                public void afterTextChanged(Editable s){
                    if(calculating||!"fuel".equals(string("category")))return;double amount=numeric("amount"),price=numeric("fuelPrice"),liters=numeric("liters");calculating=true;
                    if(key.equals("liters")&&liters>0&&amount>0)((EditText)views.get("fuelPrice")).setText(String.format(Locale.ROOT,"%.2f",amount/liters));
                    else if(price>0&&amount>0)((EditText)views.get("liters")).setText(String.format(Locale.ROOT,"%.3f",amount/price));calculating=false;
                }
            });
        }
        void attachments(JSONObject old){
            try{files=old.optJSONArray("attachments")==null?new JSONArray():new JSONArray(old.optJSONArray("attachments").toString());}catch(Exception e){files=new JSONArray();}
            text(body,"Tệp đính kèm (tối đa 5 tệp, 2 MB/tệp)",15,true);LinearLayout container=column(body);renderFiles(container);
            button(body,"Thêm tệp",()->{if(files.length()>=5){message("Tối đa 5 tệp.");return;}attachmentPicked=file->{files.put(file);renderFiles(container);};backupPicked=null;startActivityForResult(new Intent(Intent.ACTION_OPEN_DOCUMENT).setType("*/*").addCategory(Intent.CATEGORY_OPENABLE),PICK_FILE);});
        }
        void renderFiles(LinearLayout container){
            container.removeAllViews();for(int i=0;i<files.length();i++){int index=i;JSONObject f=files.optJSONObject(i);button(container,"Bỏ: "+f.optString("name"),()->{files.remove(index);renderFiles(container);});}
        }
    }
}
