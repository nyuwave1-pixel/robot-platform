using UnityEngine;
using UnityEngine.SceneManagement;

namespace SpecialSoldier
{
    /// <summary>Lives in the first scene of the build. Opens a campaign mission when asked: <c>-mission m01</c> on the command line or
    /// <c>?mission=m01</c> in the WebGL page URL (the classic edition or the portal can link straight to a mission).
    /// Unknown ids stay in the Island Slice.</summary>
    public sealed class SceneRouter : MonoBehaviour
    {
        public static string Requested()
        {
            var args = System.Environment.GetCommandLineArgs();
            for (int i = 0; i < args.Length - 1; i++) if (args[i] == "-mission") return args[i + 1];
            string url = Application.absoluteURL;
            int q = string.IsNullOrEmpty(url) ? -1 : url.IndexOf("mission=", System.StringComparison.Ordinal);
            if (q < 0) return null;
            string v = url.Substring(q + 8); int end = v.IndexOfAny(new[] { '&', '#' });
            return end >= 0 ? v.Substring(0, end) : v;
        }

        /// <summary>Scene name for a campaign id ("m01" → "Mission01").</summary>
        public static string SceneFor(string id)
        {
            var m = Core.Campaign.Get(id);
            return m == null ? null : "Mission" + m.Id.Substring(1).PadLeft(2, '0');
        }

        static bool _routed;
        void Awake()
        {
            if (_routed) return;          // only once per run: restarting the slice must not jump again
            _routed = true;
            string scene = SceneFor(Requested());
            if (scene != null && SceneManager.GetActiveScene().name != scene && Application.CanStreamedLevelBeLoaded(scene)) SceneManager.LoadScene(scene);
        }
    }
}
