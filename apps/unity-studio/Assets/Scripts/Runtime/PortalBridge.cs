using System.Runtime.InteropServices;
using UnityEngine;

namespace SpecialSoldier
{
    /// <summary>Reports a finished mission to the web page hosting the WebGL build (Plugins/WebGL/PortalBridge.jslib).
    /// Same message as the web game, with game "special-soldier-unity" so the portal can tell the two apart.
    /// Does nothing outside WebGL players.</summary>
    public static class PortalBridge
    {
        public const string GameId = "special-soldier-unity";
        public static string LastReport { get; private set; }   // tests and the HUD read this

#if UNITY_WEBGL && !UNITY_EDITOR
        [DllImport("__Internal")] static extern void SS_PostGameResult(string game, string mission, string grade, int score, int rp);
        [DllImport("__Internal")] static extern void SS_Navigate(string url);
#endif

        /// <summary>The classic (Three.js) edition to return to: the page's <c>?return=</c> if trusted, else the default site.</summary>
        public static string ClassicEditionUrl => SpecialSoldier.Core.EditionLinks.ClassicUrl(Application.absoluteURL);

        /// <summary>Opens the classic edition: same tab in the browser build, the default browser elsewhere.</summary>
        public static void GoToClassicEdition()
        {
            string url = ClassicEditionUrl;
            Debug.Log("[Portal] classic edition -> " + url);
#if UNITY_WEBGL && !UNITY_EDITOR
            SS_Navigate(url);
#else
            Application.OpenURL(url);
#endif
        }

        public static void ReportResult(string mission, string grade, int score, int rp)
        {
            LastReport = $"{GameId} {mission} {grade} score {score} rp {rp}";
            Debug.Log("[Portal] " + LastReport);
#if UNITY_WEBGL && !UNITY_EDITOR
            SS_PostGameResult(GameId, mission, grade, score, rp);
#endif
        }
    }
}
