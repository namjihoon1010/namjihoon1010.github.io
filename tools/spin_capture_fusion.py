# 360° turntable capture for Fusion (run inside Fusion: Scripts, or the Fusion MCP "script" tool).
# Used for the kart viewer on 2026-11-23:
#   document  : 3D GOKART / "카트 프로토타입2222222222" v184 (Y-up model)
#   center    : bounding-box center of the root component, in cm
#   camera    : orthographic, 30° above horizon, 600 cm away (distance only matters for ortho clipping)
#   frames    : 24, every 15°, starting at 35°
#   zoom      : viewExtents 200 (same for every frame so the size never jumps)
#   output    : 2400x1600 PNG, transparent background, anti-aliased
# Then run spin_postprocess.py to crop all frames the same way and make the WebP files.
import adsk.core, adsk.fusion, math, os

OUT = r'C:/temp/spin'       # change
N, START_DEG = 24, 35
ELEV_DEG, DIST, EXTENTS = 30, 600.0, 200
W, H = 2400, 1600

def run(_context: str):
    app = adsk.core.Application.get()
    design = adsk.fusion.Design.cast(app.activeProduct)
    bb = design.rootComponent.boundingBox
    c = adsk.core.Point3D.create(*[(a + b) / 2 for a, b in zip(bb.minPoint.asArray(), bb.maxPoint.asArray())])
    os.makedirs(OUT, exist_ok=True)
    vp, elev = app.activeViewport, math.radians(ELEV_DEG)
    for i in range(N):
        ang = math.radians(START_DEG + i * 360 / N)
        cam = vp.camera
        cam.isSmoothTransition = False
        cam.cameraType = adsk.core.CameraTypes.OrthographicCameraType
        cam.target = c
        cam.eye = adsk.core.Point3D.create(c.x + DIST * math.cos(elev) * math.cos(ang),
                                           c.y + DIST * math.sin(elev),          # Y-up; for Z-up swap y/z
                                           c.z + DIST * math.cos(elev) * math.sin(ang))
        cam.upVector = adsk.core.Vector3D.create(0, 1, 0)
        cam.viewExtents = EXTENTS
        vp.camera = cam
        vp.refresh(); adsk.doEvents()
        o = adsk.core.SaveImageFileOptions.create(f'{OUT}/kart_{i:02d}.png')
        o.width, o.height = W, H
        o.isBackgroundTransparent = True
        o.isAntiAliased = True
        vp.saveAsImageFileWithOptions(o)
    print('saved', N, 'frames to', OUT)
