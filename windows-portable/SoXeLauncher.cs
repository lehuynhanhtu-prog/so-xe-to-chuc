using System;
using System.Diagnostics;
using System.Windows.Forms;

internal static class SoXeLauncher
{
    private const string AppUrl = "https://lehuynhanhtu-prog.github.io/so-xe-to-chuc/";
    [STAThread]
    private static void Main()
    {
        try {
            Process.Start(new ProcessStartInfo(AppUrl) { UseShellExecute = true });
        } catch (Exception error) {
            MessageBox.Show("Không mở được trình duyệt. Hãy mở địa chỉ sau:\r\n" + AppUrl + "\r\n\r\n" + error.Message,
                "Sổ Xe Tổ Chức", MessageBoxButtons.OK, MessageBoxIcon.Information);
        }
    }
}
