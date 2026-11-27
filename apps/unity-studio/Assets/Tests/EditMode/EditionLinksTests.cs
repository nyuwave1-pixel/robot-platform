using NUnit.Framework;
using SpecialSoldier.Core;

namespace SpecialSoldier.Core.Tests
{
    /// <summary>The classic menu opens the Unity edition with ?difficulty=…&amp;return=… (web src/config/editions.js).</summary>
    public class EditionLinksTests
    {
        const string Base = "https://bitpark.airobotphysical.com/play/unity-island-slice/index.html";

        [Test]
        public void ReadsParamsTheClassicMenuSends()
        {
            string url = Base + "?difficulty=veteran&return=https%3A%2F%2Fspecial-soldier.vercel.app%2F&sky=storm#x";
            Assert.AreEqual("veteran", EditionLinks.Param(url, "difficulty"));
            Assert.AreEqual("storm", EditionLinks.Param(url, "sky"));
            Assert.AreEqual("https://special-soldier.vercel.app/", EditionLinks.Param(url, "return"));
            Assert.IsNull(EditionLinks.Param(url, "missing"));
            Assert.IsNull(EditionLinks.Param(Base, "difficulty"));
        }

        [Test]
        public void DifficultyOnlyForRealIds()
        {
            Assert.AreEqual("recruit", EditionLinks.DifficultyId(Base + "?difficulty=RECRUIT"));
            Assert.IsNull(EditionLinks.DifficultyId(Base + "?difficulty=nightmare"), "unknown id: keep the saved setting");
            Assert.IsNull(EditionLinks.DifficultyId(Base));
        }

        [Test]
        public void ReturnLinkOnlyToTrustedHosts()
        {
            Assert.AreEqual("https://special-soldier.vercel.app/", EditionLinks.ClassicUrl(Base + "?return=https://special-soldier.vercel.app/"));
            Assert.AreEqual("http://localhost:5180/", EditionLinks.ClassicUrl(Base + "?return=http://localhost:5180/"));
            Assert.AreEqual(EditionLinks.DefaultClassicUrl, EditionLinks.ClassicUrl(Base + "?return=https://evil.example/phish"));
            Assert.AreEqual(EditionLinks.DefaultClassicUrl, EditionLinks.ClassicUrl(Base + "?return=javascript:alert(1)"));
            Assert.AreEqual(EditionLinks.DefaultClassicUrl, EditionLinks.ClassicUrl(Base + "?return=https://special-soldier.vercel.app.evil.example/"));
            Assert.AreEqual(EditionLinks.DefaultClassicUrl, EditionLinks.ClassicUrl(Base));
        }
    }
}
