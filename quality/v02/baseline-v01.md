# FLUFF LAB — Character quality reset

2026-10-19. **목표 시안 품질 미달. 최종 캐릭터로 승인하거나 앱에 교체하지 않음.**

기존 프로젝트 안의 `/?studio=1`에서 두 파이프라인을 비교한다. 앱의 화면 구성, 기존 커스터마이징 데이터와 기존 캐릭터는 유지했다. 이번 변경은 개발용 스튜디오와 별도 캐릭터 실험에 한정된다.

## 실제 제작한 비교

| 항목 | A | B |
|---|---|---|
| 제작 | Three.js + React Three Fiber | Blender 5.2.1 Hair Curves + Geometry Nodes |
| 몸체 | 연속된 pear 형태의 custom geometry, 하부 paw lobe | 동일 표면 데이터를 Blender mesh로 생성 |
| 털 | 26,000개 instanced crossed ribbon, vertex shader 곡선 변형 | 같은 26,000개 가이드로 Hair Curves 생성, Curve to Mesh, GLB export |
| 곡선 | 8 segments, 두 교차 리본 | 9 sample points, 삼각 단면의 가늘어지는 strand mesh |
| 표시 | Three.js 실시간 | GLB를 같은 Three.js 화면·카메라·조명으로 표시 |
| 기본 장면 triangles | 859,138 | 1,275,138 |
| draw calls | 6 | 6 |
| 프레임 간격 중앙값 / p95 | 16.7 / 17.5 ms | 16.7 / 17.6 ms |
| 외형 조정 | 12개 파라미터 실시간 | 눈·roughness·lighting 실시간. 몸체와 groom은 Blender 재생성 필요 |
| 배포 데이터 | 작은 기본 메시 + instance attributes | GLB 약 31 MiB |

측정은 현재 Mac의 in-app browser, DPR 상한 1.5, 기본 설정, 워밍업 뒤 180 frames의 `useFrame` 간격이다. GPU 시간이나 휴대폰 성능 측정이 아니다. 다른 시점·기기의 성능 보장은 아니다. 실제 triangles에는 피부·눈·바닥 등이 포함된다.

B의 원본 `.blend`에는 편집 가능한 Hair Curves와 변환 노드가 남아 있다. GLB는 실제 메시이며 이미지 평면이 아니다. 눈은 비교 조건을 맞추기 위해 스튜디오에서 공통 3D mesh로 조립한다. 따라서 `.blend` 자체는 몸체와 groom 원본이다.

## 원인과 수정

기존 엔진은 변형된 구체, 별도 구형 팔다리, 균일한 교차 리본 털이었다. 단순히 R3F로 바꾸는 것만으로는 형태나 재질 품질이 좋아지지 않는다.

- 몸체 하부에 부피와 paw lobe를 넣고, 별도 구형 팔다리를 없앴다.
- 규칙적인 털 배열을 결정론적인 불규칙 분포로 바꾸었다.
- 털 길이에 층을 주고, 방향·곡률·끝 두께를 조정했다.
- 눈 주변만 털을 짧게 하며 크기·간격·깊이를 분리했다.
- A의 per-hair geometry 복제 대신 instanced attributes로 전달했다.
- B의 변환 노드 Scale에 반지름을 명시적으로 연결했다. 자동 곡선 세분화로 생긴 약 345 MiB 메시를 9-point resampling으로 약 31 MiB까지 줄였다.

## 시각 검수 판정

| 기준 | 판정 및 남은 차이 |
|---|---|
| 털이 선처럼 보이지 않는가 | **미달.** 가는 섬유와 점상 aliasing이 남음. 시안의 부드러운 솜털 뭉치가 부족함. |
| 단순 구체가 아닌가 | 부분 개선. 낮은 pear 형태지만 측면은 여전히 단순한 돔에 가까움. |
| 눈의 결합 | 부분 개선. 작은 검은 눈과 주변 짧은 털은 유지되지만 자연스러운 눈구멍과 주변 부피가 부족함. |
| 팔다리 결합 | 분리된 부품은 제거했지만 지나치게 묻힘. 시안처럼 작게 보이는 발끝과 팔의 존재감이 부족함. |
| 입체 조명 | 3D 조명과 접지 그림자는 작동. 섬유 내부 산란·자기 음영이 부족하고 그림자가 단단함. |
| 측면 실루엣 | 360° 표면은 존재하지만 귀여운 측면 비례는 아직 미달. |
| 커스터마이징 구조 | A의 12개 파라미터, 버전 있는 JSON 저장·내보내기 구현. B groom은 고정 베이크. |

**현재 A는 실시간 형태 조정 실험용으로 유지한다. 이것은 디자인 품질 승인 결정이 아니다.** 같은 가이드를 Blender로 옮기는 것만으로는 품질 차이가 크지 않았다. 두 가지 도구의 잠재적 최상 품질을 비교한 실험도 아니다. B에는 아티스트가 손으로 sculpt/groom한 결과가 아직 없다.

다음 품질 개선은 밀도 증가보다 다음 세 항목이 우선이다.
1. 몸체·팔·발의 연결 부피를 sculpt하고 정면과 측면의 캐릭터성을 먼저 확보.
2. 이마·볼·등·아랫단의 서로 다른 방향을 갖는 groom guide를 만들고, 짧은 속털과 긴 clump를 분리.
3. 자체 음영과 부드러운 섬유 반사를 적용하고, groom을 LOD/hair cards로 변환해 성능과 함께 검증.

## 저장·검증

- 스튜디오 전용 localStorage: `fluff-character-studio:v1`, `{version:1, parameters}`. 기존 앱 저장값과 분리.
- 12개 슬라이더 입력, 기준값 복원, 새로고침 후 설정 유지 확인.
- 정면·3/4·측면·후면과 드래그 자유 회전 확인.
- 1280px 비교 화면과 390px 화면 확인. 390px에서 가로 overflow 없음.
- TypeScript check, Expo web export, 기존 geometry tests, 새 studio tests 통과.
- 극단 파라미터에서 finite geometry, 잘못된 저장값 범위 제한, deterministic groom 검증.
- 브라우저 error log 없음. Three Clock/PCFSoftShadowMap deprecation warning은 존재.
- 네이티브 앱 실행, 실제 휴대폰 GPU, WebGL context 복구, 장시간 메모리 안정성은 미검증.

## 실제 렌더링

사진 생성이나 보정 없이 브라우저에서 저장한 화면이다. 오른쪽에 승인된 TYPE B 레퍼런스를 같이 표시했다.

| 시점 | A | B |
|---|---|---|
| 정면 | [A 정면](a-front.png) | [B 정면](b-front.png) |
| 3/4 | [A 3/4](a-three-quarter.png) | [B 3/4](b-three-quarter.png) |
| 측면 | [A 측면](a-side.png) | [B 측면](b-side.png) |

[후면](a-back.png) · [390px 화면](studio-narrow.png)

## 재생성

프로젝트 루트에서 Node 24 사용:

```sh
npm run studio:source
/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup --python src/studio/build_blender.py -- .studio-build/source.json public/studio
npm run studio:test
npm run typecheck
npm run build
```

현재 환경에서는 Blender가 제한된 실행 환경에서 충돌했고, 허용된 별도 실행에서는 정상 동작했다. Blender Python 파일은 API 키나 외부 서비스를 사용하지 않는다.

원본: [Blender Hair Curves](../public/studio/character-source.blend) · [GLB](../public/studio/character-b.glb) · [Blender export metrics](../public/studio/blender-metrics.json)

참고: [R3F 소개](https://r3f.docs.pmnd.rs/getting-started/introduction), [Three InstancedBufferGeometry](https://threejs.org/docs/pages/InstancedBufferGeometry.html), [Blender Hair Nodes](https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/hair/index.html).
