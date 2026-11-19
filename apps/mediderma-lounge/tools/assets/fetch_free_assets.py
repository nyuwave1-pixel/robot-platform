"""
무료(CC0) 원본 에셋을 공식 출처에서 받아 tools/assets/incoming/ 에 둔다 (git 에는 올리지 않는다).
    python3 tools/assets/fetch_free_assets.py
받은 파일마다 SHA-256 을 확인한다. 값이 바뀌었으면 출처가 파일을 갱신한 것이니 라이선스를 다시 확인한다.
가공(크기 조정·색 보정·변환)은 tools/assets/build_free_assets.py 가 한다. 대장: docs/ASSET_LICENSES.md
"""
import hashlib, os, subprocess, sys, zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
IN = os.path.join(HERE, "incoming")
GD = "https://drive.usercontent.google.com/download?export=download&confirm=t&id="
OGA = "https://opengameart.org/sites/default/files/"

# (저장 이름, URL, SHA-256)
SOURCES = [
    # Quaternius — Ultimate Stylized Nature (CC0) · https://quaternius.com/packs/ultimatestylizednature.html
    ("quaternius_nature/AllModels.blend", GD + "12WwC98OOyOZzXUqjAC4NEKtR05k0JmW9", "6dbd16ccc5bbbf5f59306c4e49fa875552d35fd95a7bfc84f521af8fb35a60cd"),
    ("quaternius_nature/License.txt", GD + "1W3YGLar9Ie0Lwfw7QJv1x8oBLKFPuOkW", "de990ef6fc68cffd7fd1ae342c4d0c823b541b8848d8f76bca5d3339f4de6f6e"),
    ("quaternius_nature/Bush_Leaves.png", GD + "1yBz894w6XWBFvcQ75GDaRoQaunCHx4Q0", "9f662296a285ca56b1ed56e952a198b93b466ae39ab7b6ee1c1ac1bd1c46242f"),
    ("quaternius_nature/Flowers.png", GD + "1aVoa3KmIjIlIA5MhvUn7Z5trLRBlM1r6", "23673fc87e55d8f7cbc699581a164cffec505376bd8b0b90b593dc387aa569fd"),
    ("quaternius_nature/Grass.png", GD + "1JOnNDiQhoUzB637HUMaOASCySSEW9UFx", "facde747020acfefdc84d176dd4037282895d200a66fc20b0d9baca470f310f1"),
    # Poly Haven (CC0) · https://polyhaven.com/a/kloofendal_43d_clear_puresky
    ("polyhaven/kloofendal_43d_clear_puresky_1k.hdr", "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/kloofendal_43d_clear_puresky_1k.hdr", "de7ba9d0b070470dbb70d0144294c8708068df353537b26ab59c394707e84377"),
    # ambientCG (CC0) · https://ambientcg.com/view?id=…
    ("ambientcg/Grass004_1K-JPG.zip", "https://ambientcg.com/get?file=Grass004_1K-JPG.zip", "4b63495f459db8481f4d5144e4e9069345c81cf898cc71f2216f5dd3bb344469"),
    ("ambientcg/Fabric086_1K-JPG.zip", "https://ambientcg.com/get?file=Fabric086_1K-JPG.zip", "f36d944b15b9c1088dc880c46e2f5286d93cdfd44a5e68a63c1b61e6cc193fbb"),
    ("ambientcg/Concrete034_1K-JPG.zip", "https://ambientcg.com/get?file=Concrete034_1K-JPG.zip", "5839d284d94ffb8d2a56df742ec522b13dd311c52dbd42b8fd33f0409ceedb81"),
    # OpenGameArt (각 페이지에서 CC0 확인)
    ("oga/kenney_interfaceSounds.zip", OGA + "kenney_interfaceSounds.zip", "f2193d072726d6758a5f7871b2dcc54dcce0d5c35c6f0a62f92549b327c81232"),  # /content/interface-sounds · Kenney
    ("oga/apple_cider.ogg", OGA + "apple_cider.ogg", "29dfe7f2491fa2cabd159db70db868445be253e395db5f75b30b3113f798f4ca"),  # /content/apple-cider · Zane Little Music
    ("oga/hot_spring_town_1.ogg", OGA + "hot_spring_town_1.ogg", "2a38145b9f898aab620ff6b70e2ceb7604fe01e3eeee1a2e34f885796d654869"),  # /content/hot-springs-town · Kistol
    ("oga/park_ambience_birds.wav", OGA + "park_ambience_birds.wav", "dc1a5ac34b89cab7f8f261b53a23da7c1c5e3cc895aae4cb6fb4a1a04001b2af"),  # /content/park-ambiences · Thimras
    ("oga/sfx_100_v2.zip", OGA + "sfx_100_v2.zip", "0fc61b4494e2e893c0c015ced4877b3f689c7d84a48cb61daecd7ddb52db797b"),  # /content/100-cc0-sfx-2 · rubberduck
]

# itch.io "Name your own price"(0원 가능) 팩 — 브라우저 절차로 받는다 (tools/assets/itch_download.cjs)
# Quaternius (CC0) · https://quaternius.itch.io/universal-base-characters · /universal-animation-library
ITCH = [
    ("quaternius_ubc/UBC_Standard.zip", "quaternius", "universal-base-characters", "Standard", "fdbf1804c90dfc1ea03e992bff7da2dfd1a79318e13270a660180f9308455f40"),
    ("quaternius_ual/UAL_Standard.zip", "quaternius", "universal-animation-library", "Standard", "cc73fc4e495b82958207316596317a3f40b9fa38065bde1027937452da537724"),
]


def sha(p):
    return hashlib.sha256(open(p, "rb").read()).hexdigest()


def main():
    bad = 0
    for name, url, want in SOURCES:
        out = os.path.join(IN, name)
        os.makedirs(os.path.dirname(out), exist_ok=True)
        if not os.path.exists(out) or (want and sha(out) != want):
            subprocess.run(["curl", "-sL", "-m", "600", "--fail", url, "-o", out], check=True)
        got = sha(out)
        ok = want is None or got == want
        bad += not ok
        print(f"{'OK ' if ok else 'BAD'} {name}  {got}")
        if out.endswith(".zip"):
            with zipfile.ZipFile(out) as z:
                z.extractall(out[:-4])
    here = os.path.dirname(os.path.abspath(__file__))
    for name, creator, slug, want_file, want in ITCH:
        out = os.path.join(IN, name)
        if not os.path.exists(out) or sha(out) != want:
            subprocess.run(["node", os.path.join(here, "itch_download.cjs"), creator, slug, want_file, out], check=True)
        got = sha(out)
        ok = got == want
        bad += not ok
        print(f"{'OK ' if ok else 'BAD'} {name}  {got}")
        with zipfile.ZipFile(out) as z:
            z.extractall(os.path.join(os.path.dirname(out), name.split("/")[1].split("_")[0]))
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
