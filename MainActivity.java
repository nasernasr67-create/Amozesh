package ir.myschool.planner;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import java.io.OutputStream;

public class MainActivity extends Activity {
    private static final int PICK = 1;
    private static final int SAVE = 2;
    private WebView web;
    private ValueCallback<Uri[]> picker;
    private String pending;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        web = new WebView(this);
        setContentView(web);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(true);
        s.setTextZoom(100);
        web.setWebViewClient(new WebViewClient());
        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> cb, FileChooserParams p) {
                if (picker != null) picker.onReceiveValue(null);
                picker = cb;
                Intent i = new Intent(Intent.ACTION_GET_CONTENT);
                i.addCategory(Intent.CATEGORY_OPENABLE);
                i.setType("*/*");
                try {
                    startActivityForResult(i, PICK);
                } catch (Exception e) {
                    picker = null;
                    return false;
                }
                return true;
            }
        });
        web.addJavascriptInterface(new Bridge(), "Android");
        web.loadUrl("file:///android_asset/index.html");
    }

    public class Bridge {
        @JavascriptInterface
        public void saveFile(final String name, final String content) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    pending = content;
                    Intent i = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                    i.addCategory(Intent.CATEGORY_OPENABLE);
                    i.setType("application/json");
                    i.putExtra(Intent.EXTRA_TITLE, name);
                    try {
                        startActivityForResult(i, SAVE);
                    } catch (Exception e) {
                        done(false);
                    }
                }
            });
        }
    }

    private void done(boolean ok) {
        web.evaluateJavascript("window.onSaved(" + ok + ")", null);
    }

    @Override
    protected void onActivityResult(int code, int result, Intent data) {
        super.onActivityResult(code, result, data);
        Uri uri = (result == RESULT_OK && data != null) ? data.getData() : null;
        if (code == PICK && picker != null) {
            picker.onReceiveValue(uri == null ? null : new Uri[]{uri});
            picker = null;
        } else if (code == SAVE && uri != null && pending != null) {
            try (OutputStream out = getContentResolver().openOutputStream(uri)) {
                out.write(pending.getBytes("UTF-8"));
                done(true);
            } catch (Exception e) {
                done(false);
            }
            pending = null;
        }
    }

    @Override
    public void onBackPressed() {
        web.evaluateJavascript("window.goBack()", value -> {
            if (!"true".equals(value)) finish();
        });
    }
}
