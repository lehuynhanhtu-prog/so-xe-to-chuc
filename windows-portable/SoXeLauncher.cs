using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading;
using System.Windows.Forms;

internal static class SoXeLauncher
{
    private const int Port = 18766;
    private const string Origin = "http://127.0.0.1:18766/";
    private const string HealthMarker = "SOXE_ORGANIZATION_1.0.0";
    private static string WebRoot;
    private static string DataRoot;
    private static string LogPath;

    [STAThread]
    private static void Main()
    {
        try
        {
            DataRoot = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "SoXeOrganizationData");
            LogPath = Path.Combine(DataRoot, "SoXeLauncher.log");
            Directory.CreateDirectory(DataRoot);
            Log("Bat dau khoi dong So Xe To Chuc Windows 1.0.0.");

            WebRoot = Path.GetFullPath(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "www"));
            if (!File.Exists(Path.Combine(WebRoot, "index.html")))
                throw new FileNotFoundException("Thieu thu muc www. Hay giai nen day du file ZIP roi chay lai.");

            string runningMarker = RunningServerMarker();
            if (runningMarker == HealthMarker)
            {
                OpenDefaultBrowser();
                Log("Da mo cua so tu may chu dung phien ban.");
                return;
            }
            if (runningMarker != null && !TryStopOldServer())
            {
                MessageBox.Show(
                    "Khong the tu dong dong may chu So Xe cu. Hay dong SoXeLauncher.exe cu "
                    + "trong Task Manager, sau do chay lai Chay-So-Xe.bat ban To Chuc 1.0.0. "
                    + "Du lieu tren trinh duyet va Google Drive van duoc giu nguyen.",
                    "Can dong ban cu", MessageBoxButtons.OK, MessageBoxIcon.Information);
                return;
            }

            TcpListener listener = new TcpListener(IPAddress.Loopback, Port);
            listener.Start();
            Log("May chu da chay tai " + Origin);
            OpenDefaultBrowser();

            while (true)
            {
                TcpClient client = listener.AcceptTcpClient();
                ThreadPool.QueueUserWorkItem(delegate(object state) { HandleRequest((TcpClient)state); }, client);
            }
        }
        catch (Exception ex)
        {
            TryLog("LOI: " + ex);
            MessageBox.Show("Khong the mo So Xe.\r\n\r\n" + ex.Message +
                "\r\n\r\nNhat ky: %APPDATA%\\SoXeOrganizationData\\SoXeLauncher.log",
                "So Xe", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
    }

    private static void OpenDefaultBrowser()
    {
        ProcessStartInfo info = new ProcessStartInfo(Origin);
        info.UseShellExecute = true;
        Process.Start(info);
    }

    private static string RunningServerMarker()
    {
        try
        {
            using (TcpClient client = new TcpClient())
            {
                IAsyncResult result = client.BeginConnect("127.0.0.1", Port, null, null);
                if (!result.AsyncWaitHandle.WaitOne(800)) return null;
                client.EndConnect(result);
                NetworkStream stream = client.GetStream();
                byte[] request = Encoding.ASCII.GetBytes("GET /__soxe_health HTTP/1.1\r\nHost: 127.0.0.1\r\nConnection: close\r\n\r\n");
                stream.Write(request, 0, request.Length);
                stream.ReadTimeout = 1200;
                using (StreamReader reader = new StreamReader(stream))
                    { string response = reader.ReadToEnd();
                        if (response.Contains(HealthMarker)) return HealthMarker;
                        if (response.Contains("SOXE_ORGANIZATION_")) return "SOXE_ORGANIZATION_OLD";
                        return null; }
            }
        }
        catch { return null; }
    }

    private static bool TryStopOldServer()
    {
        try
        {
            // Only stop the process listening on our loopback port after its health check
            // identified an older So Xe server. Never stop another application on this port.
            ProcessStartInfo info = new ProcessStartInfo("netstat.exe", "-ano -p tcp");
            info.UseShellExecute = false;
            info.RedirectStandardOutput = true;
            info.CreateNoWindow = true;
            string output;
            using (Process netstat = Process.Start(info))
            {
                output = netstat.StandardOutput.ReadToEnd();
                netstat.WaitForExit(5000);
                if (netstat.ExitCode != 0) return false;
            }
            foreach (string line in output.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries))
            {
                string[] columns = System.Text.RegularExpressions.Regex.Split(line.Trim(), @"\s+");
                if (columns.Length < 5 || columns[0] != "TCP"
                    || columns[1] != "127.0.0.1:" + Port
                    || !String.Equals(columns[3], "LISTENING", StringComparison.OrdinalIgnoreCase)) continue;
                int pid;
                if (!Int32.TryParse(columns[4], out pid) || pid == Process.GetCurrentProcess().Id)
                    return false;
                using (Process server = Process.GetProcessById(pid))
                {
                    if (!String.Equals(server.ProcessName, "SoXeLauncher", StringComparison.OrdinalIgnoreCase)
                        || RunningServerMarker() != "SOXE_ORGANIZATION_OLD") return false;
                    server.Kill();
                    if (!server.WaitForExit(5000)) return false;
                    Log("Da dong may chu So Xe cu PID " + pid + " de mo ban moi.");
                    return true;
                }
            }
        }
        catch (Exception error)
        {
            TryLog("Khong dong duoc may chu cu: " + error.Message);
        }
        return false;
    }

    private static void HandleRequest(TcpClient client)
    {
        using (client)
        {
            try
            {
                NetworkStream stream = client.GetStream();
                stream.ReadTimeout = 3000;
                string requestLine;
                using (StreamReader reader = new StreamReader(stream, Encoding.ASCII, false, 4096, true))
                {
                    requestLine = reader.ReadLine();
                    string line;
                    while ((line = reader.ReadLine()) != null && line.Length != 0) { }
                }
                if (String.IsNullOrWhiteSpace(requestLine)) return;
                string[] parts = requestLine.Split(' ');
                if (parts.Length < 2 || (parts[0] != "GET" && parts[0] != "HEAD"))
                {
                    WriteResponse(stream, 405, "Method Not Allowed", "text/plain; charset=utf-8", Encoding.UTF8.GetBytes("Method Not Allowed"), false);
                    return;
                }

                bool headOnly = parts[0] == "HEAD";
                string requestPath = new Uri(new Uri(Origin), parts[1]).AbsolutePath;
                if (requestPath == "/__soxe_health")
                {
                    WriteResponse(stream, 200, "OK", "text/plain; charset=utf-8", Encoding.UTF8.GetBytes(HealthMarker), headOnly);
                    return;
                }

                string relative = Uri.UnescapeDataString(requestPath).TrimStart('/');
                if (String.IsNullOrWhiteSpace(relative)) relative = "index.html";
                string filePath = Path.GetFullPath(Path.Combine(WebRoot, relative.Replace('/', Path.DirectorySeparatorChar)));
                string rootPrefix = WebRoot.TrimEnd(Path.DirectorySeparatorChar) + Path.DirectorySeparatorChar;
                if (!filePath.StartsWith(rootPrefix, StringComparison.OrdinalIgnoreCase) || !File.Exists(filePath))
                {
                    WriteResponse(stream, 404, "Not Found", "text/plain; charset=utf-8", Encoding.UTF8.GetBytes("Khong tim thay tai nguyen"), headOnly);
                    return;
                }
                WriteResponse(stream, 200, "OK", MimeType(filePath), File.ReadAllBytes(filePath), headOnly);
            }
            catch (Exception ex) { TryLog("Loi xu ly yeu cau: " + ex.Message); }
        }
    }

    private static void WriteResponse(Stream stream, int code, string status, string contentType, byte[] body, bool headOnly)
    {
        string headers = "HTTP/1.1 " + code + " " + status + "\r\nContent-Type: " + contentType +
            "\r\nContent-Length: " + body.Length + "\r\nCache-Control: no-cache\r\n" +
            "X-Content-Type-Options: nosniff\r\nService-Worker-Allowed: /\r\nConnection: close\r\n\r\n";
        byte[] headerBytes = Encoding.ASCII.GetBytes(headers);
        stream.Write(headerBytes, 0, headerBytes.Length);
        if (!headOnly && body.Length > 0) stream.Write(body, 0, body.Length);
        stream.Flush();
    }

    private static string MimeType(string file)
    {
        switch (Path.GetExtension(file).ToLowerInvariant())
        {
            case ".html": return "text/html; charset=utf-8";
            case ".css": return "text/css; charset=utf-8";
            case ".js": return "text/javascript; charset=utf-8";
            case ".json": return "application/json; charset=utf-8";
            case ".webmanifest": return "application/manifest+json; charset=utf-8";
            case ".svg": return "image/svg+xml";
            case ".png": return "image/png";
            case ".ico": return "image/x-icon";
            case ".mobileconfig": return "application/x-apple-aspen-config";
            default: return "application/octet-stream";
        }
    }

    private static void Log(string message)
    {
        File.AppendAllText(LogPath, "[" + DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss") + "] " + message + Environment.NewLine, Encoding.UTF8);
    }

    private static void TryLog(string message)
    {
        try { Log(message); } catch { }
    }
}
