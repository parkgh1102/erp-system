package com.gaonfscorp.erp

import android.annotation.SuppressLint
import android.app.DownloadManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.os.Environment
import android.webkit.*
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private val webUrl = "https://www.webapperp.ai.kr"

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webView)

        // WebView 설정
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            setSupportZoom(true)
            builtInZoomControls = false
            loadWithOverviewMode = true
            useWideViewPort = true
            cacheMode = WebSettings.LOAD_DEFAULT
            allowFileAccess = true
            allowContentAccess = true

            // 쿠키 및 세션 유지
            javaScriptCanOpenWindowsAutomatically = true
            mediaPlaybackRequiresUserGesture = false
        }

        // 쿠키 설정 (로그인 세션 유지)
        CookieManager.getInstance().apply {
            setAcceptCookie(true)
            setAcceptThirdPartyCookies(webView, true)
        }

        // WebViewClient 설정
        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val url = request?.url.toString()

                // 외부 링크 처리
                if (url.startsWith("tel:")) {
                    startActivity(Intent(Intent.ACTION_DIAL, Uri.parse(url)))
                    return true
                }
                if (url.startsWith("mailto:")) {
                    startActivity(Intent(Intent.ACTION_SENDTO, Uri.parse(url)))
                    return true
                }

                return false
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                CookieManager.getInstance().flush()
            }

            override fun onReceivedError(
                view: WebView?,
                request: WebResourceRequest?,
                error: WebResourceError?
            ) {
                super.onReceivedError(view, request, error)
                if (request?.isForMainFrame == true) {
                    showErrorDialog()
                }
            }
        }

        // WebChromeClient 설정 (파일 업로드, 알림 등)
        webView.webChromeClient = object : WebChromeClient() {
            override fun onJsAlert(
                view: WebView?,
                url: String?,
                message: String?,
                result: JsResult?
            ): Boolean {
                AlertDialog.Builder(this@MainActivity)
                    .setMessage(message)
                    .setPositiveButton("확인") { _, _ -> result?.confirm() }
                    .setCancelable(false)
                    .create()
                    .show()
                return true
            }

            override fun onJsConfirm(
                view: WebView?,
                url: String?,
                message: String?,
                result: JsResult?
            ): Boolean {
                AlertDialog.Builder(this@MainActivity)
                    .setMessage(message)
                    .setPositiveButton("확인") { _, _ -> result?.confirm() }
                    .setNegativeButton("취소") { _, _ -> result?.cancel() }
                    .setCancelable(false)
                    .create()
                    .show()
                return true
            }
        }

        // 다운로드 리스너 설정
        webView.setDownloadListener { url, userAgent, contentDisposition, mimeType, _ ->
            val request = DownloadManager.Request(Uri.parse(url))
            request.apply {
                setMimeType(mimeType)
                addRequestHeader("User-Agent", userAgent)
                setDescription("파일 다운로드 중...")
                setTitle("ERP 파일")
                setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, "erp_file")
            }

            val dm = getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
            dm.enqueue(request)
            Toast.makeText(this, "다운로드 시작", Toast.LENGTH_SHORT).show()
        }

        // 웹사이트 로드
        webView.loadUrl(webUrl)
    }

    // 뒤로가기 버튼 처리
    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            // 앱 종료 확인
            AlertDialog.Builder(this)
                .setMessage("앱을 종료하시겠습니까?")
                .setPositiveButton("종료") { _, _ -> super.onBackPressed() }
                .setNegativeButton("취소", null)
                .show()
        }
    }

    private fun showErrorDialog() {
        AlertDialog.Builder(this)
            .setTitle("연결 오류")
            .setMessage("인터넷 연결을 확인해주세요.")
            .setPositiveButton("재시도") { _, _ -> webView.reload() }
            .setNegativeButton("종료") { _, _ -> finish() }
            .setCancelable(false)
            .show()
    }

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }
}
