$ErrorActionPreference = 'Stop'

$Port = 18766
$BindAddress = [System.Net.IPAddress]::Loopback
$AppOrigin = "http://127.0.0.1:$Port/"
$WebRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot 'www'))
$DataRoot = Join-Path $env:APPDATA 'SoXeOrganizationData'
$EdgeProfile = Join-Path $DataRoot 'EdgeProfile'
$HealthMarker = 'SOXE_PORTABLE_1'
$LogPath = Join-Path $DataRoot 'SoXeServer.log'

New-Item -ItemType Directory -Path $DataRoot -Force | Out-Null

function Write-SoxeLog([string]$Message) {
    $Timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    Add-Content -Path $LogPath -Encoding UTF8 -Value "[$Timestamp] $Message"
}

function Show-SoxeError([string]$Message) {
    Add-Type -AssemblyName PresentationFramework
    [System.Windows.MessageBox]::Show($Message, 'Sổ Xe', 'OK', 'Error') | Out-Null
}

function Find-Edge {
    $Candidates = @()
    foreach ($BasePath in @(${env:ProgramFiles(x86)}, $env:ProgramFiles, $env:LOCALAPPDATA)) {
        if ($BasePath) {
            $Candidates += Join-Path $BasePath 'Microsoft\Edge\Application\msedge.exe'
        }
    }
    $Found = $Candidates | Where-Object { Test-Path $_ -PathType Leaf } | Select-Object -First 1
    if ($Found) { return $Found }
    return (Get-Command 'msedge.exe' -ErrorAction SilentlyContinue).Source
}

function Start-SoxeWindow([string]$EdgePath) {
    New-Item -ItemType Directory -Path $EdgeProfile -Force | Out-Null
    $Arguments = @(
        "--user-data-dir=$EdgeProfile",
        "--app=$AppOrigin",
        '--no-first-run',
        '--disable-features=msEdgeSidebarV2'
    )
    return Start-Process -FilePath $EdgePath -ArgumentList $Arguments -PassThru
}

function Test-SoxeServer {
    $Client = $null
    try {
        $Client = [System.Net.Sockets.TcpClient]::new()
        $ConnectTask = $Client.ConnectAsync('127.0.0.1', $Port)
        if (-not $ConnectTask.Wait(800) -or -not $Client.Connected) { return $false }

        $Stream = $Client.GetStream()
        $Request = [System.Text.Encoding]::ASCII.GetBytes("GET /__soxe_health HTTP/1.1`r`nHost: 127.0.0.1`r`nConnection: close`r`n`r`n")
        $Stream.Write($Request, 0, $Request.Length)
        $Stream.ReadTimeout = 1200
        $Reader = [System.IO.StreamReader]::new($Stream)
        return $Reader.ReadToEnd().Contains($HealthMarker)
    } catch {
        return $false
    } finally {
        if ($Client) { $Client.Dispose() }
    }
}

function Get-MimeType([string]$FilePath) {
    switch ([System.IO.Path]::GetExtension($FilePath).ToLowerInvariant()) {
        '.html' { return 'text/html; charset=utf-8' }
        '.css' { return 'text/css; charset=utf-8' }
        '.js' { return 'text/javascript; charset=utf-8' }
        '.json' { return 'application/json; charset=utf-8' }
        '.webmanifest' { return 'application/manifest+json; charset=utf-8' }
        '.svg' { return 'image/svg+xml' }
        '.png' { return 'image/png' }
        '.ico' { return 'image/x-icon' }
        '.mobileconfig' { return 'application/x-apple-aspen-config' }
        default { return 'application/octet-stream' }
    }
}

function Write-Response($Client, [int]$StatusCode, [string]$StatusText, [string]$ContentType, [byte[]]$Body, [bool]$HeadOnly = $false) {
    $Stream = $Client.GetStream()
    $Headers = "HTTP/1.1 $StatusCode $StatusText`r`nContent-Type: $ContentType`r`nContent-Length: $($Body.Length)`r`nCache-Control: no-cache`r`nX-Content-Type-Options: nosniff`r`nService-Worker-Allowed: /`r`nConnection: close`r`n`r`n"
    $HeaderBytes = [System.Text.Encoding]::ASCII.GetBytes($Headers)
    $Stream.Write($HeaderBytes, 0, $HeaderBytes.Length)
    if (-not $HeadOnly -and $Body.Length -gt 0) {
        $Stream.Write($Body, 0, $Body.Length)
    }
    $Stream.Flush()
}

function Handle-Request($Client) {
    try {
        $Stream = $Client.GetStream()
        $Stream.ReadTimeout = 3000
        $Reader = [System.IO.StreamReader]::new($Stream, [System.Text.Encoding]::ASCII, $false, 4096, $true)
        $RequestLine = $Reader.ReadLine()
        if ([string]::IsNullOrWhiteSpace($RequestLine)) { return }

        while (($Line = $Reader.ReadLine()) -ne $null -and $Line -ne '') { }
        $Parts = $RequestLine.Split(' ')
        if ($Parts.Length -lt 2 -or ($Parts[0] -ne 'GET' -and $Parts[0] -ne 'HEAD')) {
            Write-Response $Client 405 'Method Not Allowed' 'text/plain; charset=utf-8' ([System.Text.Encoding]::UTF8.GetBytes('Method Not Allowed'))
            return
        }

        $HeadOnly = $Parts[0] -eq 'HEAD'
        $RequestPath = ([System.Uri]::new($AppOrigin, $Parts[1])).AbsolutePath
        if ($RequestPath -eq '/__soxe_health') {
            Write-Response $Client 200 'OK' 'text/plain; charset=utf-8' ([System.Text.Encoding]::UTF8.GetBytes($HealthMarker)) $HeadOnly
            return
        }

        $RelativePath = [System.Uri]::UnescapeDataString($RequestPath).TrimStart('/')
        if ([string]::IsNullOrWhiteSpace($RelativePath)) { $RelativePath = 'index.html' }
        $FilePath = [System.IO.Path]::GetFullPath((Join-Path $WebRoot $RelativePath.Replace('/', [System.IO.Path]::DirectorySeparatorChar)))
        $RootPrefix = $WebRoot.TrimEnd([System.IO.Path]::DirectorySeparatorChar) + [System.IO.Path]::DirectorySeparatorChar

        if (-not $FilePath.StartsWith($RootPrefix, [System.StringComparison]::OrdinalIgnoreCase) -or -not (Test-Path $FilePath -PathType Leaf)) {
            Write-Response $Client 404 'Not Found' 'text/plain; charset=utf-8' ([System.Text.Encoding]::UTF8.GetBytes('Không tìm thấy tài nguyên')) $HeadOnly
            return
        }

        Write-Response $Client 200 'OK' (Get-MimeType $FilePath) ([System.IO.File]::ReadAllBytes($FilePath)) $HeadOnly
    } catch {
        try {
            Write-Response $Client 500 'Internal Server Error' 'text/plain; charset=utf-8' ([System.Text.Encoding]::UTF8.GetBytes('Lỗi máy chủ nội bộ'))
        } catch { }
    } finally {
        $Client.Dispose()
    }
}

try {
    Write-SoxeLog 'Đang khởi động Sổ Xe Windows Portable.'
    if (-not (Test-Path (Join-Path $WebRoot 'index.html'))) {
        Show-SoxeError 'Thiếu thư mục www. Hãy giải nén đầy đủ file ZIP rồi chạy lại.'
        exit 1
    }

    $EdgePath = Find-Edge
    if (-not $EdgePath) {
        Show-SoxeError 'Không tìm thấy Microsoft Edge. Hãy cài hoặc cập nhật Microsoft Edge rồi chạy lại.'
        exit 1
    }

    if (Test-SoxeServer) {
        Start-SoxeWindow $EdgePath | Out-Null
        Write-SoxeLog 'Đã mở thêm cửa sổ từ máy chủ đang chạy.'
        exit 0
    }

    $Listener = [System.Net.Sockets.TcpListener]::new($BindAddress, $Port)
    try {
        $Listener.Start()
    } catch {
        Show-SoxeError "Không thể mở cổng nội bộ $Port. Hãy đóng bản Sổ Xe khác đang chạy rồi thử lại."
        exit 1
    }

    Start-SoxeWindow $EdgePath | Out-Null
    Write-SoxeLog "Máy chủ đã chạy tại $AppOrigin"
    $AcceptTask = $Listener.AcceptTcpClientAsync()

    # Edge thường chuyển cửa sổ sang một tiến trình khác rồi kết thúc tiến trình
    # do Start-Process trả về. Máy chủ phải tiếp tục chạy độc lập để cửa sổ ứng
    # dụng không mất kết nối ngay sau khi mở.
    while ($true) {
        if ($AcceptTask.Wait(250)) {
            $Client = $AcceptTask.Result
            $AcceptTask = $Listener.AcceptTcpClientAsync()
            Handle-Request $Client
        }
    }
} catch {
    Write-SoxeLog "LỖI: $($_.Exception.ToString())"
    Show-SoxeError "Không thể mở Sổ Xe.`n`n$($_.Exception.Message)"
    exit 1
} finally {
    if ($Listener) { $Listener.Stop() }
}
