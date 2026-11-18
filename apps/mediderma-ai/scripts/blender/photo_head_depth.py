"""
사진 → 머리·헤어·목까지 포함한 깊이 맵 (photo_head.py 의 입력).  numpy · scipy · opencv 가 있는 Python 에서 실행.

  python photo_head_depth.py <dir>
    <dir>/up.png          초해상도로 키운 사진
    <dir>/mask.png        인물 마스크 (0~255, 배경 0)
    <dir>/lm/landmarks.json   extract_landmarks.mjs 결과 (up.png 기준)
  출력: <dir>/depth.npy (px 단위, 카메라 쪽 +),  <dir>/texture.png (RGBA, 알파 = 정리된 마스크)

방법
  - 얼굴 윤곽 안: MediaPipe 랜드마크의 깊이를 보간한 실제 얼굴 형상
  - 윤곽 밖(머리카락·귀·목·어깨): 마스크를 둥글게 부풀린 형상(거리 변환 → 원형 단면)
  - 두 형상을 윤곽 경계에서 높이를 맞춘 뒤 부드럽게 섞는다.
"""
import json, sys, os
import numpy as np, cv2
from scipy.interpolate import griddata

D = sys.argv[1]
img = cv2.imread(os.path.join(D, "up.png"))
H, W = img.shape[:2]
m = cv2.imread(os.path.join(D, "mask.png"), cv2.IMREAD_GRAYSCALE).astype(np.float32) / 255
lm = json.load(open(os.path.join(D, "lm", "landmarks.json")))
P = np.array(lm["landmarksPx"], np.float32).reshape(-1, 3)[:468]
OVAL = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150,
        136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109]
fw = float(np.linalg.norm(P[454, :2] - P[234, :2]))
fx, fy = P[:, 0].mean(), P[:, 1].mean()
chin_y, top_y = P[152, 1], P[10, 1]
fh = chin_y - top_y

# ── 마스크 정리: 머리(타원) ∪ 턱 아래 몸통 영역 안의 가장 큰 덩어리만 남긴다 (배경 기구·사람 제거)
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
head = ((xx - fx) / (0.74 * fw)) ** 2 + ((yy - (fy - 0.14 * fh)) / (0.86 * fh)) ** 2 <= 1.0
body = (yy > chin_y - 0.1 * fh) & (np.abs(xx - fx) < 1.6 * fw)
# 정수리 쪽은 좌우 폭을 더 좁혀 머리 뒤 배경(기둥 등)이 붙지 않게
crown = (yy < top_y) & (np.abs(xx - fx) > 0.50 * fw)
prior = ((head & ~crown) | body).astype(np.uint8)
prior = cv2.GaussianBlur(prior.astype(np.float32), (0, 0), fw * 0.03)
alpha = m * prior
# 이마 위(머리카락 영역)에서 밝은 픽셀은 머리카락이 아닌 배경(기구·벽)으로 보고 뺀다
lum = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.float32)
hairzone = (yy < top_y + 0.02 * fh).astype(np.float32)
hairzone = cv2.GaussianBlur(hairzone, (0, 0), fw * 0.02)
dark = np.clip((120 - cv2.GaussianBlur(lum, (0, 0), 2)) / 40, 0, 1)
ycc = cv2.cvtColor(img, cv2.COLOR_BGR2YCrCb).astype(np.float32)
skin = np.clip((cv2.GaussianBlur(ycc[:, :, 1], (0, 0), 2) - 134) / 8, 0, 1)   # 피부(이마)는 살린다
protect = (((xx - fx) / (0.50 * fw)) ** 2 + ((yy - (fy - 0.16 * fh)) / (0.70 * fh)) ** 2 <= 1.0).astype(np.float32)   # 이마
protect = cv2.GaussianBlur(protect, (0, 0), fw * 0.02)
alpha = alpha * (1 - hairzone * (1 - dark) * (1 - skin) * (1 - protect))
b = (alpha > 0.5).astype(np.uint8)
n, lab, stats, _ = cv2.connectedComponentsWithStats(b)
keep = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
b = (lab == keep).astype(np.uint8)
alpha = alpha * cv2.dilate(b, np.ones((5, 5), np.uint8)).astype(np.float32)
# 아래쪽(어깨)은 화면 밖으로 잘려 있으므로 부드럽게 사라지게
fade = np.clip((H - yy) / (0.18 * H), 0, 1)
alpha *= fade
alpha *= np.clip(yy / (0.05 * H), 0, 1)   # 사진 위쪽에서 잘린 정수리도 부드럽게

# ── 부풀린 형상 (원형 단면)
dist = cv2.distanceTransform(b, cv2.DIST_L2, 5)
R = 0.55 * fw
t = np.clip(dist / R, 0, 1)
inflate = 0.5 * fw * np.sqrt(1 - (1 - t) ** 2)
inflate = cv2.GaussianBlur(inflate, (0, 0), fw * 0.07)   # 거리 변환의 중심선 능선 제거

# ── 얼굴 형상 (랜드마크 깊이 보간). MediaPipe z 는 카메라 쪽이 음수 → 부호를 바꾼다
fd = griddata(P[:, :2], -P[:, 2], (xx, yy), method="linear")
inside = ~np.isnan(fd)
oval = P[OVAL]
off = float(np.mean([inflate[int(y), int(x)] for x, y, _ in oval]) - np.mean(-oval[:, 2]))
fd = np.where(inside, fd + off, 0)
# 경계에서 섞는 가중치 (얼굴 안쪽으로 갈수록 1)
ins = inside.astype(np.uint8)
w = np.clip(cv2.distanceTransform(ins, cv2.DIST_L2, 5) / (0.14 * fw), 0, 1)
w = w * w * (3 - 2 * w)
depth = w * fd + (1 - w) * inflate
depth = cv2.GaussianBlur(depth, (0, 0), fw * 0.006)   # 보간 삼각형 경계의 계단 완화
depth = np.where(b > 0, depth, cv2.GaussianBlur(depth, (0, 0), 3))
np.save(os.path.join(D, "depth.npy"), depth.astype(np.float32))
rgba = np.dstack([img, (alpha * 255).astype(np.uint8)])
cv2.imwrite(os.path.join(D, "texture.png"), rgba)
json.dump({"width": W, "height": H, "faceWidthPx": fw, "center": [float(fx), float(fy - 0.1 * fh)]}, open(os.path.join(D, "meta.json"), "w"))
print("depth", depth.shape, "range", float(depth.min()), float(depth.max()), "faceW", round(fw))
