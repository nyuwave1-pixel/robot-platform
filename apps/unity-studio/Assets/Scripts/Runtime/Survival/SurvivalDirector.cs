using System.Collections.Generic;
using System.Linq;
using SurvivalWorld.Core;
using UnityEngine;
using UnityEngine.InputSystem;

namespace SurvivalWorld.Runtime
{
    /// <summary>
    /// SURVIVAL WORLD (Unity edition): drives <see cref="SurvivalRules"/> — the C# port of the web logic.js, kept
    /// bit-exact by SurvivalRulesTests — and draws it with the Blender models (survival.glb). Controls match the web game:
    /// mouse look · WASD · Shift sprint · E gather · left click attack/gather · F drink · Q eat · C craft · B build (R rotate).
    /// Templates are children of the imported GLB that SurvivalSceneBuilder puts under this object, disabled.
    /// </summary>
    public sealed class SurvivalDirector : MonoBehaviour
    {
        public long seed = 2026;
        public GameObject tree, treeTall, rock, bush, wolf, campfire, wall;
        public Light sun;
        public Font hudFont;   // Noto Sans KR subset (Tools~/gen-survival-font.py): the built-in font has no Hangul in WebGL
        public Material groundMaterial, seaMaterial, ghostOk, ghostBad;
        public float mouseSensitivity = 0.0025f;

        public SurvivalRules.Game G { get; private set; }
        public int ActiveNodeViews => nodeViews.Values.Count(v => v.activeSelf);
        public int WolfViews => wolfViews.Count;
        public int StructureViews => structureViews.Count;
        Camera cam; double yaw, pitch;
        Transform worldRoot;
        readonly Dictionary<SurvivalRules.ResourceNode, GameObject> nodeViews = new Dictionary<SurvivalRules.ResourceNode, GameObject>();
        readonly Dictionary<int, (GameObject go, Vector3 last)> wolfViews = new Dictionary<int, (GameObject, Vector3)>();
        readonly Dictionary<SurvivalRules.Structure, GameObject> structureViews = new Dictionary<SurvivalRules.Structure, GameObject>();
        GameObject ghost; string buildKind; double buildRot;
        bool crafting, ended; float hudToastT; string toast = "";
        static readonly string[] Foods = { "cooked", "berry", "meat" };

        void Start()
        {
            cam = Camera.main;
            if (!cam) { var c = new GameObject("Main Camera") { tag = "MainCamera" }; cam = c.AddComponent<Camera>(); }
            cam.nearClipPlane = 0.1f; cam.farClipPlane = 900f; cam.fieldOfView = 70f;
            NewGame(seed);
        }

        public void NewGame(long s)
        {
            seed = s; G = SurvivalRules.NewGame(s); ended = false; crafting = false; buildKind = null;
            yaw = 0; pitch = -0.05;   // spawn looks inland (web: yaw 0)
            if (worldRoot) Destroy(worldRoot.gameObject);
            nodeViews.Clear(); wolfViews.Clear(); structureViews.Clear();
            worldRoot = new GameObject("World").transform;
            BuildGround(); BuildNodes();
            ghost = GameObject.CreatePrimitive(PrimitiveType.Cube); ghost.name = "BuildGhost"; Destroy(ghost.GetComponent<Collider>());
            ghost.transform.SetParent(worldRoot); ghost.SetActive(false);
            Lock(true); Say("섬에 도착했다 — 밤이 오기 전에 모닥불을 만들자");
        }

        void BuildGround()
        {
            var ground = new GameObject("Ground"); ground.transform.SetParent(worldRoot);
            var mesh = SurvivalTerrain.BuildMesh(seed);
            ground.AddComponent<MeshFilter>().sharedMesh = mesh;
            var mat = groundMaterial ? new Material(groundMaterial) : new Material(Shader.Find("Universal Render Pipeline/Lit"));
            var tex = SurvivalTerrain.BuildTexture(seed);
            if (mat.HasProperty("_BaseMap")) mat.SetTexture("_BaseMap", tex); else mat.mainTexture = tex;
            ground.AddComponent<MeshRenderer>().sharedMaterial = mat;
            ground.AddComponent<MeshCollider>().sharedMesh = mesh;   // for the build-aim ray only
            var sea = GameObject.CreatePrimitive(PrimitiveType.Plane); sea.name = "Sea"; Destroy(sea.GetComponent<Collider>());
            sea.transform.SetParent(worldRoot); sea.transform.position = new Vector3(0, 0.05f, 0); sea.transform.localScale = Vector3.one * 160f;
            if (seaMaterial) sea.GetComponent<Renderer>().sharedMaterial = seaMaterial;
        }

        void BuildNodes()
        {
            foreach (var n in G.Nodes)
            {
                var tpl = n.Kind == "tree" ? (n.Id % 3 == 0 && treeTall ? treeTall : tree) : n.Kind == "rock" ? rock : bush;
                var go = Spawn(tpl, n.Kind + n.Id);
                float k = 0.8f + (n.Id * 0.37f % 0.4f);
                go.transform.SetPositionAndRotation(SurvivalTerrain.ToWorldRaw(seed, n.X, n.Z) + Vector3.down * 0.1f, Quaternion.Euler(0, n.Id * 97.4f, 0));
                go.transform.localScale = Vector3.one * k;
                nodeViews[n] = go;
            }
        }

        GameObject Spawn(GameObject tpl, string name)
        {
            GameObject go = tpl ? Instantiate(tpl, worldRoot) : GameObject.CreatePrimitive(PrimitiveType.Cylinder);
            go.name = name; go.SetActive(true); go.transform.SetParent(worldRoot);
            foreach (var c in go.GetComponentsInChildren<Collider>()) Destroy(c);
            return go;
        }

        // ------------------------------------------------------------ loop
        void Update()
        {
            if (G == null) return;
            var kb = Keyboard.current; var mouse = Mouse.current;
            float dt = Mathf.Min(0.1f, Time.deltaTime);
            if (!ended && !crafting && kb != null)
            {
                if (mouse != null && Cursor.lockState == CursorLockMode.Locked)
                {
                    var md = mouse.delta.ReadValue();
                    yaw -= md.x * mouseSensitivity; pitch = System.Math.Max(-1.4, System.Math.Min(1.4, pitch + md.y * mouseSensitivity));
                }
                bool sprint = kb.shiftKey.isPressed && G.P.Stamina > 5;
                int f = (kb.wKey.isPressed ? 1 : 0) - (kb.sKey.isPressed ? 1 : 0), r = (kb.dKey.isPressed ? 1 : 0) - (kb.aKey.isPressed ? 1 : 0);
                if (f != 0 || r != 0)
                {   // the web's movement formula, in web coordinates
                    double sp = (sprint ? 7 : 4.2) * dt, L = System.Math.Sqrt(f * f + r * r);
                    SurvivalRules.MovePlayer(G, (-System.Math.Sin(yaw) * f + System.Math.Cos(yaw) * r) / L * sp, (-System.Math.Cos(yaw) * f - System.Math.Sin(yaw) * r) / L * sp);
                }
                SurvivalRules.Step(G, dt, sprint && (f != 0 || r != 0));
                Keys(kb, mouse);
                if (!G.P.Alive) { ended = true; Lock(false); }
            }
            else if (kb != null && kb.cKey.wasPressedThisFrame && crafting) { crafting = false; Lock(true); }
            if (kb != null && kb.escapeKey.wasPressedThisFrame) { crafting = false; Lock(false); }
            if (mouse != null && mouse.leftButton.wasPressedThisFrame && Cursor.lockState != CursorLockMode.Locked && !crafting && !ended) Lock(true);

            var eye = SurvivalTerrain.ToWorld(seed, G.P.X, G.P.Z, 1.7f);
            cam.transform.SetPositionAndRotation(eye, Quaternion.Euler((float)(-pitch * Mathf.Rad2Deg), (float)(-yaw * Mathf.Rad2Deg), 0));
            SyncNodes(); SyncWolves(dt); SyncStructures(); Ghost(); UpdateLighting();
            if ((hudToastT -= Time.deltaTime) <= 0) toast = "";
        }

        void Keys(Keyboard kb, Mouse mouse)
        {
            if (kb.eKey.wasPressedThisFrame) GatherNearest();
            if (kb.fKey.wasPressedThisFrame) Say(SurvivalRules.Drink(G) ? "물을 마셨다 (+25)" : "물가에서만 마실 수 있다");
            if (kb.qKey.wasPressedThisFrame) { var food = Foods.FirstOrDefault(k => G.Get(k) > 0); Say(food != null && SurvivalRules.Eat(G, food) ? $"{SurvivalRules.Items[food].Ko} 먹음" : "먹을 것이 없다"); }
            if (kb.cKey.wasPressedThisFrame) { crafting = true; Lock(false); }
            if (kb.bKey.wasPressedThisFrame)
            {
                var opts = new[] { "campfire", "wall" }.Where(k => G.Get(k) > 0).ToList();
                if (opts.Count == 0) { buildKind = null; Say("지을 것이 없다 — C 로 만들기"); }
                else { int i = buildKind == null ? 0 : opts.IndexOf(buildKind) + 1; buildKind = i < opts.Count ? opts[i] : null; }
            }
            if (kb.rKey.wasPressedThisFrame) buildRot = buildRot != 0 ? 0 : System.Math.PI / 2;
            if (mouse != null && mouse.leftButton.wasPressedThisFrame) Primary();
        }

        void Primary()
        {
            if (buildKind != null)
            {
                if (AimPoint(out var p))
                {
                    var (x, z) = SurvivalTerrain.ToGame(p);
                    if (SurvivalRules.Place(G, buildKind, x, z, buildRot)) { Say($"{SurvivalRules.Items[buildKind].Ko} 설치"); if (G.Get(buildKind) <= 0) buildKind = null; }
                    else Say("여기에는 지을 수 없다");
                }
                return;
            }
            var w = G.Wolves.Where(v => Dist(v.X, v.Z) <= 2.4).OrderBy(v => Dist(v.X, v.Z)).FirstOrDefault();
            if (w != null) { if (SurvivalRules.Attack(G, w)) Say("늑대를 쓰러뜨렸다 · 날고기 +2"); return; }
            GatherNearest();
        }

        void GatherNearest()
        {
            var n = SurvivalRules.NearestNode(G);
            var drop = SurvivalRules.Gather(G, n);
            if (drop == null) { Say("가까이에 채집할 것이 없다"); return; }
            if (drop.Count > 0) Say(string.Join(" · ", drop.Select(kv => $"{SurvivalRules.Items[kv.Key].Ko} +{kv.Value}")));
            else if (nodeViews.TryGetValue(n, out var go)) go.transform.localScale *= 0.96f;   // a small "hit" cue
        }

        double Dist(double x, double z) => System.Math.Sqrt((x - G.P.X) * (x - G.P.X) + (z - G.P.Z) * (z - G.P.Z));

        bool AimPoint(out Vector3 p)
        {
            p = default;
            if (!Physics.Raycast(cam.transform.position, cam.transform.forward, out var hit, 8f)) return false;
            p = hit.point; return true;
        }

        // ------------------------------------------------------------ views
        void SyncNodes()
        {
            foreach (var kv in nodeViews)
            {
                bool alive = kv.Key.Hp > 0;
                if (kv.Value.activeSelf != alive)
                {
                    kv.Value.SetActive(alive);
                    if (alive) kv.Value.transform.localScale = Vector3.one * (0.8f + (kv.Key.Id * 0.37f % 0.4f));
                }
            }
        }

        void SyncWolves(float dt)
        {
            var live = new HashSet<int>();
            foreach (var w in G.Wolves)
            {
                live.Add(w.Id);
                var pos = SurvivalTerrain.ToWorld(seed, w.X, w.Z);
                if (!wolfViews.TryGetValue(w.Id, out var v)) { v = (Spawn(wolf, "wolf" + w.Id), pos); v.go.transform.position = pos; }
                var go = v.go; var move = pos - v.last; move.y = 0;
                var face = move.sqrMagnitude > 1e-5f ? move : SurvivalTerrain.ToWorld(seed, G.P.X, G.P.Z) - pos; face.y = 0;
                if (face.sqrMagnitude > 1e-5f) go.transform.rotation = Quaternion.Slerp(go.transform.rotation, Quaternion.LookRotation(face), 10f * dt);
                go.transform.position = pos;
                float swing = move.sqrMagnitude > 1e-6f ? Mathf.Sin(Time.time * 14f + w.Id) * 35f : 0f;
                Pivot(go, "legFL", swing); Pivot(go, "legBR", swing); Pivot(go, "legFR", -swing); Pivot(go, "legBL", -swing);
                wolfViews[w.Id] = (go, pos);
            }
            foreach (var id in wolfViews.Keys.Where(id => !live.Contains(id)).ToList()) { Destroy(wolfViews[id].go); wolfViews.Remove(id); }
        }

        static void Pivot(GameObject root, string name, float deg)
        {
            var t = Find(root.transform, name); if (t) t.localRotation = Quaternion.Euler(deg, 0, 0);
        }
        static Transform Find(Transform t, string name)
        {
            if (t.name == name) return t;
            foreach (Transform c in t) { var r = Find(c, name); if (r) return r; }
            return null;
        }

        void SyncStructures()
        {
            foreach (var s in G.Structures)
            {
                if (structureViews.ContainsKey(s)) continue;
                var go = Spawn(s.Kind == "campfire" ? campfire : wall, s.Kind);
                // web mesh rotation r → Unity yaw 180° − r (z flip + glTF front)
                go.transform.SetPositionAndRotation(SurvivalTerrain.ToWorldRaw(seed, s.X, s.Z), Quaternion.Euler(0, 180f - (float)(s.Rot * Mathf.Rad2Deg), 0));
                if (s.Kind == "campfire")
                {
                    var l = new GameObject("FireLight").AddComponent<Light>(); l.type = LightType.Point; l.color = new Color(1f, 0.6f, 0.25f);
                    l.range = 14f; l.intensity = 3f; l.transform.SetParent(go.transform, false); l.transform.localPosition = Vector3.up * 0.8f;
                }
                structureViews[s] = go;
            }
            foreach (var kv in structureViews)
                if (kv.Key.Kind == "campfire") { var fl = Find(kv.Value.transform, "flame"); if (fl) fl.localScale = new Vector3(1, 0.85f + 0.2f * Mathf.PerlinNoise(Time.time * 6f, kv.Key.X > 0 ? 1 : 2), 1); }
        }

        void Ghost()
        {
            bool show = buildKind != null && !crafting && !ended && AimPoint(out _);
            ghost.SetActive(show); if (!show) return;
            AimPoint(out var p); var (x, z) = SurvivalTerrain.ToGame(p);
            double sx = SurvivalRules.Snap(x), sz = SurvivalRules.Snap(z);
            bool wallKind = buildKind == "wall";
            ghost.transform.localScale = wallKind ? new Vector3(2f, 2.2f, 0.3f) : new Vector3(1.2f, 0.4f, 1.2f);
            ghost.transform.SetPositionAndRotation(SurvivalTerrain.ToWorldRaw(seed, sx, sz) + Vector3.up * ghost.transform.localScale.y / 2f,
                Quaternion.Euler(0, 180f - (float)(buildRot * Mathf.Rad2Deg), 0));
            var mat = SurvivalRules.CanPlace(G, buildKind, x, z) ? ghostOk : ghostBad;
            if (mat) ghost.GetComponent<Renderer>().sharedMaterial = mat;
        }

        void UpdateLighting()
        {
            double k = SurvivalRules.DayPhase(G);
            float sunAngle = (float)((k - 0.25) * 360.0);            // 0.25 = sunrise, 0.5 = noon, 0.75 = sunset
            float day = Mathf.Clamp01(Mathf.Sin((float)((k - 0.23) / (0.79 - 0.23) * Mathf.PI)));   // 0 outside the web's 05:30–19:00 day
            if (sun) { sun.transform.rotation = Quaternion.Euler(sunAngle, 30f, 0); sun.intensity = Mathf.Lerp(0.05f, 1.25f, day); }
            var sky = Color.Lerp(new Color(0.04f, 0.06f, 0.12f), new Color(0.55f, 0.72f, 0.86f), day);
            float dusk = Mathf.Clamp01(1f - Mathf.Abs(day - 0.25f) * 6f) * 0.5f;   // a narrow warm tint near sunrise / sunset only
            sky = Color.Lerp(sky, new Color(0.95f, 0.55f, 0.3f), dusk);
            cam.clearFlags = CameraClearFlags.SolidColor; cam.backgroundColor = sky;
            RenderSettings.ambientMode = UnityEngine.Rendering.AmbientMode.Flat;
            RenderSettings.ambientLight = Color.Lerp(new Color(0.08f, 0.09f, 0.16f), new Color(0.55f, 0.58f, 0.6f), day);
            RenderSettings.fog = true; RenderSettings.fogMode = FogMode.Linear; RenderSettings.fogColor = sky;
            RenderSettings.fogStartDistance = 40f; RenderSettings.fogEndDistance = Mathf.Lerp(90f, 320f, day);
        }

        // ------------------------------------------------------------ HUD (IMGUI: no UI assets needed)
        void Say(string s) { toast = s; hudToastT = 2.5f; }
        static void Lock(bool on) { Cursor.lockState = on ? CursorLockMode.Locked : CursorLockMode.None; Cursor.visible = !on; }

        void OnGUI()
        {
            if (G == null) return;
            if (hudFont) GUI.skin.font = hudFont;
            var P = G.P; float s = Screen.height / 720f;
            var box = new GUIStyle(GUI.skin.box) { fontSize = (int)(14 * s), alignment = TextAnchor.UpperLeft };
            var big = new GUIStyle(GUI.skin.label) { fontSize = (int)(30 * s), alignment = TextAnchor.MiddleCenter, fontStyle = FontStyle.Bold };
            Bar(0, "체력", P.Hp, new Color(0.85f, 0.25f, 0.25f), s); Bar(1, "배고픔", P.Hunger, new Color(0.9f, 0.6f, 0.2f), s);
            Bar(2, "목마름", P.Thirst, new Color(0.3f, 0.6f, 0.95f), s); Bar(3, "체온", P.Warmth, new Color(0.95f, 0.8f, 0.3f), s);
            Bar(4, "기력", P.Stamina, new Color(0.5f, 0.85f, 0.4f), s);
            double clock = SurvivalRules.DayPhase(G) * 24; int hh = (int)clock, mm = (int)((clock - hh) * 60);
            GUI.Box(new Rect(Screen.width - 230 * s, 12 * s, 218 * s, 52 * s), $"{G.Day}일째 · {hh:00}:{mm:00} {(SurvivalRules.IsNight(G) ? "밤" : "낮")}\n늑대 처치 {G.Kills}", box);
            var inv = string.Join("  ", G.Inv.Where(kv => kv.Value > 0).Select(kv => $"{SurvivalRules.Items[kv.Key].Ko} {kv.Value}"));
            GUI.Box(new Rect(12 * s, Screen.height - 64 * s, Screen.width - 24 * s, 28 * s), inv.Length > 0 ? inv : "소지품 없음", box);
            GUI.Label(new Rect(12 * s, Screen.height - 34 * s, Screen.width, 24 * s),
                "WASD 이동 · Shift 달리기 · E 채집 · 클릭 공격/채집 · F 물 · Q 먹기 · C 제작 · B 짓기(R 회전) · Esc 커서" + (buildKind != null ? $"   [짓기: {SurvivalRules.Items[buildKind].Ko}]" : ""),
                new GUIStyle(GUI.skin.label) { fontSize = (int)(12 * s) });
            GUI.Label(new Rect(Screen.width / 2f - 6, Screen.height / 2f - 10, 12, 20), "+");
            if (toast.Length > 0) GUI.Label(new Rect(0, Screen.height * 0.62f, Screen.width, 40 * s), toast, new GUIStyle(big) { fontSize = (int)(18 * s) });
            if (crafting) CraftPanel(s, box);
            if (ended)
            {
                GUI.Box(new Rect(Screen.width / 2f - 220 * s, Screen.height / 2f - 110 * s, 440 * s, 220 * s), "");
                GUI.Label(new Rect(Screen.width / 2f - 220 * s, Screen.height / 2f - 100 * s, 440 * s, 60 * s), "쓰러졌다", big);
                GUI.Label(new Rect(Screen.width / 2f - 220 * s, Screen.height / 2f - 40 * s, 440 * s, 40 * s), $"{G.Day}일 생존 · 늑대 {G.Kills}마리", new GUIStyle(big) { fontSize = (int)(16 * s) });
                if (GUI.Button(new Rect(Screen.width / 2f - 90 * s, Screen.height / 2f + 30 * s, 180 * s, 44 * s), "다시 시작")) NewGame(seed);
            }
        }

        void Bar(int i, string label, double v, Color c, float s)
        {
            var r = new Rect(12 * s, (12 + i * 24) * s, 200 * s, 18 * s);
            GUI.color = new Color(0, 0, 0, 0.5f); GUI.DrawTexture(r, Texture2D.whiteTexture);
            GUI.color = c; GUI.DrawTexture(new Rect(r.x, r.y, r.width * (float)(v / 100.0), r.height), Texture2D.whiteTexture);
            // white text with a dark 1 px shadow: readable on the yellow (warmth) and green (stamina) bars too (PC WebGL check)
            var st = new GUIStyle(GUI.skin.label) { fontSize = (int)(12 * s) }; string text = $"{label} {Mathf.CeilToInt((float)v)}";
            st.normal.textColor = new Color(0, 0, 0, 0.85f); GUI.Label(new Rect(r.x + 7, r.y, r.width, r.height + 4), text, st);
            st.normal.textColor = Color.white; GUI.color = Color.white; GUI.Label(new Rect(r.x + 6, r.y - 1, r.width, r.height + 4), text, st);
        }

        void CraftPanel(float s, GUIStyle box)
        {
            var r = new Rect(Screen.width / 2f - 260 * s, Screen.height / 2f - 200 * s, 520 * s, 400 * s);
            GUI.Box(r, "제작 — 도구는 하나씩, 고기는 모닥불 옆에서 (C 닫기)", box);
            int i = 0;
            foreach (var kv in SurvivalRules.Recipes)
            {
                var need = string.Join(", ", kv.Value.Need.Select(n => $"{SurvivalRules.Items[n.Key].Ko} {G.Get(n.Key)}/{n.Value}"));
                var b = new Rect(r.x + 16 * s, r.y + (40 + i * 54) * s, r.width - 32 * s, 46 * s);
                if (GUI.Button(b, $"{SurvivalRules.Items[kv.Key].Ko}   ({need}{(kv.Value.NearFire ? " · 모닥불 옆" : "")})"))
                {
                    string why = SurvivalRules.Craft(G, kv.Key);
                    Say(why == "" ? $"{SurvivalRules.Items[kv.Key].Ko} 제작" : why == "fire" ? "모닥불 옆에서만 구울 수 있다" : why == "have" ? "이미 가지고 있다" : "재료가 부족하다");
                }
                i++;
            }
        }
    }
}
