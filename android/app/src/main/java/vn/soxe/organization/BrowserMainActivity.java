package vn.soxe.organization;

import android.app.Activity;
import android.os.Bundle;
import android.content.Intent;
import android.content.ActivityNotFoundException;
import android.net.Uri;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.view.Gravity;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

/** Stable 4.7 browser sign-in boundary with a small native launch screen. */
public final class BrowserMainActivity extends Activity {
    private static final String APP_URL="https://lehuynhanhtu-prog.github.io/so-xe-to-chuc/";
    private int dp(int value){return Math.round(value*getResources().getDisplayMetrics().density);}
    private TextView text(LinearLayout parent,String value,int size,int color,boolean bold){
        TextView view=new TextView(this);view.setText(value);view.setTextSize(size);view.setTextColor(color);view.setLineSpacing(0,1.12f);
        if(bold)view.setTypeface(null,Typeface.BOLD);parent.addView(view);return view;
    }
    private GradientDrawable background(int color,float radius){GradientDrawable shape=new GradientDrawable();shape.setColor(color);shape.setCornerRadius(dp((int)radius));return shape;}

    @Override public void onCreate(Bundle state){
        super.onCreate(state);
        final int ink=Color.rgb(20,43,67),teal=Color.rgb(23,106,101),muted=Color.rgb(92,113,132);
        LinearLayout page=new LinearLayout(this);page.setOrientation(LinearLayout.VERTICAL);page.setPadding(dp(22),dp(42),dp(22),dp(24));page.setBackgroundColor(Color.rgb(244,247,251));page.setGravity(Gravity.CENTER_HORIZONTAL);setContentView(page);

        LinearLayout hero=new LinearLayout(this);hero.setOrientation(LinearLayout.VERTICAL);hero.setPadding(dp(24),dp(26),dp(24),dp(28));hero.setBackground(background(teal,22));page.addView(hero,new LinearLayout.LayoutParams(-1,-2));
        TextView mark=text(hero,"SX",20,teal,true);mark.setGravity(Gravity.CENTER);mark.setBackground(background(Color.WHITE,16));mark.setLayoutParams(new LinearLayout.LayoutParams(dp(52),dp(52)));
        TextView title=text(hero,"Sổ Xe Tổ Chức",29,Color.WHITE,true);title.setPadding(0,dp(20),0,dp(7));
        text(hero,"Quản lý xe, giao dịch và bàn giao trong một nơi.",16,Color.rgb(225,244,241),false);

        LinearLayout card=new LinearLayout(this);card.setOrientation(LinearLayout.VERTICAL);card.setPadding(dp(22),dp(24),dp(22),dp(22));card.setBackground(background(Color.WHITE,18));card.setElevation(dp(5));LinearLayout.LayoutParams cardParams=new LinearLayout.LayoutParams(-1,-2);cardParams.setMargins(0,dp(18),0,0);page.addView(card,cardParams);
        text(card,"Đăng nhập",22,ink,true);
        TextView info=text(card,"Ứng dụng dùng luồng đăng nhập Google ổn định của bản 4.7. Bạn sẽ tiếp tục trong trình duyệt hệ thống.",15,muted,false);info.setPadding(0,dp(8),0,dp(16));
        text(card,"✓  Kết nối riêng Google Admin và NSD",14,ink,false);
        text(card,"✓  Đồng bộ chung với Web, Windows và iOS",14,ink,false);
        text(card,"✓  Không lưu mật khẩu Google trong APK",14,ink,false);
        Button open=new Button(this);open.setText("MỞ ỨNG DỤNG VÀ ĐĂNG NHẬP");open.setTextSize(15);open.setTypeface(null,Typeface.BOLD);open.setTextColor(Color.WHITE);open.setAllCaps(false);open.setBackground(background(teal,12));open.setMinHeight(dp(56));LinearLayout.LayoutParams buttonParams=new LinearLayout.LayoutParams(-1,dp(56));buttonParams.setMargins(0,dp(22),0,0);card.addView(open,buttonParams);open.setOnClickListener(v->openApp());
        TextView version=text(page,"Phiên bản 4.8.3  •  Android 7 trở lên",13,muted,false);version.setGravity(Gravity.CENTER);version.setPadding(0,dp(20),0,0);
    }

    private void openApp(){
        Intent intent=new Intent(Intent.ACTION_VIEW,Uri.parse(APP_URL));intent.addCategory(Intent.CATEGORY_BROWSABLE);
        Bundle extras=new Bundle();extras.putBinder("android.support.customtabs.extra.SESSION",null);intent.putExtras(extras);
        intent.putExtra("android.support.customtabs.extra.TOOLBAR_COLOR",Color.rgb(23,106,101));intent.putExtra("android.support.customtabs.extra.TITLE_VISIBILITY",0);intent.putExtra("android.support.customtabs.extra.ENABLE_URLBAR_HIDING",true);
        try{startActivity(intent);}catch(ActivityNotFoundException error){Toast.makeText(this,"Hãy cài Chrome hoặc trình duyệt hiện đại để đăng nhập Google.",Toast.LENGTH_LONG).show();}
    }
}
