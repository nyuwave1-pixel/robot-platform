using System;

namespace SpecialSoldier.Core
{
    /// <summary>SPECIAL SOLDIER is one game with two editions (docs/game-dev/EDITIONS_ROADMAP.md): the Three.js CLASSIC
    /// campaign and this Unity edition. The classic menu opens this build with <c>?difficulty=…&amp;return=…</c>; these helpers
    /// read those parameters and decide where the pause menu's CLASSIC EDITION button goes.</summary>
    public static class EditionLinks
    {
        /// <summary>Where CLASSIC EDITION goes when the page was opened without a usable <c>return=</c>.</summary>
        public const string DefaultClassicUrl = "https://special-soldier.vercel.app/";

        /// <summary>Hosts a <c>return=</c> link may point at. Anything else falls back to <see cref="DefaultClassicUrl"/>, so a
        /// crafted link can't turn the button into a redirect to another site.</summary>
        static readonly string[] TrustedHosts = { "special-soldier.vercel.app", "www.airobotphysical.com", "airobotphysical.com",
            "bitpark.airobotphysical.com", "localhost", "127.0.0.1" };

        /// <summary>Value of <paramref name="key"/> in the page URL's query string (URL-decoded), or null.</summary>
        public static string Param(string url, string key)
        {
            if (string.IsNullOrEmpty(url) || string.IsNullOrEmpty(key)) return null;
            int q = url.IndexOf('?'); if (q < 0) return null;
            int hash = url.IndexOf('#', q); string query = hash >= 0 ? url.Substring(q + 1, hash - q - 1) : url.Substring(q + 1);
            foreach (var pair in query.Split('&'))
            {
                int eq = pair.IndexOf('=');
                string k = eq >= 0 ? pair.Substring(0, eq) : pair;
                if (Uri.UnescapeDataString(k.Replace('+', ' ')) != key) continue;
                return eq >= 0 ? Uri.UnescapeDataString(pair.Substring(eq + 1).Replace('+', ' ')) : "";
            }
            return null;
        }

        /// <summary>Difficulty id from <c>?difficulty=</c> if it names a real difficulty, else null (so the saved setting wins).</summary>
        public static string DifficultyId(string url)
        {
            string v = Param(url, "difficulty");
            if (string.IsNullOrEmpty(v)) return null;
            foreach (var d in Difficulty.All) if (string.Equals(d.Id, v, StringComparison.OrdinalIgnoreCase)) return d.Id;
            return null;
        }

        /// <summary>The classic edition page to go back to: <c>?return=</c> if it is an http(s) link on a trusted host.</summary>
        public static string ClassicUrl(string url)
        {
            string r = Param(url, "return");
            if (!string.IsNullOrEmpty(r) && Uri.TryCreate(r, UriKind.Absolute, out var u) && (u.Scheme == "https" || u.Scheme == "http"))
                foreach (var h in TrustedHosts) if (string.Equals(u.Host, h, StringComparison.OrdinalIgnoreCase)) return u.AbsoluteUri;
            return DefaultClassicUrl;
        }
    }
}
