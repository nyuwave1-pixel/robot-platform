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
#endif

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
